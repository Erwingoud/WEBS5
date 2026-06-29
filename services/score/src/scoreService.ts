import {
  Queues,
  sendToQueue,
  type ImageClassifier,
  type ScoreReadyEvent,
  type ScoreRequestEvent,
} from "@photo-prestiges/common";
import { Score } from "./database";
import { env } from "./env";

interface CalculatedScore {
  score: number;
  similarityScore: number;
  timeScore: number;
}

export async function handleScoreRequest(
  message: ScoreRequestEvent,
): Promise<void> {
  validateScoreRequest(message);

  const calculated = calculateScore(message);

  await Score.findOneAndUpdate(
    {
      targetId: message.targetId,
      username: message.username,
    },
    {
      targetId: message.targetId,
      username: message.username,
      score: calculated.score,
      similarityScore: calculated.similarityScore,
      timeScore: calculated.timeScore,
    },
    {
      upsert: true,
      new: true,
      runValidators: true,
    },
  );

  const event: ScoreReadyEvent = {
    targetId: message.targetId,
    username: message.username,
    score: calculated.score,
  };

  await sendToQueue(env.rabbitmqUrl, Queues.scoreReady, event);

  console.log(
    `Calculated score ${calculated.score}% for ${message.username} on target ${message.targetId}`,
  );
}

function validateScoreRequest(message: ScoreRequestEvent): void {
  if (!message.targetId) throw new Error("Missing targetId");
  if (!message.username) throw new Error("Missing username");
  if (!message.deadline) throw new Error("Missing deadline");
  if (!message.startTime) throw new Error("Missing startTime");

  if (!Array.isArray(message.targetTags)) {
    throw new Error("targetTags must be an array");
  }

  if (!Array.isArray(message.submissionTags)) {
    throw new Error("submissionTags must be an array");
  }
}

function calculateScore(message: ScoreRequestEvent): CalculatedScore {
  const similarityScore = calculateSimilarityScore(
    message.targetTags,
    message.submissionTags,
  );

  const timeScore = calculateTimeScore(message.startTime, message.deadline);

  // Assignment says fastest + highest similarity wins.
  // Similarity matters most, but earlier submission still helps.
  const score = Math.round(similarityScore * 0.8 + timeScore * 0.2);

  return {
    score: clamp(score),
    similarityScore,
    timeScore,
  };
}

function calculateSimilarityScore(
  targetTags: ImageClassifier[],
  submissionTags: ImageClassifier[],
): number {
  if (!targetTags.length || !submissionTags.length) {
    return 0;
  }

  const submissionByTag = new Map(
    submissionTags.map((item) => [normalizeTag(item.tag), item.confidence]),
  );

  let matchedWeight = 0;
  let totalWeight = 0;

  for (const targetTag of targetTags) {
    const tag = normalizeTag(targetTag.tag);
    const targetConfidence = targetTag.confidence;

    totalWeight += targetConfidence;

    const submissionConfidence = submissionByTag.get(tag);

    if (submissionConfidence === undefined) {
      continue;
    }

    const confidenceDifference = Math.abs(
      targetConfidence - submissionConfidence,
    );

    const confidenceScore = Math.max(0, 100 - confidenceDifference);

    matchedWeight += targetConfidence * (confidenceScore / 100);
  }

  if (totalWeight <= 0) {
    return 0;
  }

  return clamp(Math.round((matchedWeight / totalWeight) * 100));
}

function calculateTimeScore(
  startTimeValue: string,
  deadlineValue: string,
): number {
  const startTime = new Date(startTimeValue).getTime();
  const deadline = new Date(deadlineValue).getTime();
  const now = Date.now();

  if (
    Number.isNaN(startTime) ||
    Number.isNaN(deadline) ||
    deadline <= startTime
  ) {
    return 0;
  }

  const totalDuration = deadline - startTime;
  const elapsed = Math.max(0, now - startTime);

  const remainingRatio = Math.max(0, 1 - elapsed / totalDuration);

  return clamp(Math.round(remainingRatio * 100));
}

function normalizeTag(tag: string): string {
  return tag.trim().toLowerCase();
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
}
