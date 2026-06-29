import { createHash, randomUUID } from "node:crypto";
import {
  Queues,
  sendToQueue,
  type ScoreReadyEvent,
  type ScoreRequestEvent,
  type TargetExpiredEvent,
  type TargetMailFinalReportEvent,
  type TargetMailReminderEvent,
  type TargetMailScoreEvent,
  type TargetRemindEvent,
  type TargetUploadScore,
} from "@photo-prestiges/common";
import { Target, type TargetDocument } from "../database";
import { env } from "../env";
import { uploadImage } from "./s3service";
import { classify } from "./classificationService";

export function createBufferHash(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

export async function processImage(
  data: Buffer,
): Promise<{ id: string; classifiers: Awaited<ReturnType<typeof classify>> }> {
  const id = randomUUID();

  await uploadImage(id, data);

  const classifiers = await classify(data);

  return {
    id,
    classifiers,
  };
}

export async function queueScoreGeneration(
  target: TargetDocument,
  username: string,
): Promise<void> {
  const upload = target.uploads.find((item) => item.username === username);

  if (!upload) {
    throw new Error(`Upload not found for user ${username}`);
  }

  const event: ScoreRequestEvent = {
    targetId: target._id.toString(),
    username: upload.username,
    deadline: target.deadline.toISOString(),
    targetTags: target.classifiers,
    submissionTags: upload.classifiers,
    startTime: target.createdAt.toISOString(),
  };

  await sendToQueue(env.rabbitmqUrl, Queues.scoreRequest, event);

  console.log(`Queued score request for ${upload.username}`);
}

export async function saveScore(message: ScoreReadyEvent): Promise<void> {
  const target = await Target.findById(message.targetId);

  if (!target) {
    console.error("No target found during score save:", message);
    return;
  }

  const player = target.uploads.find(
    (upload) => upload.username === message.username,
  );

  if (!player) {
    console.error("Player not found during score save:", message);
    return;
  }

  player.score = message.score;
  player.scoringTime = new Date();

  await target.save();

  console.log(`Score updated for player ${message.username}`);
}

export async function sendTargetReminder(
  message: TargetRemindEvent,
): Promise<void> {
  const target = await Target.findById(message.id);

  if (!target) {
    console.error("No target found during reminder:", message);
    return;
  }

  for (const upload of target.uploads) {
    if (upload.score !== undefined || !upload.email) {
      continue;
    }

    const event: TargetMailReminderEvent = {
      title: target.title,
      endDate: target.deadline.toISOString(),
      email: upload.email,
    };

    await sendToQueue(env.rabbitmqUrl, Queues.targetMailReminder, event);
  }
}

export async function targetExpiry(message: TargetExpiredEvent): Promise<void> {
  const target = await Target.findById(message.id);

  if (!target) {
    console.error("No target found during expiry:", message);
    return;
  }

  const uploads: TargetUploadScore[] = target.uploads
    .filter((upload) => upload.score !== undefined)
    .map((upload) => ({
      username: upload.username,
      score: upload.score ?? 0,
      submittedAt: upload.scoringTime?.toISOString(),
    }));

  const finalReportEvent: TargetMailFinalReportEvent = {
    title: target.title,
    uploads,
    email: target.email,
  };

  await sendToQueue(
    env.rabbitmqUrl,
    Queues.targetMailFinalReport,
    finalReportEvent,
  );

  for (const upload of target.uploads) {
    if (upload.score === undefined || !upload.email) {
      continue;
    }

    const scoreEvent: TargetMailScoreEvent = {
      title: target.title,
      score: upload.score,
      email: upload.email,
    };

    await sendToQueue(env.rabbitmqUrl, Queues.targetMailScore, scoreEvent);
  }

  console.log(`Target expired and mails queued: ${target._id.toString()}`);
}
