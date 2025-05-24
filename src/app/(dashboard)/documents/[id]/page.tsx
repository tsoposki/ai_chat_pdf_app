import { Chat } from "@/components/Chat";
import { PDFViewer } from "@/components/PDFViewer";
import { getDocument } from "@/app/actions/db";
import { redirect } from "next/navigation";
import { getS3Url } from "@/app/actions/s3";

interface ChatPageProps {
  params: Promise<{
    id: string;
  }>;
}

const ChatPage = async ({ params }: ChatPageProps) => {
  const { id } = await params;
  const { document } = await getDocument(id);

  if (!document) {
    return redirect("/documents");
  }

  const s3Url = await getS3Url(document.fileKey);

  return (
    <div className="flex">
      <PDFViewer url={s3Url} />
      <Chat document={document} />
    </div>
  );
};

export default ChatPage;
