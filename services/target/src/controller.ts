import type { Request, Response } from "express";
import {
  Queues,
  sendToQueue,
  type TargetCreatedEvent,
} from "@photo-prestiges/common";
import { Target } from "./database";
import { env } from "./env";
import { deleteImage, getImage } from "./services/s3service";
import {
  createBufferHash,
  processImage,
  queueScoreGeneration,
} from "./services/targetService";

export async function getTargets(
  req: Request,
  res: Response,
): Promise<Response> {
  const { username, city, country } = req.query;

  const filters: Record<string, string> = {};

  if (typeof username === "string") filters.username = username;
  if (typeof city === "string") filters.city = city;
  if (typeof country === "string") filters.country = country;

  const results = await Target.find(filters);

  return res.json(results.map((target) => target.toPublic()));
}

export async function createTarget(
  req: Request,
  res: Response,
): Promise<Response> {
  if (!req.user) {
    return res.status(401).json({ error: "Missing authenticated user" });
  }

  const { title, city, country, deadline } = req.body as {
    title?: string;
    city?: string;
    country?: string;
    deadline?: string;
  };

  if (!title || !city || !country || !deadline) {
    return res.status(400).json({
      error: "Missing required fields: title, city, country, deadline",
    });
  }

  const deadlineDate = new Date(deadline);

  if (Number.isNaN(deadlineDate.getTime())) {
    return res.status(400).json({ error: "Invalid deadline" });
  }

  if (deadlineDate <= new Date()) {
    return res.status(400).json({ error: "Deadline must be in the future" });
  }

  try {
    const target = new Target({
      username: req.user.username,
      email: req.user.email,
      title,
      city,
      country,
      deadline: deadlineDate,
    });

    await target.save();

    const event: TargetCreatedEvent = {
      id: target._id.toString(),
      deadline: target.deadline.toISOString(),
    };

    await sendToQueue(env.rabbitmqUrl, Queues.targetCreated, event);

    return res.status(201).json({
      id: target._id.toString(),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Could not create target" });
  }
}

export async function uploadTargetImage(
  req: Request,
  res: Response,
): Promise<Response> {
  const target = await Target.findById(req.params.targetId);

  if (!target) {
    return res.status(404).json({ error: "Target not found" });
  }

  if (!req.user || req.user.username !== target.username) {
    return res.status(403).json({ error: "You do not own this target" });
  }

  if (!req.file) {
    return res.status(400).json({ error: "Missing image file" });
  }

  if (target.imageId) {
    return res.status(400).json({ error: "Target already has an image" });
  }

  try {
    const hash = createBufferHash(req.file.buffer);
    const data = await processImage(req.file.buffer);

    target.imageId = data.id;
    target.hash = hash;
    target.classifiers = data.classifiers;

    await target.save();

    return res.sendStatus(200);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Could not upload target image" });
  }
}

export async function viewImage(req: Request, res: Response): Promise<void> {
  const { imageId } = req.params;

  if (typeof imageId !== "string") {
    res.status(400).json({ error: "Invalid image id" });
    return;
  }

  try {
    const image = await getImage(imageId);

    res.setHeader("Content-Type", image.contentType ?? "image/jpeg");
    res.setHeader("Cache-Control", "public, max-age=86400");

    image.body.pipe(res);
  } catch (error) {
    console.error(error);
    res.status(404).json({ error: "Image not found" });
  }
}

export async function deleteTarget(
  req: Request,
  res: Response,
): Promise<Response> {
  const target = await Target.findById(req.params.targetId);

  if (!target) {
    return res.status(404).json({ error: "Target not found" });
  }

  if (!req.user || req.user.username !== target.username) {
    return res.status(403).json({ error: "You do not own this target" });
  }

  if (target.imageId) {
    await deleteImage(target.imageId);
  }

  for (const upload of target.uploads) {
    if (upload.imageId) {
      await deleteImage(upload.imageId);
    }
  }

  await Target.deleteOne({ _id: target._id });

  return res.sendStatus(200);
}

export async function listParticipants(
  req: Request,
  res: Response,
): Promise<Response> {
  const target = await Target.findById(req.params.targetId);

  if (!target) {
    return res.status(404).json({ error: "Target not found" });
  }

  return res.json(target.toPublic().uploads);
}

export async function addParticipant(
  req: Request,
  res: Response,
): Promise<Response> {
  const target = await Target.findById(req.params.targetId);

  if (!target || target.deadline <= new Date()) {
    return res
      .status(404)
      .json({ error: "Target not found or already closed" });
  }

  if (!req.user) {
    return res.status(401).json({ error: "Missing authenticated user" });
  }

  if (target.username === req.user.username) {
    return res.status(400).json({ error: "Owner cannot join own target" });
  }

  const alreadyParticipating = target.uploads.some(
    (upload) => upload.username === req.user!.username,
  );

  if (alreadyParticipating) {
    return res.status(409).json({ error: "Already participating" });
  }

  target.uploads.push({
    username: req.user.username,
    email: req.user.email,
    classifiers: [],
  });

  await target.save();

  return res.sendStatus(200);
}

export async function uploadParticipantImage(
  req: Request,
  res: Response,
): Promise<Response> {
  const target = await Target.findById(req.params.targetId);

  if (!target) {
    return res.status(404).json({ error: "Target not found" });
  }

  if (target.deadline <= new Date()) {
    return res.status(400).json({ error: "Target is already closed" });
  }

  if (!req.user) {
    return res.status(401).json({ error: "Missing authenticated user" });
  }

  if (!req.file) {
    return res.status(400).json({ error: "Missing image file" });
  }

  const upload = target.uploads.find(
    (item) => item.username === req.user!.username,
  );

  if (!upload) {
    return res.status(404).json({ error: "You are not participating" });
  }

  if (upload.imageId) {
    return res.status(400).json({ error: "You already uploaded an image" });
  }

  try {
    const hash = createBufferHash(req.file.buffer);

    if (hash === target.hash) {
      return res.status(400).json({
        error: "You cannot upload the exact same image as the target",
      });
    }

    const data = await processImage(req.file.buffer);

    upload.imageId = data.id;
    upload.classifiers = data.classifiers;

    await target.save();

    await queueScoreGeneration(target, req.user.username);

    return res.sendStatus(200);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "Could not upload participant image" });
  }
}

export async function deleteParticipant(
  req: Request,
  res: Response,
): Promise<Response> {
  const target = await Target.findById(req.params.targetId);

  if (!target) {
    return res.status(404).json({ error: "Target not found" });
  }

  if (!req.user) {
    return res.status(401).json({ error: "Missing authenticated user" });
  }

  const upload = target.uploads.find(
    (item) => item.username === req.params.username,
  );

  if (!upload) {
    return res.status(404).json({ error: "Participant not found" });
  }

  const isOwner =
    req.user.role === "owner" && target.username === req.user.username;
  const isOwnUpload = upload.username === req.user.username;

  if (!isOwner && !isOwnUpload) {
    return res.status(403).json({ error: "Forbidden" });
  }

  if (upload.imageId) {
    await deleteImage(upload.imageId);
  }

  target.uploads.pull(upload);

  await target.save();

  return res.sendStatus(200);
}
