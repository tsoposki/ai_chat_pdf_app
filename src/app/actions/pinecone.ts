"use server";

import { auth } from "@clerk/nextjs/server";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { Document } from "langchain/document";
import { CharacterTextSplitter } from "langchain/text_splitter";
import { Pinecone } from "@pinecone-database/pinecone";
import { PineconeStore } from "@langchain/pinecone";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { getS3Url } from "./s3";

export const embedPDFToPinecone = async (fileKey: string) => {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
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
  await PineconeStore.fromDocuments(splitDocs, new HuggingFaceInferenceEmbeddings({ model: "BAAI/bge-small-en-v1.5", apiKey: process.env.HUGGINGFACE_API_KEY! }), {
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

  const vectorStore = await PineconeStore.fromExistingIndex(new HuggingFaceInferenceEmbeddings({ model: "BAAI/bge-small-en-v1.5", apiKey: process.env.HUGGINGFACE_API_KEY! }), {
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