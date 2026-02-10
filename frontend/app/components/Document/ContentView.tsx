"use client";

import React, { useState, useEffect, useRef } from "react";
import { FaArrowAltCircleLeft, FaArrowAltCircleRight } from "react-icons/fa";
import { HiSparkles } from "react-icons/hi2";
import { IoNewspaper } from "react-icons/io5";
import {
  OxtariDocument,
  ContentPayload,
  Credentials,
  ContentSnippet,
  Theme,
  ChunkScore,
} from "@/app/types";
import { fetchContent } from "@/app/api";

import BEORRIButton from "../Navigation/BEORRIButton";

interface ContentViewProps {
  document: OxtariDocument | null;
  selectedTheme: Theme;
  selectedDocument: string;
  credentials: Credentials;
  chunkScores?: ChunkScore[];
}

const ContentView: React.FC<ContentViewProps> = ({
  document,
  selectedDocument,
  selectedTheme,
  credentials,
  chunkScores,
}) => {
  const [isFetching, setIsFetching] = useState(true);
  const [page, setPage] = useState(1);
  const [maxPage, setMaxPage] = useState(1);
  const [content, setContent] = useState<ContentSnippet[]>([]);

  const contentRef = useRef<HTMLDivElement>(null);

  const nextPage = () => {
    if (page == maxPage) {
      setPage(1);
    } else {
      setPage((prev) => prev + 1);
    }
  };

  const previousPage = () => {
    if (page == 1) {
      setPage(maxPage);
    } else {
      setPage((prev) => prev - 1);
    }
  };

  useEffect(() => {
    if (document) {
      handleFetchContent();
      setPage(1);
    } else {
      setContent([]);
      setPage(1);
      setMaxPage(1);
    }
  }, [document, chunkScores]);

  useEffect(() => {
    if (document) {
      handleFetchContent();
    } else {
      setContent([]);
      setPage(1);
      setMaxPage(1);
    }
  }, [page]);

  useEffect(() => {
    if (chunkScores && chunkScores.length > 0) {
      contentRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [content, chunkScores]);

  const handleFetchContent = async () => {
    try {
      setIsFetching(true);

      const data: ContentPayload | null = await fetchContent(
        selectedDocument,
        page,
        chunkScores ? chunkScores : [],
        credentials
      );

      if (data) {
        if (data.error !== "") {
          setContent([
            { content: data.error, chunk_id: 0, score: 0, type: "text" },
          ]);
          setPage(1);
          setMaxPage(1);
          setIsFetching(false);
        } else {
          setContent(data.content);
          setMaxPage(data.maxPage);
          setIsFetching(false);
        }
      }
    } catch (error) {
      console.error("Failed to fetch content from document:", error);
      setIsFetching(false);
    }
  };

  const renderText = (contentSnippet: ContentSnippet, index: number) => {
    if (contentSnippet.type === "text") {
      return (
        <div
          key={"CONTENT_SNIPPET" + index}
          className="flex p-2"
          ref={!chunkScores ? contentRef : null}
        >
          <div className="w-full p-3 text-base text-gray-800 space-y-3">
            {contentSnippet.content
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
      );
    } else {
      return (
        <div
          className="flex p-2 border-2 flex-col gap-2 border-secondary-oxtari shadow-lg rounded-3xl"
          ref={contentRef}
        >
          <div className="flex justify-between">
            <div className="flex gap-2 flex-wrap">
              <div className="flex gap-2 items-center px-3 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white border-2 border-amber-400 shadow-sm rounded-full w-fit transition-all duration-200">
                <HiSparkles size={12} />
                <p className="text-xs font-medium">Context Used</p>
              </div>
              <div className="flex gap-2 items-center px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white border-2 border-blue-400 shadow-sm rounded-full w-fit transition-all duration-200">
                <IoNewspaper size={12} />
                <p className="text-xs font-medium">
                  Chunk {contentSnippet.chunk_id + 1}
                </p>
              </div>
              {contentSnippet.score > 0 && (
                <div className="flex gap-2 items-center px-3 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white border-2 border-green-400 shadow-sm rounded-full w-fit transition-all duration-200">
                  <HiSparkles size={12} />
                  <p className="text-xs font-medium">High Relevancy</p>
                </div>
              )}
            </div>
          </div>
          <div className="w-full p-3 text-base text-gray-800 space-y-3">
            {contentSnippet.content
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
      );
    }
  };

  if (!document) {
    return <div></div>;
  }

  return (
    <div className="flex flex-col h-full">
      {document && (
        <div className="bg-bg-alt-oxtari flex flex-col rounded-lg overflow-hidden h-full">
          {/* Header */}
          <div className="p-3 bg-bg-alt-oxtari">
            <div className="flex gap-4 w-full justify-between">
              <div className="flex gap-4 items-center">
                {isFetching && (
                  <div className="flex items-center justify-center text-gray-900 gap-2">
                    <span className="loading loading-spinner loading-sm"></span>
                  </div>
                )}
                <p
                  className="text-lg font-bold truncate max-w-[350px]"
                  title={document.title}
                >
                  {document.title}
                </p>
              </div>
              <div className="gap-2 flex flex-wrap">
                {Object.entries(document.labels).map(([key, label]) => (
                  <BEORRIButton
                    key={document.title + key + label}
                    title={label}
                    text_size="text-xs"
                    text_class_name="truncate max-w-[200px]"
                    className="btn-sm min-w-min max-w-[200px]"
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Content div */}
          <div className="flex-grow overflow-hidden p-3">
            <div className="overflow-y-auto h-full">
              {content &&
                content.map((contentSnippet, index) =>
                  renderText(contentSnippet, index)
                )}
            </div>
          </div>

          {/* Navigation div */}

          <div className="flex justify-center items-center gap-2 p-3 bg-bg-alt-oxtari">
            <BEORRIButton
              title={"Previous " + (chunkScores ? "Chunk" : "Page")}
              onClick={previousPage}
              className="btn-sm min-w-min max-w-[200px]"
              text_class_name="text-xs"
              Icon={FaArrowAltCircleLeft}
            />
            <div className="flex items-center">
              <p className="text-xs text-gray-900 font-medium">
                {chunkScores ? "Chunk " : "Page "} {page}
              </p>
            </div>
            <BEORRIButton
              title={"Next " + (chunkScores ? "Chunk" : "Page")}
              onClick={nextPage}
              className="btn-sm min-w-min max-w-[200px]"
              text_class_name="text-xs"
              Icon={FaArrowAltCircleRight}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentView;
