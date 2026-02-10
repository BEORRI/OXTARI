"use client";

import React from "react";
import { FaStar } from "react-icons/fa";

interface BEORRIButtonProps {
  title?: string;
  Icon?: typeof FaStar;
  onClick?: (...args: any[]) => void;
  onMouseEnter?: (...args: any[]) => void;
  onMouseLeave?: (...args: any[]) => void;
  disabled?: boolean;
  key?: string;
  className?: string;
  type?: "button" | "submit" | "reset";
  selected?: boolean;
  selected_color?: string;
  selected_text_color?: string;
  circle?: boolean;
  text_class_name?: string;
  loading?: boolean;
  text_size?: string;
  icon_size?: number;
  onClickParams?: any[];
  variant?: "primary" | "secondary" | "ghost" | "outline";
}

const BEORRIButton: React.FC<BEORRIButtonProps> = ({
  title = "",
  key = "Button" + title,
  Icon,
  onClick = () => {},
  onMouseEnter = () => {},
  onMouseLeave = () => {},
  disabled = false,
  className = "",
  text_class_name = "",
  selected = false,
  selected_color = "",
  selected_text_color = "",
  text_size = "text-sm",
  icon_size = 16,
  type = "button",
  loading = false,
  circle = false,
  onClickParams = [],
  variant = "outline",
}) => {
  const getVariantClasses = () => {
    if (loading) {
      return "bg-gray-100 border-2 border-gray-300 text-gray-400 cursor-not-allowed shadow-sm";
    }

    if (disabled) {
      return "bg-gray-50 border-2 border-gray-200 text-gray-400 cursor-not-allowed opacity-60";
    }

    if (selected) {
      if (selected_color && selected_text_color) {
        return `${selected_color} ${selected_text_color} shadow-md border-2 border-transparent`;
      }
      // Auto-detect text color based on background - default to dark text for light gray backgrounds
      if (selected_color) {
        // If it contains "gray" and numbers like 100, 200, etc (light grays), use dark text
        const isLightGray = /gray-[1-4]\d{2}|from-gray-[1-4]\d{2}|to-gray-[1-4]\d{2}/.test(selected_color);
        const textColor = isLightGray || selected_color.includes('white') ? 'text-gray-900' : 'text-white';
        return `${selected_color} ${textColor} shadow-md border-2 border-transparent`;
      }
      return "bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-300 text-gray-900 shadow-md";
    }

    switch (variant) {
      case "primary":
        return "bg-white border-2 border-gray-200 text-gray-700 hover:border-gray-400 hover:shadow-md hover:bg-gray-50";
      case "secondary":
        return "bg-gray-50 border-2 border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-white hover:shadow-sm";
      case "ghost":
        return "bg-transparent border-2 border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-200";
      case "outline":
      default:
        return "bg-white border-2 border-gray-200 text-gray-700 hover:border-gray-400 hover:shadow-md hover:scale-[1.02]";
    }
  };

  return (
    <button
      type={type}
      key={key}
      className={`
        font-medium
        px-4 py-2.5
        transition-all duration-200 ease-in-out
        active:scale-95
        flex gap-2.5 items-center justify-center
        ${circle ? "rounded-full" : "rounded-lg"}
        ${getVariantClasses()}
        ${className}
      `}
      onClick={(e) => onClick(e, ...onClickParams)}
      disabled={disabled || loading}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {loading ? (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          {title && <span className={`${text_size} ${text_class_name}`}>Loading...</span>}
        </div>
      ) : (
        <>
          {Icon && (
            <Icon
              size={icon_size}
              className="flex-shrink-0"
              style={{ minWidth: `${icon_size}px`, width: `${icon_size}px` }}
            />
          )}
          {title && (
            <span
              title={title}
              className={`${text_size} font-medium whitespace-nowrap ${text_class_name}`}
            >
              {title}
            </span>
          )}
        </>
      )}
    </button>
  );
};

export default BEORRIButton;
