import { getEnv, getOptionalEnv } from "@photo-prestiges/common";

export const env = {
  rabbitmqUrl: getOptionalEnv("RABBITMQ_URL", "amqp://localhost"),
  sendgridApiKey: getEnv("SG_KEY"),
  mailFrom: getEnv("MAIL_FROM"),
};
