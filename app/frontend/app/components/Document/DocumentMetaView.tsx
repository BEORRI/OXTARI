"use client";

import React, { useState, useEffect } from "react";
import { OxtariDocument, Credentials } from "@/app/types";
import { fetchSelectedDocument } from "@/app/api";

interface DocumentMetaViewProps {
  selectedDocument: string;
  credentials: Credentials;
}

const DocumentMetaView: React.FC<DocumentMetaViewProps> = ({
  selectedDocument,
  credentials,
}) => {
  const [isFetching, setIsFetching] = useState(true);
  const [document, setDocument] = useState<OxtariDocument | null>(null);

  useEffect(() => {
    handleFetchDocument();
  }, [selectedDocument]);

  const handleFetchDocument = async () => {
    try {
      setIsFetching(true);

      const data = await fetchSelectedDocument(selectedDocument, credentials);

      if (data) {
        if (data.error !== "") {
          setDocument(null);
          setIsFetching(false);
        } else {
          setDocument(data.document);
          setIsFetching(false);
        }
      }
    } catch (error) {
      console.error("Failed to fetch document:", error);
      setIsFetching(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {isFetching ? (
        <div className="flex items-center justify-center h-full">
          <span className="loading loading-spinner loading-md text-gray-900"></span>
        </div>
      ) : (
        document && (
          <div className="bg-bg-alt-oxtari flex flex-col rounded-lg overflow-hidden h-full gap-2">
            <div className="p-4 flex flex-col gap-2 items-start justify-start bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 rounded-2xl shadow-sm">
              <p className="font-bold flex text-xs text-start text-gray-600">
                Title
              </p>
              <p
                className="text-gray-900 truncate max-w-full font-medium"
                title={document.title}
              >
                {document.title}
              </p>
            </div>
            <div className="p-4 flex flex-col gap-2 items-start justify-start bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 rounded-2xl shadow-sm">
              <p className="font-bold flex text-xs text-start text-gray-600">
                Metadata
              </p>
              <p className="text-gray-900 max-w-full font-medium">{document.metadata}</p>
            </div>
            <div className="p-4 flex flex-col gap-2 items-start justify-start bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 rounded-2xl shadow-sm">
              <p className="font-bold flex text-xs text-start text-gray-600">
                Extension
              </p>
              <p className="text-gray-900 max-w-full font-medium">{document.extension}</p>
            </div>
            <div className="p-4 flex flex-col gap-2 items-start justify-start bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 rounded-2xl shadow-sm">
              <p className="font-bold flex text-xs text-start text-gray-600">
                File Size
              </p>
              <p className="text-gray-900 max-w-full font-medium">{document.fileSize}</p>
            </div>
            <div className="p-4 flex flex-col gap-2 items-start justify-start bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 rounded-2xl shadow-sm">
              <p className="font-bold flex text-xs text-start text-gray-600">
                Source
              </p>
              <button
                className="text-blue-600 hover:text-blue-700 truncate max-w-full font-medium underline"
                onClick={() => window.open(document.source, "_blank")}
                title={document.source}
              >
                {document.source}
              </button>
            </div>
            <div className="p-4 flex flex-col gap-2 items-start justify-start bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 rounded-2xl shadow-sm">
              <p className="font-bold flex text-xs text-start text-gray-600">
                Labels
              </p>
              <p className="text-gray-900 max-w-full font-medium">{document.labels}</p>
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default DocumentMetaView;
