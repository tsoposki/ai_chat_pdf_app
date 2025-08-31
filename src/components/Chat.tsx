"use client";

import React, { useRef, useEffect } from "react";
import { Input } from "./ui/input";
import { Bot, Loader2, Send, User } from "lucide-react";
import { Button } from "./ui/button";
import { cn, scrollToBottom } from "@/lib/utils";
import { Message, useChat } from "ai/react"
import { Document, Message as MessageDB } from "@/generated/prisma";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ChatProps {
  document: Document & { Message: MessageDB[] };
}

export const Chat = ({ document }: ChatProps) => {
  const { messages, input, isLoading, handleInputChange, handleSubmit } = useChat({
    body: {
      fileKey: document.fileKey,
      documentId: document.id,
    },
    initialMessages: document.Message,
  });

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollToBottom(messagesEndRef);
  }, [messages]);

  return (
    <div className="w-1/2 h-[calc(100vh-60px)]">
      <div className="h-full flex flex-col justify-between">
        { /* Messages */ }
        <div className="overflow-auto bg-white">
          <div className="flex flex-col">
            {messages.map((message: Message, index) => (
              <div key={index} className={cn("p-6 w-full flex items-start gap-x-8", message.role === "user" ? "bg-white" : "bg-[#faf9f6]")}>
                <div className="w-4">
                  {message.role === "user" ? (
                    <User className="bg-[#ff612f] text-white rounded-sm p-1" />
                  ) : (
                    <Bot className="bg-[#062427] text-white rounded-sm p-1" />
                  )}
                </div>
                <div className="max-w-none text-sm font-light overflow-hidden leading-7">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: (props) => <h3 className="text-base font-semibold mt-3 mb-2" {...props} />,
                      h2: (props) => <h4 className="text-base font-semibold mt-3 mb-2" {...props} />,
                      h3: (props) => <h5 className="text-sm font-semibold mt-3 mb-2" {...props} />,
                      p: (props) => <p className="mb-2" {...props} />,
                      strong: (props) => <strong className="font-medium" {...props} />,
                      ul: (props) => <ul className="list-disc pl-6 my-2 space-y-1" {...props} />,
                      ol: (props) => <ol className="list-decimal pl-6 my-2 space-y-1" {...props} />,
                      li: (props) => <li className="leading-7" {...props} />,
                      a: (props) => {
                        const href = props.href || '';
                        const onClick = (e: React.MouseEvent) => {
                          // Support custom link scheme (page:N)
                          const pageScheme = href.match(/^page:(\d+)$/);
                          if (pageScheme) {
                            e.preventDefault();
                            const page = parseInt(pageScheme[1], 10);
                            // @ts-ignore
                            if (typeof window !== 'undefined' && typeof window.__pdfJumpTo === 'function') {
                              // @ts-ignore
                              window.__pdfJumpTo(page);
                            }
                            return;
                          }
                          // Fallback: detect "стр. N" or "p. N"
                          const text = (typeof props.children === 'string') ? props.children : '';
                          const match = href.match(/(стр\.|p\.)\s*(\d+)/i) || (typeof text === 'string' ? text.match(/(стр\.|p\.)\s*(\d+)/i) : null);
                          if (match) {
                            e.preventDefault();
                            const page = parseInt(match[2], 10);
                            // @ts-ignore
                            if (typeof window !== 'undefined' && typeof window.__pdfJumpTo === 'function') {
                              // @ts-ignore
                              window.__pdfJumpTo(page);
                            }
                          }
                        };
                        return <a {...props} onClick={onClick} className="text-blue-600 hover:underline cursor-pointer" />;
                      },
                      table: (props) => <table className="w-full text-left border-collapse my-3" {...props} />,
                      thead: (props) => <thead className="border-b border-gray-200" {...props} />,
                      th: (props) => <th className="py-1 px-2 text-xs font-semibold" {...props} />,
                      td: (props) => <td className="py-1 px-2 align-top text-sm border-b border-gray-100" {...props} />,
                      code: (props) => <code className="font-mono bg-gray-50 px-1 py-0.5 rounded" {...props} />,
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              </div>
            ))}
            
            {/* AI Thinking Loader */}
            {isLoading && (
              <div className="p-6 w-full flex items-start gap-x-8 bg-[#faf9f6]">
                <div className="w-4">
                  <Bot className="bg-[#062427] text-white rounded-sm p-1" />
                </div>
                <div className="flex items-center gap-x-2">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                  <span className="text-sm font-light text-gray-500 italic">AI is thinking...</span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>

        { /* Form */ }
        <div className="bg-[#faf9f6]">
          <form onSubmit={handleSubmit} className="m-4 p-2 flex items-center justify-between rounded-md border-[#e5e3da] border bg-white">
            <Input
              value={input}
              onChange={handleInputChange}
              disabled={isLoading}
              placeholder="Enter your question"
              className="border-none outline-none focus-visible:ring-0 focus-visible:ring-transparent"
            />
            {isLoading ? (
              <Loader2
                className="w-5 h-5 text-white/80 animate-spin"
                style={{ strokeWidth: "3" }}
              />
            ) : (
              <Button type="submit" variant="orange">
                <Send className="w-4 h-4" />
              </Button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
