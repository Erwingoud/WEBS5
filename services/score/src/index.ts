import "dotenv/config";
import {
  consumeQueue,
  Queues,
  type ScoreRequestEvent,
} from "@photo-prestiges/common";
import { connectDatabase } from "./database";
import { env } from "./env";
import { handleScoreRequest } from "./scoreService";

async function main(): Promise<void> {
  await connectDatabase();

  await consumeQueue<ScoreRequestEvent>(
    env.rabbitmqUrl,
    Queues.scoreRequest,
    handleScoreRequest,
  );

  console.log("Score microservice started");
}

main().catch((error) => {
  console.error("Failed to start score microservice:", error);
  process.exit(1);
});
