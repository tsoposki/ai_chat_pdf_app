"use server";

import { auth } from "@clerk/nextjs/server";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { needToUpgrade } from "@/lib/subscription";
export const generatePreSignedURL = async (fileName: string, fileType: string) => {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  if (!fileName || !fileType) {
    throw new Error("File name and file type are required");
  }

  const quotaReached = await needToUpgrade();
  if (quotaReached) {
    throw new Error("Reached free quota. Please upgrade.");
  }

  const client = new S3Client({
    region: process.env.S3_BUCKET_REGION,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY_ID!,
    },
  });

  const fileKey = `users/${userId}/${Date.now()}-${fileName}`;
  const putCommand = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: fileKey,
    ContentType: fileType,
  });

  const putUrl = await getSignedUrl(client, putCommand, { expiresIn: 60 });

  return {
    putUrl,
    fileKey,
  };
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