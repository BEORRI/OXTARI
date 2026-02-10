"use client";

import React, { useState, useEffect, useRef } from "react";
import { FaTrash } from "react-icons/fa";
import { GoTriangleDown } from "react-icons/go";
import { IoAddCircleSharp } from "react-icons/io5";
import { RAGConfig, RAGComponentConfig } from "@/app/types";

import { closeOnClick } from "@/app/util";

import BEORRIButton from "../Navigation/BEORRIButton";

export const MultiInput: React.FC<{
  component_name: string;
  values: string[];
  blocked: boolean | undefined;
  config_title: string;
  updateConfig: (
    component_n: string,
    configTitle: string,
    value: string | boolean | string[]
  ) => void;
}> = ({ values, config_title, updateConfig, component_name, blocked }) => {
  const [currentInput, setCurrentInput] = useState("");
  const [currentValues, setCurrentValues] = useState(values);

  useEffect(() => {
    updateConfig(component_name, config_title, currentValues);
  }, [currentValues]);

  const addValue = (v: string) => {
    if (!currentValues.includes(v)) {
      setCurrentValues((prev) => [...prev, v]);
      setCurrentInput("");
    }
  };

  const removeValue = (v: string) => {
    if (currentValues.includes(v)) {
      setCurrentValues((prev) => prev.filter((label) => label !== v));
    }
  };

  return (
    <div className="flex flex-col w-full gap-2">
      <div className="flex gap-2 justify-between">
        <label className="input flex items-center gap-2 w-full bg-bg-oxtari">
          <input
            type="text"
            className="grow w-full"
            disabled={blocked}
            value={currentInput}
            onChange={(e) => {
              setCurrentInput(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addValue(currentInput);
              }
            }}
          />
        </label>
        <button
          onClick={() => {
            addValue(currentInput);
          }}
          disabled={blocked}
          className="btn flex gap-2 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-900 border-2 border-gray-300 shadow-sm transition-all duration-200"
        >
          <IoAddCircleSharp size={15} />
          <p>Add</p>
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {values.map((value, index) => (
          <div
            key={value + index}
            className="flex bg-gradient-to-r from-gray-50 to-gray-100 w-full p-2 text-center text-sm text-gray-900 justify-between items-center rounded-xl border-2 border-gray-200 shadow-sm"
          >
            <div className="flex w-full justify-center items-center overflow-hidden">
              <p className="truncate" title={value}>
                {value}
              </p>
            </div>
            <button
              disabled={blocked}
              onClick={() => {
                removeValue(value);
              }}
              className="btn btn-sm btn-square bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border-2 border-red-400 text-white ml-2 shadow-sm transition-all duration-200"
            >
              <FaTrash size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

interface ComponentViewProps {
  RAGConfig: RAGConfig;
  blocked: boolean | undefined;
  component_name: "Chunker" | "Embedder" | "Reader" | "Generator" | "Retriever";
  selectComponent: (component_n: string, selected_component: string) => void;
  skip_component?: boolean;
  updateConfig: (
    component_n: string,
    configTitle: string,
    value: string | boolean | string[]
  ) => void;
  saveComponentConfig: (
    component_n: string,
    selected_component: string,
    config: RAGComponentConfig
  ) => void;
}

const ComponentView: React.FC<ComponentViewProps> = ({
  RAGConfig,
  component_name,
  selectComponent,
  updateConfig,
  saveComponentConfig,
  blocked,
  skip_component,
}) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isComponentDropdownOpen, setIsComponentDropdownOpen] = useState(false);
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const dropdownMenuRefs = useRef<{ [key: string]: HTMLUListElement | null }>({});
  const componentDropdownRef = useRef<HTMLDivElement>(null);
  const componentDropdownMenuRef = useRef<HTMLUListElement>(null);

  // Handle click outside to close config dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdown && dropdownRefs.current[openDropdown]) {
        if (!dropdownRefs.current[openDropdown]?.contains(event.target as Node)) {
          setOpenDropdown(null);
        }
      }
    };

    if (openDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [openDropdown]);

  // Handle click outside to close component dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        componentDropdownRef.current &&
        !componentDropdownRef.current.contains(event.target as Node)
      ) {
        setIsComponentDropdownOpen(false);
      }
    };

    if (isComponentDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isComponentDropdownOpen]);

  // Scroll config dropdown menu into view when opened
  useEffect(() => {
    if (openDropdown && dropdownMenuRefs.current[openDropdown]) {
      setTimeout(() => {
        dropdownMenuRefs.current[openDropdown]?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "nearest",
        });
      }, 50); // Small delay to ensure dropdown is rendered
    }
  }, [openDropdown]);

  // Scroll component dropdown menu into view when opened
  useEffect(() => {
    if (isComponentDropdownOpen && componentDropdownMenuRef.current) {
      setTimeout(() => {
        componentDropdownMenuRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "nearest",
        });
      }, 50);
    }
  }, [isComponentDropdownOpen]);

  function renderComponents(rag_config: RAGConfig) {
    return Object.entries(rag_config[component_name].components)
      .filter(([key, component]) => component.available)
      .map(([key, component]) => (
        <li
          key={"ComponentDropdown_" + component.name}
          onClick={() => {
            if (!blocked) {
              selectComponent(component_name, component.name);
              setIsComponentDropdownOpen(false);
              closeOnClick();
            }
          }}
        >
          <a>{component.name}</a>
        </li>
      ));
  }
  function renderConfigOptions(rag_config: RAGConfig, configKey: string) {
    return rag_config[component_name].components[
      rag_config[component_name].selected
    ].config[configKey].values.map((configValue) => (
      <li
        key={"ConfigValue" + configValue}
        className="text-sm"
        onClick={() => {
          if (!blocked) {
            updateConfig(component_name, configKey, configValue);
            setOpenDropdown(null);
            closeOnClick();
          }
        }}
      >
        <a>{configValue}</a>
      </li>
    ));
  }

  if (
    Object.entries(
      RAGConfig[component_name].components[RAGConfig[component_name].selected]
        .config
    ).length == 0 &&
    skip_component
  ) {
    return <></>;
  }

  return (
    <div className="flex flex-col justify-start gap-3 rounded-2xl p-1 w-full ">
      <div className="flex items-center justify-between">
        <div className="divider text-gray-600 flex-grow text-xs lg:text-sm">
          <p>{RAGConfig[component_name].selected} Settings</p>
          <BEORRIButton
            title="Save"
            onClick={() => {
              saveComponentConfig(
                component_name,
                RAGConfig[component_name].selected,
                RAGConfig[component_name].components[
                  RAGConfig[component_name].selected
                ]
              );
            }}
          />
        </div>
      </div>
      {/* Component */}
      {!skip_component && (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2 justify-between items-center text-gray-900">
            <p className="flex min-w-[8vw] lg:text-base text-sm font-medium">
              {component_name}
            </p>
            <div className="dropdown dropdown-bottom flex justify-start items-center w-full" ref={componentDropdownRef}>
              <button
                tabIndex={0}
                role="button"
                disabled={blocked}
                onClick={() => setIsComponentDropdownOpen(!isComponentDropdownOpen)}
                className="btn bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-400 text-gray-700 w-full flex justify-start rounded-lg shadow-sm hover:shadow-md transition-all duration-200 font-medium"
              >
                <GoTriangleDown size={15} />
                <p>{RAGConfig[component_name].selected}</p>
              </button>
              {isComponentDropdownOpen && (
                <ul
                  ref={componentDropdownMenuRef}
                  tabIndex={0}
                  className="dropdown-content menu bg-white border-2 border-gray-200 rounded-lg z-[1] w-full p-2 shadow-lg"
                >
                  {renderComponents(RAGConfig)}
                </ul>
              )}
            </div>
          </div>

          <div className="flex gap-2 items-center text-gray-900">
            <p className="flex min-w-[8vw]"></p>
            <p className="lg:text-sm text-xs text-gray-600 text-start">
              {
                RAGConfig[component_name].components[
                  RAGConfig[component_name].selected
                ].description
              }
            </p>
          </div>
        </div>
      )}

      {Object.entries(
        RAGConfig[component_name].components[RAGConfig[component_name].selected]
          .config
      ).map(([configTitle, config]) => (
        <div key={"Configuration" + configTitle + component_name}>
          <div className="flex gap-3 justify-between items-center text-gray-900 lg:text-base text-sm">
            <p className="flex min-w-[8vw] font-medium">{configTitle}</p>

            {/* Dropdown */}
            {config.type === "dropdown" && (
              <div
                ref={(el) => (dropdownRefs.current[configTitle] = el)}
                className="dropdown dropdown-bottom flex justify-start items-center w-full"
              >
                <button
                  tabIndex={0}
                  role="button"
                  disabled={blocked}
                  onClick={() =>
                    setOpenDropdown(
                      openDropdown === configTitle ? null : configTitle
                    )
                  }
                  className="btn bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-400 text-gray-700 w-full flex justify-start rounded-lg shadow-sm hover:shadow-md transition-all duration-200 font-medium"
                >
                  <GoTriangleDown size={15} />
                  <p>{config.value}</p>
                </button>
                {openDropdown === configTitle && (
                  <ul
                    ref={(el) => (dropdownMenuRefs.current[configTitle] = el)}
                    tabIndex={0}
                    className="dropdown-content menu bg-white border-2 border-gray-200 max-h-[20vh] overflow-auto rounded-lg z-[1] w-full p-2 shadow-lg"
                  >
                    {renderConfigOptions(RAGConfig, configTitle)}
                  </ul>
                )}
              </div>
            )}

            {/* Text Input */}
            {typeof config.value != "boolean" &&
              ["text", "number", "password"].includes(config.type) && (
                <label className="input flex text-sm items-center gap-2 w-full bg-transparent border border-gray-300">
                  <input
                    type={config.type}
                    className="grow w-full bg-transparent"
                    value={config.value}
                    onChange={(e) => {
                      if (!blocked) {
                        updateConfig(
                          component_name,
                          configTitle,
                          e.target.value
                        );
                      }
                    }}
                  />
                </label>
              )}

            {/* Text Area */}
            {typeof config.value != "boolean" &&
              ["textarea"].includes(config.type) && (
                <textarea
                  className="grow w-full text-sm min-h-[152px] bg-transparent border border-gray-300 rounded-lg p-2"
                  value={config.value}
                  onChange={(e) => {
                    if (!blocked) {
                      updateConfig(component_name, configTitle, e.target.value);
                    }
                  }}
                />
              )}

            {/* Multi Input */}
            {typeof config.value != "boolean" && config.type == "multi" && (
              <MultiInput
                component_name={component_name}
                values={config.values}
                config_title={configTitle}
                updateConfig={updateConfig}
                blocked={blocked}
              />
            )}

            {/* Checkbox Input */}
            {config.type == "bool" && (
              <div className="flex gap-5 justify-start items-center w-full my-4">
                <p className="lg:text-sm text-xs text-gray-600 text-start w-[250px]">
                  {config.description}
                </p>
                <input
                  type="checkbox"
                  className="checkbox checkbox-md"
                  onChange={(e) => {
                    if (!blocked) {
                      updateConfig(
                        component_name,
                        configTitle,
                        (e.target as HTMLInputElement).checked
                      );
                    }
                  }}
                  checked={
                    typeof config.value === "boolean" ? config.value : false
                  }
                />
              </div>
            )}
          </div>
          {/* Description */}
          {config.type != "bool" && (
            <div className="flex gap-2 items-center text-gray-900 mt-3">
              <p className="flex min-w-[8vw]"></p>
              <p className="text-xs text-gray-600 text-start">
                {config.description}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ComponentView;
