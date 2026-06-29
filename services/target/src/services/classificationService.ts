import type { ImageClassifier } from "@photo-prestiges/common";
import { env } from "../env";

interface ImaggaTag {
  confidence: number;
  tag: {
    en: string;
  };
}

interface ImaggaResponse {
  result?: {
    tags?: ImaggaTag[];
  };
}

export async function classify(data: Buffer): Promise<ImageClassifier[]> {
  const formData = new FormData();

  const arrayBuffer = data.buffer.slice(
    data.byteOffset,
    data.byteOffset + data.byteLength,
  ) as ArrayBuffer;

  formData.append("image", new Blob([arrayBuffer]), "image.jpg");

  const auth =
    env.imaggaAuth ??
    `Basic ${Buffer.from(`${env.imaggaKey}:${env.imaggaSecret}`).toString(
      "base64",
    )}`;

  const response = await fetch(
    `https://api.imagga.com/v2/tags?${new URLSearchParams({
      language: "en",
      limit: "10",
    })}`,
    {
      method: "POST",
      headers: {
        authorization: auth,
      },
      body: formData,
    },
  );

  if (!response.ok) {
    const body = await response.text();
    console.error(response.status, body);
    throw new Error("Something went wrong while classifying image.");
  }

  const json = (await response.json()) as ImaggaResponse;

  if (!json.result?.tags) {
    throw new Error("Invalid result while classifying image.");
  }

  return json.result.tags.map((tag) => ({
    confidence: tag.confidence,
    tag: tag.tag.en,
  }));
}
