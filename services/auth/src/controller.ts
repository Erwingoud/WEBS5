import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { createUser, jwtLogin } from "./services/userService";
import type { UserRole } from "@photo-prestiges/common";

interface JwtPayload {
  id: string;
  email: string;
  username: string;
  role: UserRole;
}

export async function register(req: Request, res: Response): Promise<Response> {
  const { email, username, role } = req.body as {
    email?: string;
    username?: string;
    role?: UserRole;
  };

  if (!email || !username || !role) {
    return res.status(400).json({
      error: "Missing required fields: email, username, role",
    });
  }

  if (!["owner", "participant"].includes(role)) {
    return res.status(400).json({
      error: "Role must be either 'owner' or 'participant'",
    });
  }

  try {
    const user = await createUser({ email, username, role });

    return res.status(201).json({
      user,
    });
  } catch (error) {
    if (error instanceof Error && "code" in error) {
      switch (error.code) {
        case "USER_ALREADY_EXISTS":
        case "USERNAME_ALREADY_EXISTS":
          return res.status(409).json({
            error: error.message,
          });
      }
    }

    console.error(error);

    return res.status(500).json({
      error: "Could not register user",
    });
  }
}

export async function login(req: Request, res: Response): Promise<Response> {
  const { email, password } = req.body as {
    email?: string;
    password?: string;
  };

  if (!email || !password) {
    return res.status(400).json({
      error: "Missing required fields: email, password",
    });
  }

  try {
    const token = await jwtLogin({ email, password });

    return res.json({ token });
  } catch {
    return res.status(401).json({
      error: "The email and password combination was incorrect",
    });
  }
}

export async function me(req: Request, res: Response): Promise<Response> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing bearer token" });
  }

  const token = authHeader.slice("Bearer ".length);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    return res.json({
      user: payload,
    });
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
