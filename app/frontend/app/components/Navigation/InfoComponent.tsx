"use client";

import React, { useState } from "react";
import { FaInfo } from "react-icons/fa";
import BEORRIButton from "./BEORRIButton";

interface InfoComponentProps {
  tooltip_text: string;
  display_text: string;
}

const InfoComponent: React.FC<InfoComponentProps> = ({
  tooltip_text,
  display_text,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className={`items-center gap-2 flex`}>
      <div
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="relative cursor-pointer flex flex-col items-center text-gray-600"
      >
        <p className="text-lg ml-3 font-medium">{display_text}</p>
        <div
          className={`absolute top-full left-full mt-2 z-30 p-4 bg-gradient-to-r from-gray-50 to-gray-100 text-gray-900 text-xs rounded-xl shadow-lg border-2 border-gray-200 w-[300px] transition-opacity duration-300 ${
            showTooltip ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <p className="w-full text-xs whitespace-normal">{tooltip_text}</p>
        </div>
      </div>
    </div>
  );
};

export default InfoComponent;
