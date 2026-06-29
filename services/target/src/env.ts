import { getEnv, getOptionalEnv } from "@photo-prestiges/common";

export const env = {
  port: Number(getOptionalEnv("PORT", "80")),
  dbUri: getEnv("DB_URI"),
  rabbitmqUrl: getOptionalEnv("RABBITMQ_URL", "amqp://localhost"),
  jwtSecret: getEnv("JWT_SECRET"),

  s3EndpointUrl: getEnv("S3_ENDPOINT_URL"),
  s3AccessKey: getEnv("S3_ACCESS_KEY"),
  s3SecretKey: getEnv("S3_SECRET_KEY"),
  s3Bucket: getOptionalEnv("S3_BUCKET", "webs5-pics"),
  s3PublicPath: getEnv("S3_PUBLIC_PATH"),

  imaggaKey: getEnv("IMAGGA_KEY"),
  imaggaSecret: getEnv("IMAGGA_SECRET"),
  imaggaAuth: process.env.IMAGGA_AUTH,
};
