import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";

import { FaDatabase } from "react-icons/fa";
import { FaDocker } from "react-icons/fa";
import { FaKey } from "react-icons/fa";
import { FaLaptopCode } from "react-icons/fa";
import { GrConnect } from "react-icons/gr";
import { CgWebsite } from "react-icons/cg";
import { FaBackspace } from "react-icons/fa";
import { HiMiniSparkles } from "react-icons/hi2";
import { TbDatabaseEdit } from "react-icons/tb";

import { connectToBEORRI } from "@/app/api";

import BEORRIButton from "../Navigation/BEORRIButton";

import { Credentials, RAGConfig, Theme, Themes } from "@/app/types";

let prefix = "";
if (process.env.NODE_ENV === "production") {
  prefix = "/static";
} else {
  prefix = "";
}

interface LoginViewProps {
  credentials: Credentials;
  setCredentials: (c: Credentials) => void;
  setIsLoggedIn: (isLoggedIn: boolean) => void;
  setRAGConfig: (RAGConfig: RAGConfig | null) => void;
  setSelectedTheme: (theme: Theme) => void;
  setThemes: (themes: Themes) => void;
  production: "Local" | "Demo" | "Production";
}

const LoginView: React.FC<LoginViewProps> = ({
  credentials,
  setCredentials,
  setSelectedTheme,
  setThemes,
  setIsLoggedIn,
  production,
  setRAGConfig,
}) => {
  const [isLoading, setIsLoading] = useState(true);

  const [isConnecting, setIsConnecting] = useState(false);

  const [selectStage, setSelectStage] = useState(true);

  const [errorText, setErrorText] = useState("");

  const [selectedDeployment, setSelectedDeployment] = useState<
    "Weaviate" | "Docker" | "Local" | "Custom"
  >("Local");

  const [weaviateURL, setWeaviateURL] = useState(credentials.url);
  const [weaviateAPIKey, setWeaviateAPIKey] = useState(credentials.key);
  const [port, setPort] = useState("8080");

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300); // Adjust this delay as needed

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (credentials.default_deployment) {
      setSelectedDeployment(credentials.default_deployment);
      connect(credentials.default_deployment);
    }
  }, [credentials]);

  const connect = async (
    deployment: "Local" | "Weaviate" | "Docker" | "Custom"
  ) => {
    setErrorText("");
    setIsConnecting(true);
    
    try {
      const response = await connectToBEORRI(
        deployment,
        weaviateURL,
        weaviateAPIKey,
        port
      );
      
      if (response) {
        // Check if connection was successful
        if (response.connected === true && response.rag_config) {
          setIsLoggedIn(true);
          setCredentials({
            deployment: deployment,
            key: weaviateAPIKey,
            url: weaviateURL,
            default_deployment: credentials.default_deployment,
          });
          setRAGConfig(response.rag_config);
          if (response.themes) {
            setThemes(response.themes);
          }
          if (response.theme) {
            setSelectedTheme(response.theme);
          }
        } else {
          // Connection failed
          setIsLoggedIn(false);
          setErrorText(
            response.error && response.error !== "" 
              ? response.error 
              : "Couldn't connect to Weaviate"
          );
        }
      } else {
        // No response received
        setIsLoggedIn(false);
        setErrorText("No response received from server");
      }
    } catch (error) {
      // Handle any network or parsing errors
      setIsLoggedIn(false);
      setErrorText(
        error instanceof Error 
          ? `Connection error: ${error.message}` 
          : "An unexpected error occurred"
      );
    }
    
    setIsConnecting(false);
  };

  return (
    <div className="w-screen h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div
        className={`flex flex-col md:flex-row w-full h-full transition-opacity duration-1000 ${
          isLoading ? "opacity-0" : "opacity-100"
        }`}
      >
        {/* Mobile Logo - visible on top for mobile */}
        <div className="flex md:hidden w-full py-8 px-5 items-center justify-center bg-white/80 backdrop-blur-sm border-b border-gray-200">
          <Image 
            src="/Oxtari.png" 
            alt="Logo" 
            width={200}
            height={200}
            className="object-contain drop-shadow-lg"
          />
        </div>
        {/* Desktop Logo - visible on left side for desktop */}
        <div className="hidden md:flex md:w-1/2 lg:w-3/5 h-full items-center justify-center  bg-white/80 relative overflow-hidden">
          <div className="relative z-10 flex flex-col items-center gap-6">
            <Image 
              src="/Oxtari.png" 
              alt="Logo" 
              width={350}
              height={350}
              className="max-w-md max-h-md object-contain drop-shadow-2xl"
            />
          </div>
        </div>
        <div className="w-full md:flex md:w-1/2 lg:w-2/5 h-full flex justify-center items-center p-6 md:p-10">
          <div className="flex flex-col gap-8 items-center md:items-start justify-center w-full max-w-md">
            <div className="flex flex-col items-center md:items-start gap-3 w-full">
              <div className="flex flex-col gap-2">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
                  Welcome
                </h1>
                <div className="h-1 w-20 bg-gradient-to-r from-[#023eba] to-[#0152d9] rounded-full"></div>
              </div>
              {production == "Local" && (
                <p className="text-gray-600 text-lg font-medium">
                  Choose your deployment method
                </p>
              )}
            </div>
            {selectStage ? (
              <div className="flex flex-col justify-start gap-3 w-full">
                {production == "Local" && (
                  <div className="flex flex-col justify-start gap-3 w-full">
                    <BEORRIButton
                      Icon={FaDatabase}
                      title="Weaviate"
                      disabled={isConnecting}
                      onClick={() => {
                        setSelectStage(false);
                        setSelectedDeployment("Weaviate");
                      }}
                      icon_size={22}
                      text_size="text-base font-medium"
                      className="py-4"
                    />
                    <BEORRIButton
                      title="Docker"
                      Icon={FaDocker}
                      disabled={isConnecting}
                      onClick={() => {
                        setSelectedDeployment("Docker");
                        connect("Docker");
                      }}
                      loading={isConnecting && selectedDeployment == "Docker"}
                      icon_size={22}
                      text_size="text-base font-medium"
                      className="py-4"
                    />
                    <BEORRIButton
                      title="Custom"
                      Icon={TbDatabaseEdit}
                      disabled={isConnecting}
                      onClick={() => {
                        setSelectedDeployment("Custom");
                        setSelectStage(false);
                      }}
                      loading={isConnecting && selectedDeployment == "Custom"}
                      icon_size={22}
                      text_size="text-base font-medium"
                      className="py-4"
                    />
                    <BEORRIButton
                      title="Local"
                      Icon={FaLaptopCode}
                      disabled={isConnecting}
                      onClick={() => {
                        setSelectedDeployment("Local");
                        connect("Local");
                      }}
                      loading={isConnecting && selectedDeployment == "Local"}
                      icon_size={22}
                      text_size="text-base font-medium"
                      className="py-4"
                    />
                  </div>
                )}
                {production == "Demo" && (
                  <div className="flex flex-col justify-start gap-3 w-full">
                    <BEORRIButton
                      Icon={HiMiniSparkles}
                      title="Start Demo"
                      disabled={isConnecting}
                      onClick={() => {
                        setSelectedDeployment("Weaviate");
                        connect("Weaviate");
                      }}
                      loading={isConnecting && selectedDeployment == "Weaviate"}
                      icon_size={22}
                      text_size="text-base font-medium"
                      className="py-4"
                    />
                  </div>
                )}
                {production == "Production" && (
                  <div className="flex flex-col justify-start gap-3 w-full">
                    <BEORRIButton
                      Icon={HiMiniSparkles}
                      title="Start Application" 
                      onClick={() => {
                        setSelectStage(false);
                        setSelectedDeployment("Weaviate");
                      }}
                      icon_size={22}
                      text_size="text-base font-medium"
                      className="py-4"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col justify-start gap-5 w-full">
                {production != "Demo" && (
                  <div className="flex flex-col justify-start gap-5 w-full">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        connect(selectedDeployment);
                      }}
                      className="w-full"
                    >
                      <div className="flex flex-col gap-4 w-full">
                        <div className="flex gap-3 items-stretch w-full">
                          <div className="flex-1">
                            <label className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border-2 border-gray-200 focus-within:border-[#023eba] transition-all duration-200 shadow-sm hover:shadow-md w-full">
                              <FaDatabase className="text-[#023eba] text-lg flex-shrink-0" />
                              <input
                                type="text"
                                name="username"
                                value={weaviateURL}
                                onChange={(e) => setWeaviateURL(e.target.value)}
                                placeholder="http://weaviate:8080"
                                className="grow bg-transparent text-gray-700 placeholder:text-gray-400 outline-none text-sm font-medium"
                                autoComplete="username"
                              />
                            </label>
                          </div>
                          {selectedDeployment == "Custom" && (
                            <div className="w-28">
                              <label className="flex items-center gap-2 px-3 py-3 bg-white rounded-xl border-2 border-gray-200 focus-within:border-[#023eba] transition-all duration-200 shadow-sm hover:shadow-md h-full">
                                <p className="text-gray-500 text-xs font-medium whitespace-nowrap">Port</p>
                                <input
                                  type="text"
                                  name="Port"
                                  value={port}
                                  onChange={(e) => setPort(e.target.value)}
                                  placeholder="8080"
                                  className="grow bg-transparent text-gray-700 placeholder:text-gray-400 outline-none text-sm font-medium w-full"
                                  autoComplete="port"
                                />
                              </label>
                            </div>
                          )}
                        </div>

                        <label className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border-2 border-gray-200 focus-within:border-[#023eba] transition-all duration-200 shadow-sm hover:shadow-md">
                          <FaKey className="text-[#023eba] text-lg flex-shrink-0" />
                          <input
                            type="password"
                            name="current-password"
                            value={weaviateAPIKey}
                            onChange={(e) => setWeaviateAPIKey(e.target.value)}
                            placeholder="API Key"
                            className="grow bg-transparent text-gray-700 placeholder:text-gray-400 outline-none text-sm font-medium"
                            autoComplete="current-password"
                          />
                        </label>
                      </div>
                      
                      <div className="flex flex-col gap-3 mt-6 w-full">
                        <BEORRIButton
                          Icon={GrConnect}
                          title="Connect to Weaviate"
                          type="submit"
                          selected={true}
                          selected_color="bg-[#023eba]"
                          selected_text_color="text-white"
                          loading={isConnecting}
                          icon_size={18}
                          text_size="text-base font-semibold"
                          className="py-4 shadow-lg hover:shadow-xl"
                        />
                        {selectedDeployment == "Weaviate" && (
                          <BEORRIButton
                            Icon={CgWebsite}
                            title="Register"
                            type="button"
                            disabled={isConnecting}
                            onClick={() =>
                              window.open(
                                "https://console.weaviate.cloud",
                                "_blank"
                              )
                            }
                            icon_size={18}
                            text_size="text-sm font-medium"
                            className="py-3"
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => setSelectStage(true)}
                          disabled={isConnecting}
                          className="flex items-center justify-center gap-2 text-gray-600 hover:text-[#023eba] transition-colors duration-200 py-2 text-sm font-medium"
                        >
                          <FaBackspace size={14} />
                          <span>Back to deployment options</span>
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}
            {errorText && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg w-full">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <p className="text-sm text-red-800 font-medium whitespace-pre-wrap">
                    {errorText}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
