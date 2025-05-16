"use client";
import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil } from "lucide-react";

import { Document } from "../generated/prisma";
import { updateDocument } from "@/app/actions/db";
import SubmitButton from "./SubmitButton";

interface UpdatePDFProps {
  document: Document;
}

const UpdatePDF = ({ document }: UpdatePDFProps) => {
  const [documentName, setDocumentName] = useState(document.fileName);
  const [isButtonEnabled, setIsButtonEnabled] = useState(false);
  const [open, setOpen] = useState(false);

  const handleOpenDialog = () => {
    setOpen(!open);
  };

  const handleDocumentNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDocumentName(e.target.value);
    setIsButtonEnabled(e.target.value !== "");
  };

  const handleSubmit = async (formData: FormData) => {
    setIsButtonEnabled(false);
    const newDocumentName = formData.get("documentName") as string;
    await updateDocument(document.id, newDocumentName);
    setIsButtonEnabled(true);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenDialog}>
      <DialogTrigger asChild>
        <Pencil
          className="w-4 h-4 cursor-pointer"
          style={{ strokeWidth: "3" }}
        />
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Update a document</DialogTitle>
        </DialogHeader>
        <form className="space-y-6" action={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="url">Name</Label>
            <Input
              id="documentName"
              name="documentName"
              value={documentName}
              onChange={handleDocumentNameChange}
              className="font-light"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <SubmitButton
              isButtonEnabled={isButtonEnabled}
              title="Update"
            />
            <DialogTrigger asChild>
              <Button variant="light">Cancel</Button>
            </DialogTrigger>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UpdatePDF;
