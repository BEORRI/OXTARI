"use client";

import React from "react";
import { FaStar } from "react-icons/fa";
import BEORRIButton from "./BEORRIButton";

interface NavbarButtonProps {
  Icon: typeof FaStar;
  title: string;
  currentPage: string;
  setCurrentPage: (
    page: "CHAT" | "DOCUMENTS" | "STATUS" | "ADD" | "SETTINGS" | "RAG"
  ) => void;
  setPage: "CHAT" | "DOCUMENTS" | "STATUS" | "ADD" | "SETTINGS" | "RAG";
  hide: boolean;
}

const NavbarButton: React.FC<NavbarButtonProps> = ({
  Icon,
  title,
  currentPage,
  setPage,
  setCurrentPage,
  hide,
}) => {
  return (
    <BEORRIButton
      title={title}
      Icon={Icon}
      selected_color="bg-gradient-to-r from-gray-100 to-gray-200"
      selected_text_color="text-gray-900"
      selected={currentPage === setPage}
      onClick={() => {
        setCurrentPage(setPage);
      }}
      disabled={hide}
    />
  );
};

export default NavbarButton;
