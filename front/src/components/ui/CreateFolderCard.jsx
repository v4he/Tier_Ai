import React, { useEffect, useRef } from "react";
import { Folder, ArrowUpRight } from "lucide-react";
import defaultNotebook from "../../assets/image/aaaa.png";

function CreateFolderCard({
  tierFolderData,
  cardName,
  setCardName,
  setAddFolder,
  addfolder,
  setTierFolder,
}) {
  if (!tierFolderData) return null;

  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current.focus();
  }, []);

  const userId = 1

  const { title, cover_image, created_at } = tierFolderData;

  const formattedDate = created_at
    ? new Date(created_at).toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "";


    const tierFolderFetch = async () => {
      await fetch('http://localhost:5000/api/tierFolderInsert',{
        headers: { "Content-Type": "application/json" },
        method: "POST",
        body: JSON.stringify({title: cardName, userId: userId})
      })
      .then(res => res.json())
      .then(data => console.log(data))
    }

  return (
    <div
      className="
        group relative aspect-square w-full bg-white 
        rounded-[30px] shadow-[0_8px_30px_rgba(0,0,0,0.03)] 
        hover:shadow-[0_15px_40px_rgba(0,0,0,0.08)]
        hover:-translate-y-1
        transition-all duration-300 ease-out
        cursor-pointer flex flex-col overflow-hidden 
        border border-black/[0.02]
      "
    >
      <div className="relative flex-1 w-full bg-[#f9f9fa] overflow-hidden">
        <img
          src={cover_image || defaultNotebook}
          alt={title}
          className="
            w-full h-full object-cover
            group-hover:scale-105 transition-transform duration-500 ease-out
          "
        />

        <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-transparent opacity-70" />

        <div className="absolute top-4 left-4 p-2 rounded-xl bg-white/90 backdrop-blur-md text-gray-700 shadow-sm">
          <Folder className="w-4 h-4" />
        </div>

        <div
          className="
            absolute top-4 right-4 p-2 rounded-xl bg-white text-black shadow-md
            opacity-0 translate-x-2 -translate-y-1
            group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0
            hover:bg-black hover:text-white
            transition-all duration-300 ease-out
          "
        >
          <ArrowUpRight className="w-4 h-4" />
        </div>
      </div>

      <div className="p-5 bg-white border-t border-black/[0.02]">
        <input
        className="outline-none w-full "
          type="text"
          ref={inputRef}
          name=""
          value={cardName}
          onBlur={() => {
            if (cardName === "") {
              setAddFolder(false);
              console.log(cardName)
            } else if(cardName !== "") {
              const cardMsg = {
                cover_generated: false,
                cover_image: null,
                cover_image_ai: null,
                cover_prompt: null,
                created_at: new Date().toISOString(),
                id: Date.now(),
                title: cardName,
                user_id: 1,
              };

              console.log(cardMsg)
              setTierFolder(prev => [...prev, cardMsg])
              tierFolderFetch()


              setCardName("")
              setAddFolder(false);


             
              
            }
          }}
          onChange={(e) => {
            setCardName(e.target.value);
          }}

          id=""
        />

        <div className="flex items-center gap-1.5 mt-1 text-[11px] font-medium uppercase tracking-wider text-gray-400">
          <span className="text-purple-600/80 font-bold">Tier List</span>
          {formattedDate && (
            <>
              <span>•</span>
              <span>{formattedDate}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default CreateFolderCard;
