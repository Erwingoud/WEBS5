import "dotenv/config";
import express from "express";
import router from "./routes";
import { connectDatabase } from "./database";

const app = express();
const port = Number(process.env.PORT ?? 80);

app.use(express.json());
app.use(router);

async function main() {
  await connectDatabase();

  app.listen(port, () => {
    console.log(`Auth microservice started on port ${port}`);
  });
}

main().catch((error) => {
  console.error("Failed to start auth microservice:", error);
  process.exit(1);
});
