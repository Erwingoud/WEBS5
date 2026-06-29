import express from "express";
import { z } from "zod";
import { env } from "../env";
import { authBreaker, getErrorBody, getErrorStatus } from "../http";
import { validateRequest } from "../middleware/validation";
import { requireAuth } from "../middleware/auth";

const router = express.Router();

router.use(express.json());

const loginSchema = z.object({
  body: z.object({
    email: z.email(),
    password: z.string().min(1),
  }),
});

router.post("/login", validateRequest(loginSchema), async (req, res) => {
  try {
    const result = await authBreaker.fire({
      method: "POST",
      url: `${env.authEndpoint}/login`,
      data: req.body,
    });

    res.status(200).json(result);
  } catch (error) {
    res.status(getErrorStatus(error)).json(getErrorBody(error));
  }
});

const registerSchema = z.object({
  body: z.object({
    email: z.email(),
    username: z.string().min(2).max(30),
    role: z.enum(["owner", "participant"]),
  }),
});

router.post("/register", validateRequest(registerSchema), async (req, res) => {
  try {
    const result = await authBreaker.fire({
      method: "POST",
      url: `${env.authEndpoint}/register`,
      data: req.body,
    });

    res.status(201).json(result);
  } catch (error) {
    res.status(getErrorStatus(error)).json(getErrorBody(error));
  }
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const result = await authBreaker.fire({
      method: "GET",
      url: `${env.authEndpoint}/me`,
      headers: {
        Authorization: req.header("Authorization"),
      },
    });

    res.status(200).json(result);
  } catch (error) {
    res.status(getErrorStatus(error)).json(getErrorBody(error));
  }
});

export default router;
