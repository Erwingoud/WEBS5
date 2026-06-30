import "dotenv/config";
import express from "express";
import authRouter from "./routers/authRoute";
import targetRouter from "./routers/targetRoute";
import { env } from "./env";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "./docs/swagger.json";

const app = express();

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "gateway" });
});

app.use("/auth", authRouter);
app.use("/targets", targetRouter);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.listen(env.port, () => {
  console.log(`Gateway microservice started on port ${env.port}`);
});
