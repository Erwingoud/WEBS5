import "dotenv/config";
import {
  consumeQueue,
  Queues,
  type TargetCreatedEvent,
} from "@photo-prestiges/common";
import { connectDatabase, Schedule } from "./database";
import { env } from "./env";
import { handleSchedule } from "./service";

async function handleTargetCreation(
  message: TargetCreatedEvent,
): Promise<void> {
  if (!message.id || !message.deadline) {
    throw new Error("Invalid target.created message");
  }

  const endTime = new Date(message.deadline);

  if (Number.isNaN(endTime.getTime())) {
    throw new Error(`Invalid target deadline: ${message.deadline}`);
  }

  const schedule = await Schedule.findOneAndUpdate(
    { targetId: message.id },
    {
      targetId: message.id,
      endTime,
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
    },
  );

  handleSchedule(schedule);

  console.log(`Scheduled target ${message.id} until ${endTime.toISOString()}`);
}

async function main(): Promise<void> {
  await connectDatabase();

  const schedules = await Schedule.find();

  schedules.forEach(handleSchedule);

  await consumeQueue<TargetCreatedEvent>(
    env.rabbitmqUrl,
    Queues.targetCreated,
    handleTargetCreation,
  );

  console.log("Clock microservice started");
}

main().catch((error) => {
  console.error("Failed to start clock microservice:", error);
  process.exit(1);
});
