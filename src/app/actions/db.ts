"use server";

import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import prismadb from "@/lib/prisma";
import { needToUpgrade } from "@/lib/subscription";

export const createDocument = async (fileName: string, fileSize: number, fileKey: string): Promise<{ ok: true; document: any } | { ok: false; error: string }> => {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return { ok: false, error: "Unauthorized" };
    }

    const quotaReached = await needToUpgrade();
    if (quotaReached) {
      return { ok: false, error: "Reached free quota. Please upgrade." };
    }

    const document = await prismadb.document.create({
      data: {
        userId: user.id,
        userName: user.id,
        fileName,
        fileSize,
        fileKey,
      }
    })

    return { ok: true, document };
  } catch (error: any) {
    try { console.error("createDocument error", { message: error?.message }); } catch {}
    return { ok: false, error: "Failed to create document" };
  }
}

export const getDocument = async (documentId: string) => {
  const user = await currentUser();

  if (!user?.id) {
    throw new Error("Unauthorized");
  }

  const document = await prismadb.document.findUnique({
    where: {
      id: documentId,
      userId: user.id,
    },
    include: {
      Message: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  return { document };
}

export const updateDocument = async (documentId: string, fileName: string) => {
  const user = await currentUser();

  if (!user?.id) {
    throw new Error("Unauthorized");
  }

  const document = await prismadb.document.update({
    where: {
      id: documentId,
      userId: user.id,
    },
    data: {
      fileName,
    },
  });
  
  revalidatePath("/documents");

  return { document };
} 

export const deleteDocument = async (documentId: string) => {
  const user = await currentUser();

  if (!user?.id) {
    throw new Error("Unauthorized");
  }

  const document = await prismadb.document.delete({
    where: {
      id: documentId,
      userId: user.id,
    },
  });
  
  revalidatePath("/documents");
}