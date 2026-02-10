"use client";

import React, { useState } from "react";
import ChatInterface from "./ChatInterface";

import DocumentExplorer from "../Document/DocumentExplorer";

import {
  Credentials,
  RAGConfig,
  ChunkScore,
  Theme,
  DocumentFilter,
} from "@/app/types";

interface ChatViewProps {
  selectedTheme: Theme;
  credentials: Credentials;
  addStatusMessage: (
    message: string,
    type: "INFO" | "WARNING" | "SUCCESS" | "ERROR"
  ) => void;
  production: "Local" | "Demo" | "Production";
  currentPage: string;
  RAGConfig: RAGConfig | null;
  setRAGConfig: React.Dispatch<React.SetStateAction<RAGConfig | null>>;
  documentFilter: DocumentFilter[];
  setDocumentFilter: React.Dispatch<React.SetStateAction<DocumentFilter[]>>;
}

const ChatView: React.FC<ChatViewProps> = ({
  credentials,
  selectedTheme,
  addStatusMessage,
  production,
  currentPage,
  RAGConfig,
  setRAGConfig,
  documentFilter,
  setDocumentFilter,
}) => {
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [selectedChunkScore, setSelectedChunkScore] = useState<ChunkScore[]>(
    []
  );
  return (
    <div className="flex md:flex-row flex-col justify-center gap-3 h-[50vh] md:h-[80vh] ">
      <div
        className={`transition-all duration-300 ease-in-out ${
          selectedDocument 
            ? "hidden md:flex md:w-[50vw]" 
            : "w-full md:w-full md:flex"
        }`}
      >
        <ChatInterface
          addStatusMessage={addStatusMessage}
          production={production}
          credentials={credentials}
          selectedTheme={selectedTheme}
          setSelectedDocument={setSelectedDocument}
          setSelectedChunkScore={setSelectedChunkScore}
          currentPage={currentPage}
          RAGConfig={RAGConfig}
          setRAGConfig={setRAGConfig}
          documentFilter={documentFilter}
          setDocumentFilter={setDocumentFilter}
        />
      </div>

      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          selectedDocument 
            ? "md:w-[50vw] w-full flex opacity-100" 
            : "md:w-0 md:opacity-0 hidden"
        }`}
      >
        <DocumentExplorer
          addStatusMessage={addStatusMessage}
          credentials={credentials}
          production={production}
          documentFilter={documentFilter}
          setDocumentFilter={setDocumentFilter}
          setSelectedDocument={setSelectedDocument}
          selectedTheme={selectedTheme}
          selectedDocument={selectedDocument}
          chunkScores={selectedChunkScore}
        />
      </div>
    </div>
  );
};

export default ChatView;
