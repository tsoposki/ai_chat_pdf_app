"use server";

import { auth } from "@clerk/nextjs/server";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { needToUpgrade } from "@/lib/subscription";
import { sanitizeFileName } from "@/lib/utils";
export const generatePreSignedURL = async (fileName: string, fileType: string): Promise<{ ok: true; putUrl: string; fileKey: string } | { ok: false; error: string }> => {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { ok: false, error: "Unauthorized" };
    }

    if (!fileName || !fileType) {
      return { ok: false, error: "File name and file type are required" };
    }

    const quotaReached = await needToUpgrade();
    if (quotaReached) {
      return { ok: false, error: "Reached free quota. Please upgrade." };
    }

    const client = new S3Client({
      region: process.env.S3_BUCKET_REGION,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY_ID!,
      },
    });

    const sanitizedFileName = sanitizeFileName(fileName);
    const fileKey = `users/${userId}/${Date.now()}-${sanitizedFileName}`;
    const putCommand = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileKey,
      ContentType: fileType,
    });

    const putUrl = await getSignedUrl(client, putCommand, { expiresIn: 60 });

    return { ok: true, putUrl, fileKey };
  } catch (error: any) {
    try { console.error("generatePreSignedURL error", { message: error?.message }); } catch {}
    return { ok: false, error: "Failed to generate upload URL" };
  }
};

export const deleteS3Object = async (fileKey: string) => {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  if (!fileKey) {
    throw new Error("File key is required");
  }

  const client = new S3Client({
    region: process.env.S3_BUCKET_REGION,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY_ID!,
    },
  });

  const deleteCommand = new DeleteObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: fileKey,
  });

  await client.send(deleteCommand);

  return { success: true };
}

export const getS3Url = async (fileKey: string) => {
  return `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.S3_BUCKET_REGION}.amazonaws.com/${fileKey}`;
}