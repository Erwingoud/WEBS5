import mongoose, { HydratedDocument, Model } from "mongoose";
import { env } from "./env";

export interface ScoreAttrs {
  targetId: string;
  username: string;
  score: number;
  similarityScore: number;
  timeScore: number;
  createdAt: Date;
  updatedAt: Date;
}

export type ScoreDocument = HydratedDocument<ScoreAttrs>;

type ScoreModel = Model<ScoreAttrs>;

const scoreSchema = new mongoose.Schema<ScoreAttrs, ScoreModel>(
  {
    targetId: {
      type: String,
      required: true,
      index: true,
    },
    username: {
      type: String,
      required: true,
      index: true,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    similarityScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    timeScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
  },
);

scoreSchema.index({ targetId: 1, username: 1 }, { unique: true });

export const Score = mongoose.model<ScoreAttrs, ScoreModel>(
  "Score",
  scoreSchema,
);

export async function connectDatabase(): Promise<void> {
  await mongoose.connect(env.dbUri);
  console.log("Score service connected to MongoDB");
}
