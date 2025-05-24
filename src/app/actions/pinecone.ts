"use server";

import { auth } from "@clerk/nextjs/server";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { Document } from "langchain/document";
import { CharacterTextSplitter } from "langchain/text_splitter";
import { Pinecone } from "@pinecone-database/pinecone";
import { PineconeStore } from "@langchain/pinecone";
import { getS3Url } from "./s3";
import { OpenAIEmbeddings } from "@langchain/openai";
import { needToUpgrade } from "@/lib/subscription";

export const embedPDFToPinecone = async (fileKey: string) => {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const quotaReached = await needToUpgrade();
  if (quotaReached) {
    throw new Error("Reached free quota. Please upgrade.");
  }

  let pdfFile = await fetch(await getS3Url(fileKey));

  const blob = new Blob([await pdfFile.arrayBuffer()], { type: "application/pdf" });
  const loader = new PDFLoader(blob);

  const docs = await loader.load();

  // Step #1B - Trim useless metadata for each document
  const trimmedDocs = docs.map((doc) => {
    const metadata = { ...doc.metadata };
    delete metadata.pdf;
    return new Document({
      pageContent: doc.pageContent,
      metadata,
    })
  });

  // Step #2 - Split the documents into smaller chunks

  const splitter = new CharacterTextSplitter({
    separator: " ",
    chunkSize: 500,
    chunkOverlap: 10,
  });

  const splitDocs = await splitter.splitDocuments(trimmedDocs);

  // Step #3 - Initialize Pinecone

  const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY!,
  });

  // Step #4 - Connect to the Pinecone Index
  const index = pinecone.index(process.env.PINECONE_INDEX!);

  // Step #5 - Embed and store the documents in Pinecone
  await PineconeStore.fromDocuments(splitDocs, new OpenAIEmbeddings(), {
    pineconeIndex: index,
    namespace: fileKey,
  });
};

export const deletePineconeNamespace = async (fileKey: string) => {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  if (!fileKey) {
    throw new Error("FileKey is required");
  }

  const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY!,
  });

  const index = pinecone.index(process.env.PINECONE_INDEX!);

  const vectorStore = await PineconeStore.fromExistingIndex(new OpenAIEmbeddings(), {
    pineconeIndex: index,
    namespace: fileKey,
  });

  await vectorStore.delete({
    filter: {
      id: fileKey,
      userId: userId,
    },
    deleteAll: true,
  });
}