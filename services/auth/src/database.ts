import mongoose from "mongoose";

export async function connectDatabase(): Promise<void> {
  const uri = process.env.DB_URI;

  if (!uri) {
    throw new Error("Missing DB_URI environment variable");
  }

  await mongoose.connect(uri);

  console.log("Auth service connected to MongoDB");
}
