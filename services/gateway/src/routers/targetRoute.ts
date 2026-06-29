import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { z } from "zod";
import { env } from "../env";
import { getErrorBody, getErrorStatus, targetBreaker } from "../http";
import { requireAuth, requireRole } from "../middleware/auth";
import { validateRequest } from "../middleware/validation";

const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const result = await targetBreaker.fire({
      method: "GET",
      url: `${env.targetEndpoint}/targets`,
      headers: {
        Authorization: req.header("Authorization"),
      },
      params: req.query,
    });

    res.status(200).json(result);
  } catch (error) {
    res.status(getErrorStatus(error)).json(getErrorBody(error));
  }
});

const createTargetSchema = z.object({
  body: z.object({
    title: z.string().min(1),
    city: z.string().min(1),
    country: z.string().min(1),
    deadline: z.string().datetime(),
  }),
});

router.post(
  "/",
  express.json(),
  requireAuth,
  requireRole("owner"),
  validateRequest(createTargetSchema),
  async (req, res) => {
    try {
      const result = await targetBreaker.fire({
        method: "POST",
        url: `${env.targetEndpoint}/targets`,
        headers: {
          Authorization: req.header("Authorization"),
        },
        data: req.body,
      });

      res.status(201).json(result);
    } catch (error) {
      res.status(getErrorStatus(error)).json(getErrorBody(error));
    }
  },
);

router.delete("/:id", requireAuth, requireRole("owner"), async (req, res) => {
  try {
    const result = await targetBreaker.fire({
      method: "DELETE",
      url: `${env.targetEndpoint}/targets/${req.params.id}`,
      headers: {
        Authorization: req.header("Authorization"),
      },
    });

    res.status(200).json(result ?? {});
  } catch (error) {
    res.status(getErrorStatus(error)).json(getErrorBody(error));
  }
});

router.put(
  "/:id/image",
  requireAuth,
  requireRole("owner"),
  createProxyMiddleware({
    target: env.targetEndpoint,
    changeOrigin: true,
    pathRewrite: (path) =>
      path.replace(/^\/([^/]+)\/image$/, "/targets/$1/image"),
    on: {
      proxyReq: (proxyReq, req) => {
        const authorization = req.headers.authorization;

        if (authorization) {
          proxyReq.setHeader("Authorization", authorization);
        }
      },
    },
  }),
);

router.get("/:id/participants", requireAuth, async (req, res) => {
  try {
    const result = await targetBreaker.fire({
      method: "GET",
      url: `${env.targetEndpoint}/targets/${req.params.id}/participants`,
      headers: {
        Authorization: req.header("Authorization"),
      },
    });

    res.status(200).json(result);
  } catch (error) {
    res.status(getErrorStatus(error)).json(getErrorBody(error));
  }
});

router.post(
  "/:id/participants",
  requireAuth,
  requireRole("participant"),
  async (req, res) => {
    try {
      await targetBreaker.fire({
        method: "POST",
        url: `${env.targetEndpoint}/targets/${req.params.id}/participants`,
        headers: {
          Authorization: req.header("Authorization"),
        },
      });

      res.sendStatus(200);
    } catch (error) {
      res.status(getErrorStatus(error)).json(getErrorBody(error));
    }
  },
);

router.put(
  "/:id/participants/:username/image",
  requireAuth,
  requireRole("participant"),
  createProxyMiddleware({
    target: env.targetEndpoint,
    changeOrigin: true,
    pathRewrite: (path) =>
      path.replace(
        /^\/([^/]+)\/participants\/([^/]+)\/image$/,
        "/targets/$1/participants/$2/image",
      ),
    on: {
      proxyReq: (proxyReq, req) => {
        const authorization = req.headers.authorization;

        if (authorization) {
          proxyReq.setHeader("Authorization", authorization);
        }
      },
    },
  }),
);

router.get("/images/:imageId", async (req, res) => {
  try {
    const response = await fetch(
      `${env.targetEndpoint}/targets/images/${req.params.imageId}`,
    );

    if (!response.ok || !response.body) {
      res.status(response.status).json({ error: "Image not found" });
      return;
    }

    const contentType = response.headers.get("content-type");

    if (contentType) {
      res.setHeader("Content-Type", contentType);
    }

    res.setHeader("Cache-Control", "public, max-age=86400");

    const buffer = Buffer.from(await response.arrayBuffer());

    res.send(buffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not fetch image" });
  }
});

router.delete("/:id/participants/:username", requireAuth, async (req, res) => {
  try {
    await targetBreaker.fire({
      method: "DELETE",
      url: `${env.targetEndpoint}/targets/${req.params.id}/participants/${req.params.username}`,
      headers: {
        Authorization: req.header("Authorization"),
      },
    });

    res.sendStatus(200);
  } catch (error) {
    res.status(getErrorStatus(error)).json(getErrorBody(error));
  }
});

export default router;
