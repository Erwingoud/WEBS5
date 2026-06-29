import { getEnv, getOptionalEnv } from "@photo-prestiges/common";

export const env = {
  port: Number(getOptionalEnv("PORT", "80")),
  jwtSecret: getEnv("JWT_SECRET"),
  authEndpoint: getEnv("AUTH_ENDPOINT"),
  targetEndpoint: getEnv("TARGET_ENDPOINT"),
};
