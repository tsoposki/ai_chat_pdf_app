"use server";

import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import prismadb from "@/lib/prisma";

export const createDocument = async (fileName: string, fileSize: number, fileKey: string) => {
    const user = await currentUser();

    if (!user?.id || !user.firstName) {
      throw new Error("Unauthorized");
    }

    const document = await prismadb.document.create({
      data: {
        userId: user.id,
        userName: user.firstName,
        fileName,
        fileSize,
        fileKey,
      }
    })

    // revalidatePath("/documents");

    return { document }
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