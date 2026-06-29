import type { NextFunction, Request, Response } from "express";
import { ZodError, type ZodSchema } from "zod";

export function validateRequest(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          error: "Validation failed",
          details: error.issues,
        });
        return;
      }

      res.status(400).json({
        error: "Invalid request",
      });
    }
  };
}
