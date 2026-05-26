import React from "react";
import TextareaAutosize from "react-textarea-autosize";

function ChatPanel() {
  return (
    <div className="relative w-100 h-full  bg-[#3d3d3d] rounded-t-[32px] mr-2 overflow-hidden flex flex-col">
      <div className="shrink-0 w-full h-16 bg-[#3d3d3d] text-white text-xl flex px-6 items-center  shadow-xl z-10">
        AI CHAT
      </div>

    
      
      <div className="flex-1 overflow-y-auto p-4  flex flex-col no-scrollbar">
        <div className="space-y-4">
          <div className="p-4 w-full text-white bg-[#4d4c4c] rounded-4xl shadow-sm">
            kejzeoj
          </div>

          <div className="flex justify-end">
            <div className="p-4  bg-white rounded-4xl shadow-sm">
              zeorizeoirjoiezjrze
            </div>
          </div>
          <div className="p-4 w-full text-white bg-[#4d4c4c] rounded-4xl shadow-sm">
            kejzeoj
          </div>

          <div className="flex justify-end">
            <div className="p-4  bg-white rounded-4xl shadow-sm">
              zeorizeoirjoiezjrze
            </div>
          </div>
          <div className="p-4 w-full text-white bg-[#4d4c4c] rounded-4xl shadow-sm">
            kejzeoj
          </div>

          <div className="flex justify-end">
            <div className="p-4  bg-white rounded-4xl shadow-sm">
              zeorizeoirjoiezjrze
            </div>
          </div>
          <div className="p-4 w-full text-white bg-[#4d4c4c] rounded-4xl shadow-sm">
            kejzeoj
          </div>

          <div className="flex justify-end">
            <div className="p-4  bg-white rounded-4xl shadow-sm">
              zeorizeoirjoiezjrze
            </div>
          </div>
          <div className="p-4 w-full text-white bg-[#4d4c4c] rounded-4xl shadow-sm">
            kejzeoj
          </div>

          <div className="flex justify-end">
            <div className="p-4  bg-white rounded-4xl shadow-sm">
              zeorizeoirjoiezjrze
            </div>
          </div>
          <div className="p-4 w-full text-white bg-[#4d4c4c] rounded-4xl shadow-sm">
            kejzeoj
          </div>

          <div className="flex justify-end">
            <div className="p-4  bg-white rounded-4xl shadow-sm">
              zeorizeoirjoiezjrze
            </div>
          </div>
          <div className="p-4 w-full text-white bg-[#4d4c4c] rounded-4xl shadow-sm">
            kejzeoj
          </div>

          <div className="flex justify-end">
            <div className="p-4  bg-white rounded-4xl shadow-sm">
              zeorizeoirjoiezjrze
            </div>
          </div>
          
          
          
         
         

          
        

         
         
         


        </div>
      </div>

      <div className="relative bottom-0 flex  gap-2 left-0   rounded-tl-2xl rounded-tr-2xl w-full p-4 bg-gradient-to-t  to-transparent">
        <div className="flex items-end gap-4 w-full border border-black/5 bg-white p-2  rounded-2xl">
          <TextareaAutosize
            maxRows={10}
            className="flex-1 bg-transparent border-none outline-none flex mb-[2px] resize-none p-1 text-sm text-gray-700"
            placeholder="Make Tier List..."
          />
        </div>

<div className="flex flex-col justify-end full "> <button className="border border-white/10 text-white px-4 py-3 rounded-xl transition-colors font-medium">
            Send
          </button></div>
        
      </div>
    </div>
  );
}

export default ChatPanel;
