import mongoose, { HydratedDocument, Model, Types } from "mongoose";
import type { ImageClassifier } from "@photo-prestiges/common";
import { env } from "./env";

export interface UploadAttrs {
  username: string;
  email: string;
  imageId?: string;
  classifiers: ImageClassifier[];
  scoringTime?: Date;
  score?: number;
}

export interface TargetAttrs {
  username: string;
  email: string;
  title: string;
  city: string;
  country: string;
  deadline: Date;
  imageId?: string;
  classifiers: ImageClassifier[];
  hash?: string;
  uploads: Types.DocumentArray<UploadAttrs>;
  createdAt: Date;
  updatedAt: Date;
}

export interface PublicTarget {
  id: string;
  username: string;
  title: string;
  city: string;
  country: string;
  deadline: Date;
  imageURL?: string;
  uploads: Array<{
    username: string;
    imageURL?: string;
    score?: number;
    submittedAt?: Date;
  }>;
}

interface TargetMethods {
  toPublic(): PublicTarget;
}

type TargetDocument = HydratedDocument<TargetAttrs, TargetMethods>;

interface TargetModel extends Model<TargetAttrs, {}, TargetMethods> {
  findByUsername(username: string): Promise<TargetDocument[]>;
}

const classifierSchema = new mongoose.Schema<ImageClassifier>(
  {
    tag: {
      type: String,
      required: true,
    },
    confidence: {
      type: Number,
      required: true,
    },
  },
  {
    _id: false,
  },
);

const uploadSchema = new mongoose.Schema<UploadAttrs>(
  {
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    imageId: String,
    classifiers: {
      type: [classifierSchema],
      default: [],
    },
    scoringTime: Date,
    score: Number,
  },
  {
    _id: false,
  },
);

const targetSchema = new mongoose.Schema<
  TargetAttrs,
  TargetModel,
  TargetMethods
>(
  {
    username: {
      type: String,
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: [true, "A title is required."],
      trim: true,
    },
    city: {
      type: String,
      required: [true, "A city is required."],
      trim: true,
      index: true,
    },
    country: {
      type: String,
      required: [true, "A country is required."],
      trim: true,
      index: true,
    },
    deadline: {
      type: Date,
      required: true,
    },
    imageId: String,
    classifiers: {
      type: [classifierSchema],
      default: [],
    },
    hash: String,
    uploads: {
      type: [uploadSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

targetSchema.method("toPublic", function toPublic() {
  return {
    id: this._id.toString(),
    username: this.username,
    title: this.title,
    city: this.city,
    country: this.country,
    deadline: this.deadline,
    ...(this.imageId && {
      imageURL: env.s3PublicPath + this.imageId,
    }),
    uploads: this.uploads.map((upload) => ({
      username: upload.username,
      ...(upload.imageId && {
        imageURL: env.s3PublicPath + upload.imageId,
      }),
      score: upload.score,
      submittedAt: upload.scoringTime,
    })),
  };
});

targetSchema.static(
  "findByUsername",
  function findByUsername(username: string) {
    return this.find({ username });
  },
);

export const Target = mongoose.model<TargetAttrs, TargetModel>(
  "Target",
  targetSchema,
);

export type { TargetDocument };

export async function connectDatabase(): Promise<void> {
  await mongoose.connect(env.dbUri);
  console.log("Target service connected to MongoDB");
}
