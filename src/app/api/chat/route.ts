import { NextRequest, NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
import { VectorDBQAChain } from "langchain/chains";
import { CallbackManager } from "@langchain/core/callbacks/manager";
import { StreamingTextResponse, LangChainStream } from "ai";
import { Role } from "@/generated/prisma";
import prismadb from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Extract the messages from the request body
  const { messages, fileKey, documentId } = await req.json();

  // Get input query from messages array
  const query = messages[messages.length - 1].content;

  // Create message from user
  await saveMessage(documentId, Role.user, query, userId);

  const { stream, handlers } = LangChainStream();
  const pinecone = new Pinecone();
  const index = pinecone.index(process.env.PINECONE_INDEX!);

  const vectorStore = await PineconeStore.fromExistingIndex(
    new OpenAIEmbeddings(), 
    {
      pineconeIndex: index,
      namespace: fileKey,
    }
  );

  const model = new ChatOpenAI({
    modelName: "gpt-4.1-nano",
    streaming: true,
    callbackManager: CallbackManager.fromHandlers(handlers),
  });

  const chain = VectorDBQAChain.fromLLM(model, vectorStore, {
    k: 3,
    returnSourceDocuments: true,
  });
  
  const response = await chain.invoke({ query });
  if (response) {
    // Create message from assistant
    await saveMessage(documentId, Role.assistant, response.text, userId);
  }

  return new StreamingTextResponse(stream);
}

async function saveMessage(documentId: string, role: Role, content: string, userId: string) {
  // First verify the document exists and belongs to the user
  const document = await prismadb.document.findFirst({
    where: {
      id: documentId,
      userId: userId,
    },
  });

  if (!document) {
    throw new Error("Document not found or unauthorized");
  }

  // Then create the message
  const message = await prismadb.message.create({
    data: {
      documentId,
      content,
      role,
    },
  });

  return message;
}
