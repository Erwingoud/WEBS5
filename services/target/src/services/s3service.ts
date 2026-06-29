import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import type { Readable } from "stream";
import { env } from "../env";

const s3 = new S3Client({
  region: "eu-central-1",
  endpoint: env.s3EndpointUrl,
  credentials: {
    accessKeyId: env.s3AccessKey,
    secretAccessKey: env.s3SecretKey,
  },
  forcePathStyle: true,
});

export async function uploadImage(id: string, data: Buffer): Promise<void> {
  await s3.send(
    new PutObjectCommand({
      Bucket: env.s3Bucket,
      Key: id,
      Body: data,
      ContentLength: data.length,
      ContentType: "image/jpeg",
    }),
  );
}

export async function getImage(id: string): Promise<{
  body: Readable;
  contentType?: string;
}> {
  const result = await s3.send(
    new GetObjectCommand({
      Bucket: env.s3Bucket,
      Key: id,
    }),
  );

  if (!result.Body) {
    throw new Error(`Image ${id} has no body`);
  }

  return {
    body: result.Body as Readable,
    contentType: result.ContentType,
  };
}

export async function deleteImage(id: string): Promise<void> {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: env.s3Bucket,
      Key: id,
    }),
  );
}
