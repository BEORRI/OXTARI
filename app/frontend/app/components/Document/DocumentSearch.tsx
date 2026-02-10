"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  DocumentPreview,
  Credentials,
  DocumentsPreviewPayload,
} from "@/app/types";
import { retrieveAllDocuments, deleteDocument } from "@/app/api";
import { FaSearch, FaTrash } from "react-icons/fa";
import { MdOutlineRefresh, MdCancel } from "react-icons/md";
import { FaArrowAltCircleLeft, FaArrowAltCircleRight } from "react-icons/fa";
import InfoComponent from "../Navigation/InfoComponent";
import UserModalComponent from "../Navigation/UserModal";
import BEORRIButton from "../Navigation/BEORRIButton";
import { IoMdAddCircle } from "react-icons/io";

interface DocumentSearchComponentProps {
  selectedDocument: string | null;
  credentials: Credentials;
  setSelectedDocument: (c: string | null) => void;
  production: "Local" | "Demo" | "Production";
  addStatusMessage: (
    message: string,
    type: "INFO" | "WARNING" | "SUCCESS" | "ERROR"
  ) => void;
}

const DocumentSearch: React.FC<DocumentSearchComponentProps> = ({
  selectedDocument,
  setSelectedDocument,
  production,
  addStatusMessage,
  credentials,
}) => {
  const [userInput, setUserInput] = useState("");
  const [page, setPage] = useState(1);

  const [documents, setDocuments] = useState<DocumentPreview[] | null>([]);
  const [totalDocuments, setTotalDocuments] = useState(0);

  const pageSize = 50;

  const [labels, setLabels] = useState<string[]>([]);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [triggerSearch, setTriggerSearch] = useState(false);
  const [isLabelDropdownOpen, setIsLabelDropdownOpen] = useState(false);
  const labelDropdownRef = useRef<HTMLDivElement>(null);
  const labelDropdownMenuRef = useRef<HTMLUListElement>(null);

  const [isFetching, setIsFetching] = useState(false);

  const nextPage = () => {
    if (!documents) {
      return;
    }

    if (page * pageSize < totalDocuments) {
      setPage((prev) => prev + 1);
    } else {
      setPage(1);
    }
  };

  const previousPage = () => {
    if (!documents) {
      return;
    }
    if (page == 1) {
      setPage(Math.ceil(totalDocuments / pageSize));
    } else {
      setPage((prev) => prev - 1);
    }
  };

  const fetchAllDocuments = async (_userInput?: string) => {
    try {
      setIsFetching(true);

      const data: DocumentsPreviewPayload | null = await retrieveAllDocuments(
        _userInput ? _userInput : "",
        selectedLabels,
        page,
        pageSize,
        credentials
      );

      if (data) {
        if (data.error !== "") {
          console.error(data.error);
          setIsFetching(false);
          setDocuments(null);
          setTotalDocuments(0);
        } else {
          setDocuments(data.documents);
          setLabels(data.labels);
          setIsFetching(false);
          setTotalDocuments(data.totalDocuments);
        }
      }
    } catch (error) {
      console.error("Failed to fetch document:", error);
      setIsFetching(false);
    }
  };

  useEffect(() => {
    setTriggerSearch(true);
  }, []);

  useEffect(() => {
    fetchAllDocuments(userInput);
  }, [page, triggerSearch, selectedLabels]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        labelDropdownRef.current &&
        !labelDropdownRef.current.contains(event.target as Node)
      ) {
        setIsLabelDropdownOpen(false);
      }
    };

    if (isLabelDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isLabelDropdownOpen]);

  // Scroll dropdown menu into view when opened
  useEffect(() => {
    if (isLabelDropdownOpen && labelDropdownMenuRef.current) {
      setTimeout(() => {
        labelDropdownMenuRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "nearest",
        });
      }, 50); // Small delay to ensure dropdown is rendered
    }
  }, [isLabelDropdownOpen]);

  const handleSearch = () => {
    fetchAllDocuments(userInput);
  };

  const clearSearch = () => {
    setUserInput("");
    setSelectedLabels([]);
    fetchAllDocuments("");
  };

  const handleKeyDown = (e: any) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // Prevent new line
      handleSearch(); // Submit form
    }
  };

  const handleDeleteDocument = async (d: string) => {
    if (production == "Demo") {
      return;
    }
    const response = await deleteDocument(d, credentials);
    addStatusMessage("Deleted document", "WARNING");
    if (response) {
      if (d == selectedDocument) {
        setSelectedDocument(null);
      }
      fetchAllDocuments(userInput);
    }
  };

  const addLabel = (l: string) => {
    setSelectedLabels((prev) => [...prev, l]);
  };

  const removeLabel = (l: string) => {
    setSelectedLabels((prev) => prev.filter((label) => label !== l));
  };

  const openDeleteModal = (id: string) => {
    const modal = document.getElementById(id);
    if (modal instanceof HTMLDialogElement) {
      modal.showModal();
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Search Header */}
      <div className="bg-bg-alt-oxtari rounded-2xl flex gap-2 p-3 items-center justify-between h-min w-full shadow-lg border border-gray-200">
        <div className="hidden lg:flex gap-2 justify-start w-[8vw]">
          <InfoComponent
            tooltip_text="Search and inspect different documents imported into BEORRI"
            display_text="Search"
          />
        </div>

        <label className="input flex items-center gap-2 w-full bg-bg-oxtari">
          <input
            type="text"
            className="grow w-full"
            onKeyDown={handleKeyDown}
            placeholder={`Search for documents (${totalDocuments})`}
            value={userInput}
            onChange={(e) => {
              setUserInput(e.target.value);
            }}
          />
        </label>

        <BEORRIButton onClick={handleSearch} Icon={FaSearch} />
        <BEORRIButton
          onClick={clearSearch}
          icon_size={20}
          Icon={MdOutlineRefresh}
        />
      </div>

      {/* Document List */}
      <div className="bg-bg-alt-oxtari rounded-2xl flex flex-col p-6 gap-3 items-center h-full w-full overflow-auto shadow-lg border border-gray-200">
        <div className="flex flex-col w-full justify-start gap-2">
          <div className="dropdown" ref={labelDropdownRef}>
            <label tabIndex={0}>
              <BEORRIButton
                title="Label"
                className="btn-sm min-w-min"
                icon_size={12}
                text_class_name="text-xs"
                Icon={IoMdAddCircle}
                selected={false}
                disabled={false}
                onClick={() => setIsLabelDropdownOpen(!isLabelDropdownOpen)}
              />
            </label>
            {isLabelDropdownOpen && (
              <ul
                ref={labelDropdownMenuRef}
                tabIndex={0}
                className="dropdown-content z-[1] menu p-2 shadow-lg bg-white border-2 border-gray-200 rounded-lg w-52 max-h-60 overflow-auto"
              >
                {labels.map((label, index) => (
                  <li key={"Label" + index}>
                    <a
                      className="hover:bg-gray-100 rounded-md text-gray-700 font-medium transition-colors duration-150 px-3 py-2"
                      onClick={() => {
                        if (!selectedLabels.includes(label)) {
                          setSelectedLabels([...selectedLabels, label]);
                        }
                        setIsLabelDropdownOpen(false);
                      }}
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedLabels.map((label, index) => (
              <BEORRIButton
                title={label}
                key={"FilterDocumentLabel" + index}
                Icon={MdCancel}
                className="btn-sm min-w-min max-w-[200px]"
                icon_size={12}
                selected_color="bg-gradient-to-r from-gray-100 to-gray-200"
                selected_text_color="text-gray-900"
                selected={true}
                text_class_name="truncate max-w-[200px]"
                text_size="text-xs"
                onClick={() => {
                  removeLabel(label);
                }}
              />
            ))}
          </div>
        </div>

        {isFetching && (
          <div className="flex items-center justify-center gap-2">
            <span className="loading loading-spinner loading-sm text-gray-600"></span>
          </div>
        )}

        <div className="flex flex-col w-full gap-2">
          {documents &&
            documents.map((document, index) => (
              <div
                key={"Document" + index + document.title}
                className="flex justify-between items-center gap-2 w-full"
              >
                <button
                  onClick={() => setSelectedDocument(document.uuid)}
                  className={`flex-grow flex items-center justify-between rounded-2xl px-4 py-3 transition-all duration-200 border-2 shadow-md ${
                    selectedDocument == document.uuid
                      ? "bg-gradient-to-r from-blue-600 to-blue-700 border-blue-500 text-white hover:from-blue-700 hover:to-blue-800"
                      : "bg-gradient-to-r from-blue-500 to-blue-600 border-blue-400 text-white hover:from-blue-600 hover:to-blue-700"
                  }`}
                >
                  <span
                    className="text-sm font-medium truncate max-w-[150px] lg:max-w-[350px]"
                    title={document.title}
                  >
                    {document.title}
                  </span>
                </button>
                {production !== "Demo" && (
                  <button
                    onClick={() => {
                      openDeleteModal("remove_document" + document.uuid);
                    }}
                    className="flex items-center justify-center p-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 border-2 border-red-400 text-white hover:from-red-600 hover:to-red-700 shadow-md transition-all duration-200"
                  >
                    <FaTrash size={14} />
                  </button>
                )}
                <UserModalComponent
                  modal_id={"remove_document" + document.uuid}
                  title={"Remove Document"}
                  text={"Do you want to remove " + document.title + "?"}
                  triggerString="Delete"
                  triggerValue={document.uuid}
                  triggerAccept={handleDeleteDocument}
                />
              </div>
            ))}{" "}
        </div>
      </div>

      <div className="bg-bg-alt-oxtari rounded-2xl flex gap-3 p-4 items-center justify-center h-min w-full shadow-lg border border-gray-200">
        <div className="flex justify-center items-center gap-3">
          <BEORRIButton
            title={"Previous"}
            onClick={previousPage}
            Icon={FaArrowAltCircleLeft}
            variant="primary"
          />
          <div className="flex items-center px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-900 border-2 border-gray-300 rounded-lg shadow-sm">
            <p className="text-sm font-semibold">Page {page}</p>
          </div>
          <BEORRIButton
            title={"Next"}
            onClick={nextPage}
            Icon={FaArrowAltCircleRight}
            variant="primary"
          />
        </div>
      </div>
    </div>
  );
};

export default DocumentSearch;
