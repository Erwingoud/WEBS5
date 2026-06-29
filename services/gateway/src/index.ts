import "dotenv/config";
import express from "express";
import authRouter from "./routers/authRoute";
import targetRouter from "./routers/targetRoute";
import { env } from "./env";

const app = express();

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "gateway" });
});

app.use("/auth", authRouter);
app.use("/targets", targetRouter);

app.listen(env.port, () => {
  console.log(`Gateway microservice started on port ${env.port}`);
});
