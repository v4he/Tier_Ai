import React, { useEffect, useRef, useState } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { X } from "lucide-react";

function ChatPanel({ id, geminiResults, setGeminiResults, setListings, onCloseMobile }) {
  const [value, setValue] = useState("");
  const [chatData, setChatData] = useState([]);
  const [mode, setMode] = useState("tier");
  const [isLoading, setIsLoading] = useState(false);

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

    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch("http://localhost:5000/api/compareData", {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        method: "POST",
        body: JSON.stringify({ userMessage: valueCopy, tierListId: id }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
          return;
        }
        throw new Error('Network response was not ok');
      }

      const data = await res.json();

      const geminiMsg = {
        id: Date.now(),
        role: "assistant",
        content: data.gemini.chat_reply,
        created_at: new Date().toISOString(),
      };

      setChatData((prev) => [...prev, geminiMsg]);

      if (data.gemini.mode === "tier") {
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
      console.log("Erreur de requête:", error);
    } finally {
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
    fetch(`http://localhost:5000/api/chatMessages/${id}`, {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then((res) => {
        if (!res.ok) {
          if (res.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
            return;
          }
          throw new Error('Network response was not ok');
        }
        return res.json();
      })
      .then((data) => setChatData(data))
      .catch((error) => console.log(error));
  }, [id]);

  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatData, isLoading]);

  return (
    <div className="relative w-full lg:w-92 h-full bg-[#2c2c2c] lg:rounded-t-[32px] overflow-hidden flex flex-col">
      <div className="shrink-0 w-full h-16 bg-[#2d2d2d] text-white text-[16px] flex px-6 items-center justify-between shadow-xl z-10">
        <span>AI CHAT</span>
        <div className="flex items-center gap-2">
          <div className="flex bg-[#2d2d2d] p-1 rounded-xl text-xs font-medium">
            <button
              onClick={() => setMode("tier")}
              aria-label="Mode Tier List"
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
              aria-label="Mode Chat"
              className={`px-3 py-1.5 rounded-lg transition-all duration-200 ${
                mode === "chat"
                  ? "bg-[#ffffff] text-black shadow"
                  : "text-gray-400 hover:text-white cursor-pointer"
              }`}
            >
              Chat
            </button>
          </div>
          {onCloseMobile && (
            <button 
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 ml-1"
            >
              <X size={20} />
            </button>
          )}
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
                    <div className="p-3 text-white bg-[#4d4c4c] rounded-2xl shadow-sm text-sm">
                      {elem.content}
                    </div>
                  </div>
                );
              } else if (elem.role === "user") {
                return (
                  <div key={index} className="flex justify-end">
                    <div
                      className="max-w-[85%] p-3 bg-white rounded-2xl shadow-sm text-sm"
                      style={{ width: "fit-content" }}
                    >
                      {elem.content}
                    </div>
                  </div>
                );
              }
              return null;
            })}
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

      <div className="relative bottom-0 flex gap-2 left-0 w-full p-4 bg-gradient-to-t to-transparent pb-8 lg:pb-4">
        <div className="flex items-end gap-4 w-full border border-black/5 bg-white p-2 rounded-2xl">
          <TextareaAutosize
            maxRows={6}
            disabled={isLoading}
            aria-label="Saisir votre message"
            className="flex-1 bg-transparent border-none outline-none resize-none p-1 text-sm text-gray-700 disabled:opacity-50"
            placeholder={mode === "tier" ? "Make Tier List..." : "Type a message to AI..."}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <div className="flex flex-col justify-end">
          <button
            onClick={handleMessage}
            disabled={isLoading}
            aria-label="Envoyer le message"
            aria-disabled={isLoading}
            className={`border border-white/10 text-white px-4 py-3 rounded-xl font-medium transition-all text-sm h-[42px] flex items-center ${
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