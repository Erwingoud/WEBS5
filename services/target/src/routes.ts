import express from "express";
import multer from "multer";
import {
  addParticipant,
  createTarget,
  deleteParticipant,
  deleteTarget,
  getTargets,
  listParticipants,
  uploadParticipantImage,
  uploadTargetImage,
  viewImage,
} from "./controller";
import { requireAuth, requireRole } from "./auth";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024,
  },
});

router.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "target" });
});
router.get("/targets/images/:imageId", viewImage);

router.use(requireAuth);

router.get("/targets", getTargets);

router.post("/targets", requireRole("owner"), createTarget);

router.put(
  "/targets/:targetId/image",
  requireRole("owner"),
  upload.single("file"),
  uploadTargetImage,
);

router.delete("/targets/:targetId", requireRole("owner"), deleteTarget);

router.get("/targets/:targetId/participants", listParticipants);

router.post(
  "/targets/:targetId/participants",
  requireRole("participant"),
  addParticipant,
);

router.delete("/targets/:targetId/participants/:username", deleteParticipant);

router.put(
  "/targets/:targetId/participants/:username/image",
  requireRole("participant"),
  upload.single("file"),
  uploadParticipantImage,
);

export default router;
