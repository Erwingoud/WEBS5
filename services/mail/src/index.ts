import "dotenv/config";
import { consumeQueue, Queues } from "@photo-prestiges/common";
import { env } from "./env";
import {
  finalReportHandler,
  reminderHandler,
  scoreHandler,
  userCreatedHandler,
} from "./handlers";

async function main(): Promise<void> {
  await Promise.all([
    consumeQueue(env.rabbitmqUrl, Queues.userCreated, userCreatedHandler),
    consumeQueue(
      env.rabbitmqUrl,
      Queues.targetMailFinalReport,
      finalReportHandler,
    ),
    consumeQueue(env.rabbitmqUrl, Queues.targetMailScore, scoreHandler),
    consumeQueue(env.rabbitmqUrl, Queues.targetMailReminder, reminderHandler),
  ]);

  console.log("Mail microservice started");
}

main().catch((error) => {
  console.error("Failed to start mail microservice:", error);
  process.exit(1);
});
