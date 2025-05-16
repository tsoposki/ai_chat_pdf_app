"use client";
import React, { useCallback, useState } from "react";

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
import { Loader2, Upload, UploadCloud, X } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { generatePreSignedURL } from "@/app/actions/s3";
import { getPDFFileNameFromUrl, showToast } from "@/lib/utils";
import { embedPDFToPinecone } from "@/app/actions/pinecone";
import { createDocument } from "@/app/actions/db";
import { useRouter } from "next/navigation";

const UploadPDF = () => {
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState<string>("");
  const [isButtonEnabled, setIsButtonEnabled] = useState(false);

  const [open, setOpen] = useState(false);

  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();
  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Do something with the files
    const pdfFile = acceptedFiles[0];

    if (!pdfFile) {
      showToast("Please upload only PDF file.");
      return;
    }

    if (pdfFile.size > 10 * 1024 * 1024) {
      showToast("Max file size: 10mb ");
      return;
    }
    setFile(pdfFile);
    setUrl("");
    setIsButtonEnabled(true);
  }, []);
  const { getRootProps, getInputProps } = useDropzone({
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
    onDrop,
  });

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    setFile(null);
    setIsButtonEnabled(e.target.value !== "");
  };

  const handleRemoveFile = () => {
    setFile(null);
    setIsButtonEnabled(false);
  };

  const resetForm = () => {
    setFile(null);
    setUrl("");
    setIsButtonEnabled(false);
  };

  const handleOpenDialog = () => {
    setOpen(!open);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      setIsUploading(true);

      if (file) {
        await processPDF(file, file.name, file.size, file.type);
      } else if (url) {
        const proxyUrl = `https://corsproxy.io/?url=${url}`;
        const response = await fetch(proxyUrl);
        const fileName = getPDFFileNameFromUrl(url);
        const fileType = response.headers.get("Content-Type");

        if (!fileName || fileType !== "application/pdf") {
          throw Error("Invalid file format");
        }

        const blob = await response.blob();
        const fileSize = parseInt(response.headers.get("Content-Length") || "0");
        await processPDF(blob, fileName, fileSize, fileType);
      }
    } catch (error: any) {
      showToast(error.message);
    } finally {
      // Reset form
      setIsUploading(false);
      resetForm();
    }
  };

  const processPDF = async (file: File | Blob, fileName: string, fileSize: number, fileType: string) => {
    const { putUrl, fileKey } = await generatePreSignedURL(fileName, fileType);
    await uploadPDFToS3(file, putUrl, fileKey);
    await embedPDFToPinecone(fileKey);
    const { document } = await createDocument(fileName, fileSize, fileKey);

    if (document) {
      showToast(`Document uploaded successfully: ${document.fileName}`);
      router.push(`/documents/${document.id}`);
    }
  }

  const uploadPDFToS3 = async (
    file: File | Blob,
    putUrl: string,
    fileKey: string
  ) => {
    try {
      const uploadResponse = await fetch(putUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": "application/pdf",
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file to S3");
      }

      return {
        success: true,
        fileKey,
      };
    } catch (error: any) {
      console.error("Error uploading file to S3: ", error);
      showToast(error.message);
      return {
        success: false,
        error: error,
      };
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenDialog}>
      <DialogTrigger asChild>
        <Button variant="orange">
          <Upload className="w-4 h-4 mr-2" style={{ strokeWidth: "3" }} />
          Upload
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upload a document</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-xl">
            <div className="border-dashed border-2 rounded-ml bg-gray-50 h-36 w-full">
              {file ? (
                <div className="h-full flex justify-center items-center text-black/70">
                  <span className="overflow-hidden whitespace-nowrap text-ellipsis text-sm max-w-[200px]">
                    {file?.name}
                  </span>
                  <button
                    className="ml-1 cursoer-pointer"
                    onClick={handleRemoveFile}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  {...getRootProps()}
                  className="h-full flex flex-col justify-center items-center cursor-pointer"
                >
                  <input name="file" {...getInputProps()} />
                  <UploadCloud className="w10 h-10 text-[#ff612f]" />
                  <p className="mt-2 text-sm text-slate-400">
                    Drag and drop a PDF file here or click
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink mx-4 uppercase text-gray-600 text-xs">
              or
            </span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="url">Import from URL</Label>
            <Input
              id="url"
              name="url"
              value={url}
              onChange={handleUrlChange}
              className="font-light"
              placeholder='"https://cdn.openai.com/papers/gpt-4.pdf'
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button
              type="submit"
              variant="orange"
              disabled={!isButtonEnabled || isUploading}
            >
              {isUploading ? (
                <Loader2
                  className="w-5 h-5 text-white/80 animate-spin"
                  style={{ strokeWidth: "3" }}
                />
              ) : (
                "Upload"
              )}
            </Button>
            <DialogTrigger asChild>
              <Button variant="light">Cancel</Button>
            </DialogTrigger>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UploadPDF;
