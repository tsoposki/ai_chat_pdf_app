"use server";

import { auth } from "@clerk/nextjs/server";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { Document } from "langchain/document";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Pinecone } from "@pinecone-database/pinecone";
import { PineconeStore } from "@langchain/pinecone";
import { getS3Url } from "./s3";
import { OpenAIEmbeddings } from "@langchain/openai";
import { needToUpgrade } from "@/lib/subscription";

export const embedPDFToPinecone = async (fileKey: string): Promise<{ ok: true } | { ok: false; error: string }> => {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { ok: false, error: "Unauthorized" };
    }

    const quotaReached = await needToUpgrade();
    if (quotaReached) {
      return { ok: false, error: "Reached free quota. Please upgrade." };
    }

    let pdfFile = await fetch(await getS3Url(fileKey));

    const blob = new Blob([await pdfFile.arrayBuffer()], { type: "application/pdf" });
    const loader = new PDFLoader(blob);

    const docs = await loader.load();

    const trimmedDocs = docs.map((doc, idx) => {
      const { pdf, ...rest } = doc.metadata as any;
      // Clean up the text content - preserve technical characters and symbols
      let cleanedContent = doc.pageContent
        .replace(/\s+/g, ' ')  // Normalize whitespace
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')  // Remove only control characters
        .trim();

      return new Document({
        pageContent: cleanedContent,
        metadata: {
          ...rest,
          pageNumber: rest?.loc?.pageNumber ?? rest?.pageNumber ?? idx + 1,
          source: rest?.source ?? fileKey,
          chunkIndex: idx,
          totalPages: docs.length,
        },
      });
    });

    // Optimized chunking for better retrieval
    const splitter = new RecursiveCharacterTextSplitter({
      separators: [
        "\n\n## ", // Section headers
        "\n\n# ",  // Main headers
        "\n\n",    // Paragraph breaks
        "\n",      // Line breaks
        ". ",      // Sentence endings
        " ",       // Word boundaries
        "",        // Character level (fallback)
      ],
      chunkSize: 2000,     // Larger chunks for better context
      chunkOverlap: 300,   // More overlap for continuity
      keepSeparator: true, // Preserve separators in chunks
    });

    const splitDocs = await splitter.splitDocuments(trimmedDocs);

    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });

    const index = pinecone.index(process.env.PINECONE_INDEX!);

    await PineconeStore.fromDocuments(splitDocs, new OpenAIEmbeddings({
      modelName: "text-embedding-3-large", // Latest and most accurate for complex documents
    }), {
      pineconeIndex: index,
      namespace: fileKey,
    });

    return { ok: true };
  } catch (error: any) {
    try { console.error("embedPDFToPinecone error", { message: error?.message }); } catch {}
    return { ok: false, error: "Failed to embed document" };
  }
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

  const vectorStore = await PineconeStore.fromExistingIndex(new OpenAIEmbeddings({
    modelName: "text-embedding-3-large",
  }), {
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