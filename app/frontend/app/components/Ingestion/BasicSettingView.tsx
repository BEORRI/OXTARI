"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  FileData,
  FileMap,
  statusTextMap,
  statusColorMap,
  RAGComponentConfig,
} from "@/app/types";
import BEORRIButton from "../Navigation/BEORRIButton";
import { MdCancel } from "react-icons/md";
import { IoAddCircleSharp } from "react-icons/io5";
import { CgDebug } from "react-icons/cg";

import ComponentView from "./ComponentView";

import { MdError } from "react-icons/md";
import { FaCheckCircle } from "react-icons/fa";

interface BasicSettingViewProps {
  selectedFileData: string | null;
  fileMap: FileMap;
  setFileMap: React.Dispatch<React.SetStateAction<FileMap>>;
  blocked: boolean | undefined;
  selectComponent: (component_n: string, selected_component: string) => void;
  updateConfig: (
    component_n: string,
    configTitle: string,
    value: string | boolean | string[]
  ) => void;
  saveComponentConfig: (
    component_n: string,
    selected_component: string,
    component_config: RAGComponentConfig
  ) => void;
  addStatusMessage: (
    message: string,
    type: "INFO" | "WARNING" | "SUCCESS" | "ERROR"
  ) => void;
}

const BasicSettingView: React.FC<BasicSettingViewProps> = ({
  selectedFileData,
  fileMap,
  selectComponent,
  updateConfig,
  saveComponentConfig,
  setFileMap,
  blocked,
  addStatusMessage,
}) => {
  const [filename, setFilename] = useState("");
  const [source, setSource] = useState("");
  const [metadata, setMetadata] = useState("");
  const [label, setLabel] = useState("");

  useEffect(() => {
    if (selectedFileData) {
      setFilename(fileMap[selectedFileData].filename);
      setSource(fileMap[selectedFileData].source);
      setMetadata(fileMap[selectedFileData].metadata);
    }
  }, [fileMap, selectedFileData]);

  const updateFileMap = useCallback(
    (key: "filename" | "source" | "metadata", value: string) => {
      if (selectedFileData) {
        const newFileData: FileData = JSON.parse(
          JSON.stringify(fileMap[selectedFileData])
        );
        newFileData[key] = value;
        const newFileMap: FileMap = { ...fileMap };
        newFileMap[selectedFileData] = newFileData;
        setFileMap(newFileMap);
      }
    },
    [selectedFileData, fileMap, setFileMap]
  );

  const handleFilenameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newFilename = e.target.value;
      setFilename(newFilename);
      updateFileMap("filename", newFilename);
    },
    [updateFileMap]
  );

  const handleSourceChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newSource = e.target.value;
      setSource(newSource);
      updateFileMap("source", newSource);
    },
    [updateFileMap]
  );

  const handleMetadataChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newMetadata = e.target.value;
      setMetadata(newMetadata);
      updateFileMap("metadata", newMetadata);
    },
    [updateFileMap]
  );

  const openDebugModal = () => {
    const modal = document.getElementById("File_Debug_Modal");
    if (modal instanceof HTMLDialogElement) {
      modal.showModal();
    }
  };

  const formatByteSize = (bytes: number): string => {
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    if (bytes === 0) return "0 B";

    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = bytes / Math.pow(1024, i);
    return `${size.toFixed(2)} ${sizes[i]}`;
  };

  const setOverwrite = (o: boolean) => {
    if (selectedFileData) {
      const newFileData: FileData = JSON.parse(
        JSON.stringify(fileMap[selectedFileData])
      );
      newFileData.overwrite = o;
      const newFileMap: FileMap = { ...fileMap };
      newFileMap[selectedFileData] = newFileData;
      setFileMap(newFileMap);
    }
  };

  const addLabel = (l: string) => {
    if (
      selectedFileData &&
      !fileMap[selectedFileData].labels.includes(l) &&
      l.length > 0
    ) {
      const newFileData: FileData = JSON.parse(
        JSON.stringify(fileMap[selectedFileData])
      );
      newFileData.labels.push(l);
      const newFileMap: FileMap = { ...fileMap };
      newFileMap[selectedFileData] = newFileData;
      setFileMap(newFileMap);
      setLabel("");
    }
  };

  const removeLabel = (l: string) => {
    if (
      selectedFileData &&
      fileMap[selectedFileData].labels.includes(l) &&
      l.length > 0
    ) {
      const newFileData: FileData = JSON.parse(
        JSON.stringify(fileMap[selectedFileData])
      );
      newFileData.labels = newFileData.labels.filter((item) => item !== l);
      const newFileMap: FileMap = { ...fileMap };
      newFileMap[selectedFileData] = newFileData;
      setFileMap(newFileMap);
      setLabel("");
    }
  };

  function renderLabelBoxes(fileData: FileData) {
    return Object.entries(fileData.labels).map(([key, label]) => (
      <div key={fileData.fileID + key + label}>
        <BEORRIButton
          title={label}
          className="btn-sm"
          text_class_name="text-xs"
          onClick={() => {
            removeLabel(label);
          }}
          Icon={MdCancel}
        />
      </div>
    ));
  }

  if (selectedFileData) {
    return (
      <div className="flex flex-col justify-start gap-3 rounded-2xl p-1 w-full ">
        

        <ComponentView
          RAGConfig={fileMap[selectedFileData].rag_config}
          component_name="Reader"
          selectComponent={selectComponent}
          updateConfig={updateConfig}
          skip_component={true}
          saveComponentConfig={saveComponentConfig}
          blocked={fileMap[selectedFileData].block}
        />

        <div className="divider text-gray-600">File Settings</div>

        {/* Filename */}
        <div className="flex gap-2 justify-between items-center text-gray-900">
          <p className="flex min-w-[8vw] font-medium">Title</p>
          <label className="input flex items-center gap-2 w-full bg-transparent border border-gray-300">
            <input
              type="text"
              className="grow w-full"
              value={filename}
              onChange={handleFilenameChange}
              disabled={blocked}
            />
          </label>
        </div>

        <div className="flex gap-2 items-center text-gray-900">
          <p className="flex min-w-[8vw]"></p>
          <p className="text-sm text-gray-600 text-start">
            Add a Title to the document. If you are adding a URL, all URL will
            have a have their corresponding URL as filename.
          </p>
        </div>

        {/* Source */}
        <div className="flex gap-2 justify-between items-center text-gray-900">
          <p className="flex min-w-[8vw] font-medium">Source Link</p>
          <label className="input flex items-center gap-2 w-full bg-transparent border border-gray-300">
            <input
              type="text"
              className="grow w-full"
              value={source}
              onChange={handleSourceChange}
              disabled={blocked}
            />
          </label>
        </div>

        <div className="flex gap-2 items-center text-gray-900">
          <p className="flex min-w-[8vw]"></p>
          <p className="text-sm text-gray-600 text-start">
            Add a link to reference the original source of the document. You can
            access it through the Document Explorer via the View Source button
          </p>
        </div>

        {/* Labels */}
        <div className="flex gap-2 justify-between items-center text-gray-900">
          <p className="flex min-w-[8vw] font-medium">Labels</p>
          <label className="input flex items-center gap-2 w-full bg-transparent border border-gray-300">
            <input
              type="text"
              className="grow w-full"
              value={label}
              onChange={(e) => {
                setLabel(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addLabel(label);
                }
              }}
              disabled={blocked}
              title={label}
            />
          </label>
          <BEORRIButton
            title="Add"
            Icon={IoAddCircleSharp}
            onClick={() => {
              addLabel(label);
            }}
            disabled={blocked}
          />
        </div>

        <div className="flex gap-2 items-center text-gray-900">
          <p className="flex min-w-[8vw]"></p>
          <p className="text-sm text-gray-600 text-start">
            Add or remove labels for Document Filtering
          </p>
        </div>

        <div className="flex gap-2 items-center text-gray-900">
          <p className="flex min-w-[8vw]"></p>
          <div className="flex flex-wrap gap-2">
            {renderLabelBoxes(fileMap[selectedFileData])}
          </div>
        </div>

        {/* Overwrite */}
        <div className="flex gap-2 items-center text-gray-900">
          <p className="flex min-w-[8vw] font-medium">Overwrite</p>
          <input
            type="checkbox"
            className="checkbox checkbox-md"
            onChange={(e) =>
              setOverwrite((e.target as HTMLInputElement).checked)
            }
            checked={
              selectedFileData ? fileMap[selectedFileData].overwrite : false
            }
            disabled={blocked}
          />
        </div>

        <div className="flex gap-2 items-center text-gray-900">
          <p className="flex min-w-[8vw]"></p>
          <p className="text-sm text-gray-600 text-start">
            Overwrite existing documents with the same name.
          </p>
        </div>

        <div className="divider text-gray-600">Metadata</div>

        {/* Metadata */}
        <div className="flex gap-2 justify-between items-center text-gray-900">
          <p className="flex min-w-[8vw] font-medium">Metadata</p>
          <textarea
            className="grow w-full textarea flex items-center gap-2 max-h-64 bg-transparent border border-gray-300"
            value={metadata}
            onChange={handleMetadataChange}
            disabled={blocked}
          />
        </div>

        <div className="flex gap-2 items-center text-gray-900">
          <p className="flex min-w-[8vw]"></p>
          <p className="text-sm text-gray-600 text-start">
            Add metadata to the document to improve retrieval and generation.
            Metadata will added to the context sent to the embedding and
            generation, to influcence the results.
          </p>
        </div>

        <div className="divider text-gray-600">File Information</div>

        {/* Extension */}
        <div className="flex gap-2 justify-between items-center text-gray-900">
          <p className="flex min-w-[8vw] font-medium">Extension</p>
          <label className="input flex items-center gap-2 w-full bg-transparent border border-gray-300">
            <input
              type="text"
              className="grow w-full"
              value={fileMap[selectedFileData].extension}
              disabled={true}
            />
          </label>
        </div>

        {/* File Size */}
        <div className="flex gap-2 justify-between items-center text-gray-900">
          <p className="flex min-w-[8vw] font-medium">File Size</p>
          <label className="input flex items-center gap-2 w-full bg-transparent border border-gray-300">
            <input
              type="text"
              className="grow w-full"
              value={formatByteSize(fileMap[selectedFileData].file_size)}
              disabled={true}
            />
          </label>
        </div>

        <div className="divider text-gray-600">Ingestion Pipeline</div>

        {/* Reader */}
        <div className="flex gap-2 justify-between items-center text-gray-900">
          <p className="flex min-w-[8vw] font-medium">Reader</p>
          <label className="input flex items-center gap-2 w-full bg-transparent border border-gray-300">
            <input
              type="text"
              className="grow w-full"
              value={fileMap[selectedFileData].rag_config["Reader"].selected}
              disabled={true}
            />
          </label>
        </div>

        <div className="flex gap-2 items-center text-gray-900">
          <p className="flex min-w-[8vw]"></p>
          <p className="text-sm text-gray-600 text-start">
            {selectedFileData &&
              fileMap[selectedFileData].rag_config["Reader"].components[
                fileMap[selectedFileData].rag_config["Reader"].selected
              ].description}
          </p>
        </div>

        {/* Chunker */}
        <div className="flex gap-2 justify-between items-center text-gray-900">
          <p className="flex min-w-[8vw] font-medium">Chunker</p>
          <label className="input flex items-center gap-2 w-full bg-bg-oxtari">
            <input
              type="text"
              className="grow w-full"
              value={fileMap[selectedFileData].rag_config["Chunker"].selected}
              disabled={true}
            />
          </label>
        </div>

        <div className="flex gap-2 items-center text-gray-900">
          <p className="flex min-w-[8vw]"></p>
          <p className="text-sm text-gray-600 text-start">
            {selectedFileData &&
              fileMap[selectedFileData].rag_config["Chunker"].components[
                fileMap[selectedFileData].rag_config["Chunker"].selected
              ].description}
          </p>
        </div>

        {/* Embedder */}
        <div className="flex gap-2 justify-between items-center text-gray-900">
          <p className="flex min-w-[8vw] font-medium">Embedder</p>
          <label className="input flex items-center gap-2 w-full bg-bg-oxtari">
            <input
              type="text"
              className="grow w-full"
              value={fileMap[selectedFileData].rag_config["Embedder"].selected}
              disabled={true}
            />
          </label>
        </div>

        <div className="flex gap-2 items-center text-gray-900">
          <p className="flex min-w-[8vw]"></p>
          <p className="text-sm text-gray-600 text-start">
            {selectedFileData &&
              fileMap[selectedFileData].rag_config["Embedder"].components[
                fileMap[selectedFileData].rag_config["Embedder"].selected
              ].description}
          </p>
        </div>

        <div className="divider"></div>

        <div className="flex gap-2 justify-between items-center text-gray-900">
          <p className="flex min-w-[8vw] font-medium">Debug</p>
          <BEORRIButton
            Icon={CgDebug}
            onClick={openDebugModal}
            className="max-w-min"
          />
        </div>

        <dialog id={"File_Debug_Modal"} className="modal">
          <div className="modal-box min-w-fit">
            <h3 className="font-bold text-lg">Debugging File Configuration</h3>
            <pre className="whitespace-pre-wrap text-xs">
              {selectedFileData
                ? (() => {
                    // Create a shallow copy of the object
                    const objCopy = { ...fileMap[selectedFileData] };
                    // Delete the `content` property
                    objCopy.content = "File Content";
                    // Convert to a pretty-printed JSON string
                    return JSON.stringify(objCopy, null, 2);
                  })()
                : ""}
            </pre>
            <div className="modal-action">
              <form method="dialog">
                <button className="btn bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-900 border-2 border-gray-300 shadow-sm transition-all duration-200 ml-2">
                  Close
                </button>
              </form>
            </div>
          </div>
        </dialog>
        {selectedFileData && fileMap[selectedFileData].status != "READY" && (
          <div className="flex items-center gap-2 mb-2">
            <div className="h-px flex-grow bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
            <span className="text-sm font-semibold text-gray-600">Import Status</span>
            <div className="h-px flex-grow bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
          </div>
        )}
         <div className="flex flex-col gap-3">
          {selectedFileData &&
            Object.entries(fileMap[selectedFileData].status_report).map(
              ([status, statusReport]) => (
                <div className="flex flex-col gap-2" key={"Status" + status}>
                  <div className="flex gap-3 items-center">
                    <div className="flex items-center gap-2 min-w-[120px]">
                      {statusReport.status === "DONE" && (
                        <FaCheckCircle size={16} className="text-green-600" />
                      )}
                      {statusReport.status === "ERROR" && <MdError size={16} className="text-red-600" />}
                      <p className="text-sm font-medium text-gray-700">
                        {statusTextMap[statusReport.status]}
                      </p>
                    </div>
                    <div
                      className={`flex items-center px-4 py-2.5 rounded-xl border-2 shadow-md flex-grow transition-all duration-200 ${statusColorMap[statusReport.status]}`}
                    >
                      <p className="text-sm font-medium w-full">
                        {statusReport.took != 0
                          ? statusReport.message +
                            " (" +
                            statusReport.took +
                            "s)"
                          : statusReport.message}
                      </p>
                    </div>
                  </div>
                  
                  {/* Progress Bar for EMBEDDING status */}
                  {statusReport.status === "EMBEDDING" && statusReport.progress && (
                    <div className="ml-[120px] flex flex-col gap-2">
                      <div className="flex justify-between items-center text-xs text-gray-600">
                        <span>
                          {statusReport.progress.current}/{statusReport.progress.total} chunks
                          {statusReport.progress.current_batch && statusReport.progress.total_batches && 
                            ` (Batch ${statusReport.progress.current_batch}/${statusReport.progress.total_batches})`
                          }
                        </span>
                        <span className="font-medium">
                          {statusReport.progress.percentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full transition-all duration-300 ease-out"
                          style={{ width: `${statusReport.progress.percentage}%` }}
                        ></div>
                      </div>
                      {statusReport.progress.estimated_time_remaining && (
                        <div className="text-xs text-gray-500">
                          Estimated time remaining: {Math.round(statusReport.progress.estimated_time_remaining)}s
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            )}
        </div>
      </div>
    );
  } else {
    return <div></div>;
  }
};

export default BasicSettingView;
