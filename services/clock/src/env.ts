import { getEnv, getOptionalEnv } from "@photo-prestiges/common";

export const env = {
  dbUri: getEnv("DB_URI"),
  rabbitmqUrl: getOptionalEnv("RABBITMQ_URL", "amqp://localhost"),
  mailUpdateFrequencyMs: Number(
    getOptionalEnv("MAIL_UPDATE_FREQ_MS", String(60 * 60 * 1000)),
  ),
};
