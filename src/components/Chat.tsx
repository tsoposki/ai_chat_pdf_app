"use client";

import React, { useRef, useEffect } from "react";
import { Input } from "./ui/input";
import { Bot, Loader2, Send, User } from "lucide-react";
import { Button } from "./ui/button";
import { cn, scrollToBottom } from "@/lib/utils";
import { Message, useChat } from "ai/react"
import { Document, Message as MessageDB } from "@/generated/prisma";

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
                <div className="text-sm font-light overflow-hidden leading-7">{message.content}</div>
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
