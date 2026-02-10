"use client";

import React from "react";

interface StatusLabelProps {
  status: boolean;
  true_text: string;
  false_text: string;
}

const StatusLabel: React.FC<StatusLabelProps> = ({
  status,
  true_text,
  false_text,
}) => {
  return (
    <div
      className={`px-4 py-2 rounded-xl text-sm border-2 shadow-sm ${status ? "bg-gradient-to-r from-green-500 to-green-600 text-white border-green-400" : "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 border-gray-300"}`}
    >
      <p className="text-xs font-medium">
        {status ? true_text : false_text}
      </p>
    </div>
  );
};

export default StatusLabel;
