"use client";

import React from "react";
import { FileData, FileMap, statusTextMap } from "@/app/types";
import { FaTrash } from "react-icons/fa";
import { FaCheckCircle } from "react-icons/fa";
import { MdError } from "react-icons/md";

import UserModalComponent from "../Navigation/UserModal";

import BEORRIButton from "../Navigation/BEORRIButton";

interface FileComponentProps {
  fileData: FileData;
  fileMap: FileMap;
  handleDeleteFile: (name: string) => void;
  selectedFileData: string | null;
  setSelectedFileData: (f: string | null) => void;
}

const FileComponent: React.FC<FileComponentProps> = ({
  fileData,
  fileMap,
  handleDeleteFile,
  selectedFileData,
  setSelectedFileData,
}) => {
  const openDeleteModal = () => {
    const modal = document.getElementById(
      "remove_file_" + fileMap[fileData.fileID].filename
    );
    if (modal instanceof HTMLDialogElement) {
      modal.showModal();
    }
  };

  const getStatusBadge = () => {
    const status = fileMap[fileData.fileID].status;
    
    if (status === "READY") {
      return (
        <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-900 border-2 border-gray-300 rounded-lg shadow-sm min-w-[120px] justify-center">
          <span className="text-xs font-medium truncate">
            {fileMap[fileData.fileID].rag_config["Reader"].selected}
          </span>
        </div>
      );
    }

    if (status === "DONE") {
      return (
        <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white border-2 border-green-400 rounded-lg shadow-sm min-w-[120px] justify-center">
          <FaCheckCircle size={14} />
          <span className="text-xs font-semibold">{statusTextMap[status]}</span>
        </div>
      );
    }

    if (status === "ERROR") {
      return (
        <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white border-2 border-red-400 rounded-lg shadow-sm min-w-[120px] justify-center">
          <MdError size={14} />
          <span className="text-xs font-semibold">{statusTextMap[status]}</span>
        </div>
      );
    }

    // Processing states
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white border-2 border-blue-400 rounded-lg shadow-sm min-w-[120px] justify-center">
        <span className="loading loading-spinner loading-xs"></span>
        <span className="text-xs font-semibold">{statusTextMap[status]}</span>
      </div>
    );
  };

  return (
    <div className="flex items-center gap-2 w-full">
      {getStatusBadge()}

      <button
        onClick={() => setSelectedFileData(fileData.fileID)}
        className={`flex-grow flex items-center justify-between rounded-2xl px-4 py-3 transition-all duration-200 border-2 shadow-md ${
          selectedFileData === fileMap[fileData.fileID].fileID
            ? "bg-gradient-to-r from-blue-600 to-blue-700 border-blue-500 text-white hover:from-blue-700 hover:to-blue-800"
            : "bg-gradient-to-r from-blue-500 to-blue-600 border-blue-400 text-white hover:from-blue-600 hover:to-blue-700"
        }`}
      >
        <span
          className="text-sm font-medium truncate max-w-[150px] lg:max-w-[300px]"
          title={fileMap[fileData.fileID].filename || "No Filename"}
        >
          {fileMap[fileData.fileID].filename || "No Filename"}
        </span>
      </button>

      <button
        onClick={openDeleteModal}
        className="flex items-center justify-center p-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 border-2 border-red-400 text-white hover:from-red-600 hover:to-red-700 shadow-md transition-all duration-200"
      >
        <FaTrash size={14} />
      </button>

      <UserModalComponent
        modal_id={"remove_file_" + fileMap[fileData.fileID].filename}
        title={"Remove File"}
        text={
          fileMap[fileData.fileID].isURL
            ? "Do you want to remove the URL?"
            : "Do you want to remove " +
              fileMap[fileData.fileID].filename +
              " from the selection?"
        }
        triggerString="Delete"
        triggerValue={fileMap[fileData.fileID].fileID}
        triggerAccept={handleDeleteFile}
      />
    </div>
  );
};

export default FileComponent;
