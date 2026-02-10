"use client";

import React, { useState, useEffect } from "react";
import { OxtariChunk, ChunksPayload, Theme } from "@/app/types";
import { IoNewspaper } from "react-icons/io5";
import { FaArrowAltCircleRight, FaArrowAltCircleLeft } from "react-icons/fa";

import { fetch_chunks } from "@/app/api";
import { Credentials } from "@/app/types";

import BEORRIButton from "../Navigation/BEORRIButton";

interface ChunkViewProps {
  selectedDocument: string | null;
  selectedTheme: Theme;
  credentials: Credentials;
}

const ChunkView: React.FC<ChunkViewProps> = ({
  selectedDocument,
  credentials,
  selectedTheme,
}) => {
  const [isFetching, setIsFetching] = useState(false);
  const [chunks, setChunks] = useState<OxtariChunk[]>([]);
  const [page, setPage] = useState(1);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [isPreviousDisabled, setIsPreviousDisabled] = useState(true);

  useEffect(() => {
    fetchChunks(page);
    setIsPreviousDisabled(page === 1 && currentChunkIndex === 0);
  }, [page, currentChunkIndex]);

  useEffect(() => {
    fetchChunks(1);
    setCurrentChunkIndex(0);
    setIsPreviousDisabled(page === 1 && currentChunkIndex === 0);
  }, [selectedDocument]);

  const pageSize = 10;

  const nextChunk = async () => {
    if (currentChunkIndex === chunks.length - 1) {
      const hasMoreChunks = await fetchChunks(page + 1);
      if (hasMoreChunks) {
        setPage((prev) => prev + 1);
        setCurrentChunkIndex(0);
      } else {
        await fetchChunks(1);
        setPage(1);
        setCurrentChunkIndex(0);
      }
    } else {
      setCurrentChunkIndex((prev) => prev + 1);
    }
  };

  const previousChunk = async () => {
    if (currentChunkIndex === 0) {
      if (page > 1) {
        const prevPage = page - 1;
        const hasChunks = await fetchChunks(prevPage);
        if (hasChunks) {
          setPage(prevPage);
          setCurrentChunkIndex(pageSize - 1);
        }
      } else {
        let lastPage = page;
        let hasMoreChunks = true;
        while (hasMoreChunks) {
          hasMoreChunks = await fetchChunks(lastPage + 1);
          if (hasMoreChunks) lastPage++;
        }
        await fetchChunks(lastPage);
        setPage(lastPage);
        setCurrentChunkIndex(chunks.length - 1);
      }
    } else {
      setCurrentChunkIndex((prev) => prev - 1);
    }
  };

  const fetchChunks = async (pageNumber: number) => {
    try {
      setIsFetching(true);

      const data: ChunksPayload | null = await fetch_chunks(
        selectedDocument,
        pageNumber,
        pageSize,
        credentials
      );

      if (data) {
        if (data.error !== "") {
          console.error(data.error);
          setIsFetching(false);
          setChunks([]);
          return false; // No more chunks available
        } else {
          setChunks(data.chunks);
          setIsFetching(false);
          return data.chunks.length > 0; // Return true if chunks were fetched
        }
      }
      return false; // No more chunks available
    } catch (error) {
      console.error("Failed to fetch document:", error);
      setIsFetching(false);
      return false; // No more chunks available
    }
  };

  if (chunks.length == 0) {
    return (
      <div>
        {isFetching && (
          <div className="flex items-center justify-center text-gray-900 gap-2 h-full">
            <span className="loading loading-spinner loading-sm"></span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {chunks.length > 0 && (
        <div className="bg-bg-alt-oxtari flex flex-col rounded-lg overflow-hidden h-full">
          {/* Content div */}
          <div className="flex-grow overflow-hidden p-3">
            <div className="flex justify-between mb-2">
              <div className="flex gap-2">
                <div className="flex gap-2 items-center px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white border-2 border-blue-400 shadow-sm rounded-full w-fit transition-all duration-200">
                  <IoNewspaper size={12} />
                  <p className="text-xs font-medium">
                    Chunk {chunks[currentChunkIndex].chunk_id}
                  </p>
                </div>
              </div>
            </div>
            <div className="overflow-y-auto h-[calc(100%-3rem)] p-3">
              <div className="text-base text-gray-800 space-y-3">
                {chunks[currentChunkIndex].content
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

          {/* Navigation div */}
          {chunks.length > 1 && (
            <div className="flex justify-center items-center gap-2 p-3 bg-bg-alt-oxtari">
              <BEORRIButton
                title={"Previous Chunk"}
                onClick={previousChunk}
                className="btn-sm min-w-min max-w-[200px]"
                text_class_name="text-xs"
                disabled={isPreviousDisabled}
                Icon={FaArrowAltCircleLeft}
              />
              <BEORRIButton
                title={"Next Chunk"}
                onClick={nextChunk}
                className="btn-sm min-w-min max-w-[200px]"
                text_class_name="text-xs"
                Icon={FaArrowAltCircleRight}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChunkView;
