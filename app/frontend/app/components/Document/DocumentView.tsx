"use client";

import React, { useState } from "react";
import DocumentSearch from "./DocumentSearch";
import DocumentExplorer from "./DocumentExplorer";
import { Credentials, Theme, DocumentFilter } from "@/app/types";

interface DocumentViewProps {
  selectedTheme: Theme;
  production: "Local" | "Demo" | "Production";
  credentials: Credentials;
  documentFilter: DocumentFilter[];
  setDocumentFilter: React.Dispatch<React.SetStateAction<DocumentFilter[]>>;
  addStatusMessage: (
    message: string,
    type: "INFO" | "WARNING" | "SUCCESS" | "ERROR"
  ) => void;
}

const DocumentView: React.FC<DocumentViewProps> = ({
  selectedTheme,
  production,
  credentials,
  documentFilter,
  setDocumentFilter,
  addStatusMessage,
}) => {
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);

  return (
    <div className="flex md:flex-row flex-col justify-center gap-3 h-[50vh] md:h-[80vh]">
      <div
        className={`transition-all duration-300 ease-in-out ${
          selectedDocument 
            ? "hidden md:flex md:w-[50vw]" 
            : "w-full md:w-full md:flex"
        }`}
      >
        <DocumentSearch
          production={production}
          addStatusMessage={addStatusMessage}
          setSelectedDocument={setSelectedDocument}
          credentials={credentials}
          selectedDocument={selectedDocument}
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
          production={production}
          credentials={credentials}
          addStatusMessage={addStatusMessage}
          setSelectedDocument={setSelectedDocument}
          selectedTheme={selectedTheme}
          selectedDocument={selectedDocument}
          documentFilter={documentFilter}
          setDocumentFilter={setDocumentFilter}
        />
      </div>
    </div>
  );
};

export default DocumentView;
