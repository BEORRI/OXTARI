"use client";

import React from "react";
import { ChunkScore, Message } from "@/app/types";
import ReactMarkdown from "react-markdown";
import { FaDatabase } from "react-icons/fa";
import { BiError } from "react-icons/bi";
import { IoNewspaper } from "react-icons/io5";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { IoDocumentAttach } from "react-icons/io5";
import {
  oneDark,
  oneLight,
} from "react-syntax-highlighter/dist/cjs/styles/prism";

import BEORRIButton from "../Navigation/BEORRIButton";

import { Theme } from "@/app/types";

interface ChatMessageProps {
  message: Message;
  message_index: number;
  selectedTheme: Theme;
  selectedDocument: string | null;
  setSelectedDocument: (s: string | null) => void;
  setSelectedDocumentScore: (s: string | null) => void;
  setSelectedChunkScore: (s: ChunkScore[]) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  selectedTheme,
  selectedDocument,
  setSelectedDocument,
  message_index,
  setSelectedDocumentScore,
  setSelectedChunkScore,
}) => {
  const getMessageStyles = (type: string) => {
    switch (type) {
      case "user":
        return "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-900 border-2 border-gray-300 shadow-md";
      case "system":
        return "bg-gradient-to-r from-blue-700 to-blue-800 text-white border-2 border-blue-600 shadow-md";
      case "error":
        return "bg-gradient-to-r from-red-500 to-red-600 text-white border-2 border-red-400 shadow-md";
      case "retrieval":
        return "bg-gradient-to-r from-blue-700 to-blue-800 text-white border-2 border-blue-600 shadow-md";
      default:
        return "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-900 border-2 border-gray-300 shadow-md";
    }
  };

  // Don't render empty messages
  if (!message || !message.content) {
    return null;
  }

  if (typeof message.content === "string" && !message.content.trim()) {
    return null;
  }

  if (typeof message.content === "string") {
    return (
      <div
        className={`flex items-end gap-2 ${message.type === "user" ? "justify-end" : "justify-start"}`}
      >
        <div
          className={`flex flex-col items-start ${message.type === "error" ? "px-3 py-2" : "px-4 py-3"} rounded-3xl animate-press-in ${message.type === "error" ? "text-xs text-white" : "text-sm lg:text-base"} transition-all duration-200 ${getMessageStyles(message.type)}`}
        >
          {message.cached && (
            <FaDatabase size={12} className={message.type === "system" ? "text-white" : "text-gray-700"} />
          )}
          {message.type === "system" && (
            <div className="text-white [&_ol]:text-white [&_ul]:text-white [&_li]:text-white [&_li::marker]:text-white">
              <ReactMarkdown
                className="prose prose-invert md:prose-sm lg:prose-base prose-pre:bg-blue-700/30 max-w-none prose-p:text-white prose-headings:text-white prose-strong:text-white prose-li:text-white prose-ul:text-white prose-ol:text-white prose-li:marker:text-white"
                components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || "");
                  return !inline && match ? (
                    <SyntaxHighlighter
                      style={
                        selectedTheme.theme === "dark"
                          ? (oneDark as any)
                          : (oneLight as any)
                      }
                      language={match[1]}
                      PreTag="div"
                      {...props}
                    >
                      {String(children).replace(/\n$/, "")}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
            </div>
          )}
          {message.type === "user" && (
            <div className="whitespace-pre-wrap">{message.content}</div>
          )}
          {message.type === "error" && (
            <div className="whitespace-pre-wrap flex items-center gap-1.5 !text-white">
              <BiError size={12} className="!text-white" />
              <p className="!text-white">{message.content}</p>
            </div>
          )}
        </div>
      </div>
    );
  } else if (Array.isArray(message.content) && message.content.length > 0) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 w-full items-center">
        {message.content.map((document, index) => (
          <button
            onClick={() => {
              setSelectedDocument(document.uuid);
              setSelectedDocumentScore(
                document.uuid + document.score + document.chunks.length
              );
              setSelectedChunkScore(document.chunks);
            }}
            key={"Retrieval" + document.title + index}
            className={`flex rounded-3xl p-4 items-center justify-between transition-all duration-200 ease-in-out border-2 shadow-md ${
              selectedDocument === (document.uuid + document.score + document.chunks.length)
                ? "bg-gradient-to-r from-blue-600 to-blue-700 border-blue-500 text-white hover:from-blue-700 hover:to-blue-800" 
                : "bg-gradient-to-r from-blue-500 to-blue-600 border-blue-400 text-white hover:from-blue-600 hover:to-blue-700"
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <p
                className="text-sm font-medium flex-grow truncate mr-2"
                title={document.title}
              >
                {document.title}
              </p>
              <div className="flex gap-1.5 items-center flex-shrink-0">
                <IoNewspaper size={14} />
                <p className="text-sm font-medium">{document.chunks.length}</p>
              </div>
            </div>
          </button>
        ))}
        <BEORRIButton
          Icon={IoDocumentAttach}
          className="btn-sm btn-square"
          onClick={() =>
            (
              document.getElementById(
                "context-modal-" + message_index
              ) as HTMLDialogElement
            ).showModal()
          }
        />
        <dialog id={"context-modal-" + message_index} className="modal modal-bottom sm:modal-middle">
          <div className="modal-box max-w-3xl relative">
            <form method="dialog">
              <button className="btn btn-sm btn-circle btn-ghost sticky top-0 right-0 float-right z-10 hover:bg-gray-200 bg-white shadow-md">
                ✕
              </button>
            </form>
            <h3 className="font-bold text-xl text-gray-900 mb-4 pr-12">Context Information</h3>
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 border-2 border-gray-200 max-h-[60vh] overflow-y-auto">
              <div className="text-base text-gray-800 space-y-3">
                {message.context &&
                  message.context
                    .split(/(?=[○●•◦▪▫])/)
                    .filter(line => line.trim())
                    .map((line, idx) => {
                      const trimmedLine = line.trim();
                      const hasBullet = /^[○●•◦▪▫]/.test(trimmedLine);
                      
                      if (hasBullet) {
                        const bulletChar = trimmedLine.charAt(0);
                        const content = trimmedLine.substring(1).trim();
                        return (
                          <div key={idx} className="flex items-start gap-2.5 ml-2">
                            <span className="font-bold text-lg flex-shrink-0 mt-0.5">
                              {bulletChar}
                            </span>
                            <span className="flex-1 leading-relaxed">{content}</span>
                          </div>
                        );
                      }
                      
                      return trimmedLine ? (
                        <div key={idx} className="leading-relaxed">
                          {trimmedLine}
                        </div>
                      ) : null;
                    })}
              </div>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button>close</button>
          </form>
        </dialog>
      </div>
    );
  }
  
  // Fallback for unexpected content types
  return null;
};

export default ChatMessage;
