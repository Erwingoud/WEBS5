import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import {
  getEnv,
  getOptionalEnv,
  Queues,
  sendToQueue,
  type UserCreatedEvent,
  type PublicUser,
  type UserRole,
} from "@photo-prestiges/common";
import { User } from "../models/user";
import mongoose from "mongoose";

interface CreateUserInput {
  email: string;
  username: string;
  role: UserRole;
}

interface LoginInput {
  email: string;
  password: string;
}

export async function createUser(input: CreateUserInput): Promise<PublicUser> {
  const email = input.email.toLowerCase().trim();

  const generatedPassword = createPassword();

  const user = new User({
    email,
    username: input.username.trim(),
    role: input.role,
    password: generatedPassword,
  });

  console.log(user);

  try {
    await user.save();
  } catch (error) {
    if (
      error instanceof mongoose.mongo.MongoServerError &&
      error.code === 11000
    ) {
      if (error.keyPattern.email) {
        const err = new Error(`User already exists with email ${email}`);
        Object.assign(err, { code: "USER_ALREADY_EXISTS" });
        throw err;
      }

      if (error.keyPattern.username) {
        const err = new Error(`Username '${input.username}' is already taken`);
        Object.assign(err, { code: "USERNAME_ALREADY_EXISTS" });
        throw err;
      }
    }

    throw error;
  }

  const event: UserCreatedEvent = {
    email: user.email,
    username: user.username,
    role: user.role,
    password: generatedPassword,
  };

  await sendToQueue(
    getOptionalEnv("RABBITMQ_URL", "amqp://localhost"),
    Queues.userCreated,
    event,
  );

  return user.toPublic();
}

export async function jwtLogin(input: LoginInput): Promise<string> {
  const user = await User.findByEmail(input.email);

  if (!user || !(await user.comparePassword(input.password))) {
    const error = new Error("Invalid credentials");
    Object.assign(error, { code: "INVALID_CREDENTIALS" });
    throw error;
  }

  return jwt.sign(user.toPublic(), getEnv("JWT_SECRET"), {
    expiresIn: "30m",
  });
}

function createPassword(length = 12): string {
  const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = crypto.randomBytes(length);

  return Array.from(bytes)
    .map((byte) => alphabet[byte % alphabet.length])
    .join("");
}
