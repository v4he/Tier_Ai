import React, { useEffect } from "react";
import { useRef } from "react";
import { useState } from "react";
import TextareaAutosize from "react-textarea-autosize";

function ChatPanel({ id, geminiResults, setGeminiResults, setListings }) {
  const [value, setValue] = useState("");
  const [geminiReponse, setGeminiReponse] = useState();
  const [chatData, setChatData] = useState([]);
  const [mode, setMode] = useState("tier");
  const [isLoading, setIsLoading] = useState(false); // Индикатор загрузки

  console.log(id);

  const handleMessage = async () => {
    const valueCopy = value;
    setValue("");

    if (valueCopy.trim() !== "") {
      const userMsg = {
        id: Date.now(),
        role: "user",
        content: valueCopy,
        created_at: new Date().toISOString(),
      };

      setChatData((prev) => [...prev, userMsg]);
    }

    // Включаем лоадер перед отправкой
    setIsLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/compareData", {
        headers: { "Content-Type": "application/json" },
        method: "POST",
        body: JSON.stringify({ userMessage: valueCopy, tierListId: id }),
      });
      
      const data = await res.json();

      const geminiMsg = {
        id: Date.now(),
        role: "assistant",
        content: data.gemini.chat_reply,
        created_at: new Date().toISOString(),
      };
      
      console.log(data.gemini);
      setGeminiReponse(geminiMsg);
      setChatData((prev) => [...prev, geminiMsg]);

      if (data.gemini.mode === "tier") {
        console.log(data.gemini.mode);
        if (data.gemini.results.length !== 0) {
          setGeminiResults(data.gemini.results);

          setListings((prevListings) =>
            prevListings.map((item) => {
              const updatedInfo = data.gemini.results.find((res) => res.id === item.id);
              if (updatedInfo) {
                return {
                  ...item,
                  ai_verdict: updatedInfo.ai_verdict,
                  pros: updatedInfo.pros,
                  cons: updatedInfo.cons,
                  grade: updatedInfo.grade,
                };
              }
              return item;
            })
          );
        }
      }
    } catch (error) {
      console.log("Ошибка запроса:", error);
    } finally {
      // Выключаем лоадер в любом случае
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleMessage();
    }
  };

  useEffect(() => {
    fetch(`http://localhost:5000/api/chatMessages/${id}`)
      .then((res) => res.json())
      .then((data) => setChatData(data))
      .catch((error) => console.log(error));
  }, []);

  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chatData, isLoading]); // Скроллим также при появлении точек

  return (
    <div className="relative w-92 h-full bg-[#3d3d3d] rounded-t-[32px] mr-2 overflow-hidden flex flex-col">
      <div className="shrink-0 w-full h-16 bg-[#3d3d3d] text-white text-xl flex px-6 items-center justify-between shadow-xl z-10">
        <span>AI CHAT</span>

        <div className="flex bg-[#2d2d2d] p-1 rounded-xl text-xs font-medium">
          <button
            onClick={() => setMode("tier")}
            className={`px-3 py-1.5 rounded-lg transition-all duration-200 ${
              mode === "tier"
                ? "bg-[#ba6f6f] text-white shadow"
                : "text-gray-400 hover:text-white cursor-pointer"
            }`}
          >
            Tier List
          </button>
          <button
            onClick={() => setMode("chat")}
            className={`px-3 py-1.5 rounded-lg transition-all duration-200 ${
              mode === "chat"
                ? "bg-[#ffffff] text-black shadow"
                : "text-gray-400 hover:text-white cursor-pointer"
            }`}
          >
            Chat
          </button>
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto p-4 flex flex-col no-scrollbar transition-all duration-300"
        ref={chatContainerRef}
      >
        <div className="flex flex-col space-y-4">
          {chatData &&
            chatData.map((elem, index) => {
              if (elem.role === "assistant") {
                return (
                  <div key={index} className="flex justify-start">
                    <div className=" p-3 text-white bg-[#4d4c4c] rounded-2xl shadow-sm">
                      {elem.content}
                    </div>
                  </div>
                );
              } else if (elem.role === "user") {
                return (
                  <div key={index} className="flex justify-end">
                    <div
                      className="max-w-[70%] p-3 bg-white rounded-2xl shadow-sm"
                      style={{ width: "fit-content" }}
                    >
                      {elem.content}
                    </div>
                  </div>
                );
              }
              return null;
            })}

          {/* Индикатор того, что Gemini думает */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="p-4 bg-[#4d4c4c] rounded-2xl shadow-sm flex items-center space-x-1.5">
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"></div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="relative bottom-0 flex gap-2 left-0 w-full p-4 bg-gradient-to-t to-transparent">
        <div className="flex items-end gap-4 w-full border border-black/5 bg-white p-2 rounded-2xl">
          <TextareaAutosize
            maxRows={10}
            disabled={isLoading}
            className="flex-1 bg-transparent border-none outline-none resize-none p-1 text-sm text-gray-700 disabled:opacity-50"
            placeholder={
              mode === "tier" ? "Make Tier List..." : "Type a message to AI..."
            }
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>

        <div className="flex flex-col justify-end">
          <button
            onClick={handleMessage}
            disabled={isLoading}
            className={`border border-white/10 text-white px-4 py-3 rounded-xl font-medium transition-all ${
              isLoading ? "opacity-50 cursor-not-allowed bg-transparent" : "hover:bg-white/5"
            }`}
          >
            {isLoading ? "..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatPanel;