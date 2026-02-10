"use client";

import React, { useState, useEffect } from "react";
import { StatusMessage } from "@/app/types";
import { motion, AnimatePresence } from "framer-motion";

import { FaWandMagicSparkles } from "react-icons/fa6";
import { IoWarning } from "react-icons/io5";
import { BiSolidMessageAltDetail } from "react-icons/bi";
import { BiSolidErrorCircle } from "react-icons/bi";

interface StatusMessengerProps {
  status_messages: StatusMessage[];
  set_status_messages: (messages: StatusMessage[]) => void;
}

const StatusMessengerComponent: React.FC<StatusMessengerProps> = ({
  status_messages,
  set_status_messages,
}) => {
  const [messages, setMessages] = useState<StatusMessage[]>([]);

  useEffect(() => {
    if (status_messages.length > 0) {
      // Add new messages to the state
      setMessages((prevMessages) => [...prevMessages, ...status_messages]);

      // Clear the status_messages
      set_status_messages([]);
    }

    // Clear messages older than 5 seconds
    const interval = setInterval(() => {
      const currentTime = new Date().getTime();
      setMessages((prevMessages) =>
        prevMessages.filter((message) => {
          const messageTime = new Date(message.timestamp).getTime();
          return currentTime - messageTime < 5000;
        })
      );
    }, 1000); // Check every second

    return () => clearInterval(interval);
  }, [status_messages, set_status_messages]);

  const getMessageStyle = (type: string) => {
    switch (type) {
      case "INFO":
        return {
          bg: "bg-gradient-to-r from-blue-500 to-blue-600",
          border: "border-blue-400",
          text: "text-white",
          icon: "text-white",
        };
      case "WARNING":
        return {
          bg: "bg-gradient-to-r from-amber-500 to-orange-500",
          border: "border-amber-400",
          text: "text-white",
          icon: "text-white",
        };
      case "SUCCESS":
        return {
          bg: "bg-gradient-to-r from-green-500 to-green-600",
          border: "border-green-400",
          text: "text-white",
          icon: "text-white",
        };
      case "ERROR":
        return {
          bg: "bg-gradient-to-r from-red-500 to-red-600",
          border: "border-red-400",
          text: "text-white",
          icon: "text-white",
        };
      default:
        return {
          bg: "bg-gradient-to-r from-gray-100 to-gray-200",
          border: "border-gray-300",
          text: "text-gray-900",
          icon: "text-gray-700",
        };
    }
  };

  const getMessageIcon = (type: string) => {
    const icon_size = 20;

    switch (type) {
      case "INFO":
        return <BiSolidMessageAltDetail size={icon_size} />;
      case "WARNING":
        return <IoWarning size={icon_size} />;
      case "SUCCESS":
        return <FaWandMagicSparkles size={icon_size} />;
      case "ERROR":
        return <BiSolidErrorCircle size={icon_size} />;
      default:
        return <BiSolidMessageAltDetail size={icon_size} />;
    }
  };

  return (
    <div className="fixed bottom-6 right-6 space-y-3 z-[9999] pointer-events-none">
      <AnimatePresence>
        {messages
          .filter((message) => {
            const messageTime = new Date(message.timestamp).getTime();
            const currentTime = new Date().getTime();
            return currentTime - messageTime < 5000;
          })
          .map((message, index) => {
            const style = getMessageStyle(message.type);
            return (
              <motion.div
                key={`${message.timestamp}-${index}`}
                initial={{ opacity: 0, x: 100, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 100, scale: 0.95 }}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
                className={`
                  ${style.bg} ${style.border} ${style.text}
                  border-2 rounded-2xl shadow-xl
                  min-w-[300px] max-w-[400px]
                  pointer-events-auto
                  overflow-hidden
                `}
              >
                <div className="px-4 py-3.5 flex items-center gap-3">
                  <div className={`${style.icon} flex-shrink-0`}>
                    {getMessageIcon(message.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold leading-snug break-words">
                      {message.message}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
      </AnimatePresence>
    </div>
  );
};

export default StatusMessengerComponent;
