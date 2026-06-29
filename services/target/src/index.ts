import "dotenv/config";
import express from "express";
import {
  consumeQueue,
  Queues,
  type ScoreReadyEvent,
  type TargetExpiredEvent,
  type TargetRemindEvent,
} from "@photo-prestiges/common";
import router from "./routes";
import { connectDatabase } from "./database";
import { env } from "./env";
import {
  saveScore,
  sendTargetReminder,
  targetExpiry,
} from "./services/targetService";

const app = express();

app.use(express.json());
app.use(router);

async function main(): Promise<void> {
  await connectDatabase();

  await Promise.all([
    consumeQueue<TargetExpiredEvent>(
      env.rabbitmqUrl,
      Queues.targetExpired,
      targetExpiry,
    ),
    consumeQueue<TargetRemindEvent>(
      env.rabbitmqUrl,
      Queues.targetRemind,
      sendTargetReminder,
    ),
    consumeQueue<ScoreReadyEvent>(
      env.rabbitmqUrl,
      Queues.scoreReady,
      saveScore,
    ),
  ]);

  app.listen(env.port, () => {
    console.log(`Target microservice started on port ${env.port}`);
  });
}

main().catch((error) => {
  console.error("Failed to start target microservice:", error);
  process.exit(1);
});
