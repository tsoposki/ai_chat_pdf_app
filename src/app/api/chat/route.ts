import { NextRequest, NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
// Using NextResponse for now - streaming can be added later
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

  const pinecone = new Pinecone();
  const index = pinecone.index(process.env.PINECONE_INDEX!);

    const vectorStore = await PineconeStore.fromExistingIndex(
    new OpenAIEmbeddings({
      modelName: "text-embedding-3-large", // Match Pinecone index (3072 dims)
    }),
    {
      pineconeIndex: index,
      namespace: fileKey,
    }
  );

  const model = new ChatOpenAI({
    modelName: "gpt-4o-mini",
    streaming: true,
    temperature: 0.1,
  });

  // Enhanced retrieval with multi-query strategy
  const retriever = vectorStore.asRetriever({
    k: 15, // Retrieve more chunks for better coverage
  });

  // Function to generate multiple query variations
  const generateQueryVariations = async (question: string) => {
    const variations = [
      question,
      `What information does the document contain about ${question}?`,
      `Explain ${question} based on the document content.`,
      `Find details related to ${question} in the text.`,
    ];
    return variations;
  };

  const chain = RunnableSequence.from([
    {
      context: async (input: { question: string }) => {
        const queryVariations = await generateQueryVariations(input.question);

        // Get documents for each query variation
        const allDocs = [] as any[];
        for (const query of queryVariations) {
          const docs = await retriever.getRelevantDocuments(query);
          allDocs.push(...docs);
        }

        // Remove duplicates and limit total context
        const uniqueDocs = allDocs.filter((doc, index, self) =>
          index === self.findIndex(d => d.pageContent === doc.pageContent)
        );

        // Sort by relevance score and take top chunks
        const topDocs = uniqueDocs.slice(0, 12);

        const pageNumbers = Array.from(new Set(
          topDocs
            .map((d: any) => d?.metadata?.pageNumber ?? d?.metadata?.loc?.pageNumber ?? d?.metadata?.page)
            .filter((p: any) => p !== undefined && p !== null)
        ));

        return {
          context: topDocs.map(doc => doc.pageContent).join('\n\n'),
          sourcePages: pageNumbers.sort(),
        };
      },
      question: (input: { question: string }) => input.question,
    },
    async (input) => {
      // Heuristics:
      // - If Cyrillic text includes Macedonian-specific letters → Macedonian
      // - Else if Cyrillic text lacks Bulgarian-specific letters (я, ю, ъ, щ) → Macedonian
      // - Otherwise → auto-detect
      const hasCyrillic = /[\u0400-\u04FF]/.test(input.question);
      const hasMacedonianSpecific = /[\u0403\u040C\u0405\u0408\u0409\u040A\u040F\u0453\u045C\u0455\u0458\u0459\u045A\u045F]/.test(input.question); // ЃЌЅЈЉЊЏѓќѕјљњџ
      const hasBulgarianSpecific = /[\u044F\u042F\u044E\u042E\u044A\u042A\u0449\u0429]/.test(input.question); // яЯ юЮ ъЪ щЩ
      const preferMacedonian = hasCyrillic && (hasMacedonianSpecific || !hasBulgarianSpecific);
      const languageInstruction = preferMacedonian
        ? "Respond in Macedonian (mk), unless the user asks the question in another language."
        : "Respond in the same language as the user question (auto-detect).";
      const prompt = `You are an expert assistant for answering questions about a PDF. Work strictly from the provided context. ${languageInstruction}

Context:
${input.context?.context ?? input.context}

User question:
${input.question}

Formatting rules (very important):
- Use clean Markdown.
- Start with a short 1–2 sentence answer.
- Then add clearly labeled sections using headings (###) and bullet points.
- For figures/metrics, use bullet points with bold labels (e.g., **Revenue**: ...). Use tables when appropriate.
- Keep paragraphs short; avoid redundant preambles.
- If information is missing in the context, explicitly state what is missing.


Return only the formatted Markdown.`;

      return model.invoke(prompt);
    },
    new StringOutputParser(),
  ]);

  // Generate response
  const response = await chain.invoke({ question: query });

  // Create message from assistant
  await saveMessage(documentId, Role.assistant, response, userId);

  // Return plain text so the chat hook doesn't render JSON
  return new Response(response, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
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
