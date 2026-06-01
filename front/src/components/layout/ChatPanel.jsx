import React, { useEffect } from "react";
import { useRef } from "react";
import { useState } from "react";
import TextareaAutosize from "react-textarea-autosize";

function ChatPanel({ id }) {
  const [value, setValue] = useState("");
  const [geminiReponse, setGeminiReponse] = useState();
  const [chatData, setChatData] = useState([]);
  const [mode, setMode] = useState("tier");

  const handleMessage = async () => {
    const valueCopy = value;
    setValue("");

    const userMsg = {
      id: Date.now(),
      role: "user",
      content: value,
      created_at: new Date().toISOString(),
    };
    
    setChatData(prev => [...prev, userMsg]);

    await fetch("http://localhost:5000/api/compareData", {
      headers: { "Content-Type": "application/json" },
      method: "POST",
      body: JSON.stringify({ userMessage: valueCopy, tierListId: id, mode: mode }),
    })
      .then((res) => res.json())
      .then((data) => {
        const geminiMsg = {
          id: Date.now(),
          role: "assistant",
          content: data.gemini,
          created_at: new Date().toISOString(),
        };
        setGeminiReponse(geminiMsg);
        console.log(data.gemini)
        setChatData(prev => [...prev, geminiMsg]);
      });
  };

  useEffect(() => {
    fetch("http://localhost:5000/api/chatMessages")
      .then((res) => res.json())
      .then((data) => setChatData(data))
      .catch((error) => console.log(error));
  }, []);

  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatData]);

  return (
    <div className="relative w-100 h-full bg-[#3d3d3d] rounded-t-[32px] mr-2 overflow-hidden flex flex-col">
     
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

      <div className="flex-1 overflow-y-auto p-4 flex flex-col no-scrollbar transition-all duration-300" ref={chatContainerRef}>
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
        </div>
      </div>

      <div className="relative bottom-0 flex gap-2 left-0 w-full p-4 bg-gradient-to-t to-transparent">
        <div className="flex items-end gap-4 w-full border border-black/5 bg-white p-2 rounded-2xl">
          <TextareaAutosize
            maxRows={10}
            className="flex-1 bg-transparent border-none outline-none resize-none p-1 text-sm text-gray-700"
    
            placeholder={mode === "tier" ? "Make Tier List..." : "Type a message to AI..."}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </div>

        <div className="flex flex-col justify-end">
          <button
            onClick={handleMessage}
            className="border border-white/10 text-white px-4 py-3 rounded-xl transition-colors font-medium"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatPanel;