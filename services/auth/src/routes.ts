import express from "express";
import { login, register, me } from "./controller";

const router = express.Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "auth" });
});

router.post("/register", register);
router.post("/login", login);
router.get("/me", me);

export default router;
