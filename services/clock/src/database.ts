import mongoose, { HydratedDocument, Model } from "mongoose";
import { env } from "./env";

export interface ScheduleAttrs {
  targetId: string;
  endTime: Date;
  lastReminderAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type ScheduleDocument = HydratedDocument<ScheduleAttrs>;

type ScheduleModel = Model<ScheduleAttrs>;

const scheduleSchema = new mongoose.Schema<ScheduleAttrs, ScheduleModel>(
  {
    targetId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    lastReminderAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

export const Schedule = mongoose.model<ScheduleAttrs, ScheduleModel>(
  "Schedule",
  scheduleSchema,
);

export async function connectDatabase(): Promise<void> {
  await mongoose.connect(env.dbUri);
  console.log("Clock service connected to MongoDB");
}
