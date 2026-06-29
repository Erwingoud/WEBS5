import { getEnv, getOptionalEnv } from "@photo-prestiges/common";

export const env = {
  dbUri: getEnv("DB_URI"),
  rabbitmqUrl: getOptionalEnv("RABBITMQ_URL", "amqp://localhost"),
};
