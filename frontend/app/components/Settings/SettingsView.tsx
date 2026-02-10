"use client";

import React, { useState } from "react";

import { RiAdminFill } from "react-icons/ri";
import { FaPaintBrush } from "react-icons/fa";
import { BiSolidCommentError } from "react-icons/bi";
import { IoLogOutSharp } from "react-icons/io5";
import { IoChatboxEllipsesSharp } from "react-icons/io5";

import BEORRIButton from "../Navigation/BEORRIButton";

import { Theme, Themes, Credentials } from "@/app/types";

import SettingsComponent from "./SettingsComponent";

import InfoComponent from "../Navigation/InfoComponent";
import SuggestionView from "./SuggestionView";
import InfoView from "./InfoView";

interface SettingsViewProps {
  selectedTheme: Theme;
  setSelectedTheme: React.Dispatch<React.SetStateAction<Theme>>;
  themes: Themes;
  setThemes: React.Dispatch<React.SetStateAction<Themes>>;
  credentials: Credentials;
  addStatusMessage: (
    message: string,
    type: "INFO" | "WARNING" | "SUCCESS" | "ERROR"
  ) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({
  selectedTheme,
  themes,
  setThemes,
  addStatusMessage,
  setSelectedTheme,
  credentials,
}) => {
  const [settingMode, setSettingMode] = useState<
    "INFO" | "ADMIN" | "THEME" | "SUGGESTIONS" | "CACHE"
  >("INFO");

  return (
    <div className="flex justify-center gap-3 h-[80vh] ">
      <div className={`w-1/3 flex`}>
        <div className="flex flex-col gap-2 w-full">
          <div className="bg-bg-alt-oxtari rounded-2xl flex gap-2 p-3 items-center justify-between h-min w-full shadow-lg border border-gray-200">
            <div className="flex gap-2 justify-start ">
              <InfoComponent
                tooltip_text="Customize Theme, reset collections, logout or report issues."
                display_text={"Settings"}
              />
            </div>
          </div>
          <div className="bg-bg-alt-oxtari gap-2 rounded-2xl flex flex-col p-3 w-full overflow-y-auto overflow-x-hidden shadow-lg border border-gray-200">
            <BEORRIButton
              title="Admin"
              onClick={() => setSettingMode("INFO")}
              selected={settingMode === "INFO"}
              selected_color="bg-gradient-to-r from-gray-100 to-gray-200"
              selected_text_color="text-gray-900"
              Icon={RiAdminFill}
              text_size="text-lg"
              icon_size={20}
            />
            {/* <BEORRIButton
              title="Customize Theme"
              onClick={() => setSettingMode("THEME")}
              selected={settingMode === "THEME"}
              selected_color="bg-gradient-to-r from-gray-100 to-gray-200"
              selected_text_color="text-gray-900"
              Icon={FaPaintBrush}
            /> */}
            <BEORRIButton
              title="Manage Suggestions"
              onClick={() => setSettingMode("SUGGESTIONS")}
              selected={settingMode === "SUGGESTIONS"}
              selected_color="bg-gradient-to-r from-gray-100 to-gray-200"
              selected_text_color="text-gray-900"
              Icon={IoChatboxEllipsesSharp}
              text_size="text-lg"
              icon_size={20}
            />
          </div>
          <div className="bg-bg-alt-oxtari gap-2 rounded-2xl flex flex-col p-6 w-full overflow-y-auto overflow-x-hidden shadow-lg border border-gray-200">
            <BEORRIButton
              title="Logout"
              onClick={() => window.location.reload()}
              Icon={IoLogOutSharp}
              text_size="text-lg"
              icon_size={20}
            />
            <BEORRIButton
              title="Report Issue"
              onClick={() =>
                window.open(
                  "https://github.com/weaviate/oxtari/issues/new/choose",
                  "_blank"
                )
              }
              Icon={BiSolidCommentError}
              text_size="text-lg"
              icon_size={20}
            />
          </div>
        </div>
      </div>

      <div className={`w-2/3 flex`}>
        <div className="flex flex-col gap-2 w-full">
          <div className="bg-bg-alt-oxtari gap-2 rounded-2xl flex flex-col p-6 h-full w-full overflow-y-auto overflow-x-hidden shadow-lg border border-gray-200">
            {settingMode === "THEME" && (
              <SettingsComponent
                themes={themes}
                credentials={credentials}
                setThemes={setThemes}
                setSelectedTheme={setSelectedTheme}
                selectedTheme={selectedTheme}
                addStatusMessage={addStatusMessage}
              />
            )}
            {settingMode === "INFO" && (
              <InfoView
                addStatusMessage={addStatusMessage}
                credentials={credentials}
              />
            )}
            {settingMode === "SUGGESTIONS" && (
              <SuggestionView
                credentials={credentials}
                addStatusMessage={addStatusMessage}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
