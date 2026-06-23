import React from "react";
import { Folder, Trash } from "lucide-react";
import defaultNotebook from "../../assets/image/bbbb.png";
import { Link } from 'react-router';

function DashboardCard({ tierFolderData, tierFolder, setTierFolder }) {
  if (!tierFolderData) return null;

  const { id, title, cover_image, created_at } = tierFolderData;

  const formattedDate = created_at
    ? new Date(created_at).toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "";

  const deleteFolder = (e) => {
    e.preventDefault();
    e.stopPropagation();

    fetch('http://localhost:5000/api/tierFolderDelete', {
      headers: { "Content-Type": "application/json" },
      method: 'POST',
      body: JSON.stringify({ cardId: id })
    })
    .then(res => res.json())
    .then(data => setTierFolder(prev => prev.filter(elem => elem.id !== data.result)));
  };

  return (
    <div className="group relative w-full aspect-square">
      <Link to={`tier-list/${id}`} className="block w-full h-full">
        <div
          className="
            w-full h-full bg-white 
            rounded-[30px] shadow-[0_8px_30px_rgba(0,0,0,0.03)] 
            hover:shadow-[0_15px_40px_rgba(0,0,0,0.08)]
            hover:-translate-y-1
            transition-all duration-300 ease-out
            cursor-pointer flex flex-col overflow-hidden 
            
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
          </div>

          <div className="p-5 bg-white border-t border-black/[0.02]">
            <h3 className="text-gray-800 font-semibold text-base line-clamp-1 tracking-tight group-hover:text-black transition-colors">
              {title || ""}
            </h3>

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
      </Link>

      <div
        onClick={deleteFolder}
        className="
          absolute top-4 right-4 p-2 rounded-xl bg-white text-black shadow-md
          opacity-0 translate-x-2 -translate-y-1
          group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0
          hover:bg-black hover:text-white
          transition-all duration-300 ease-out
          z-10 cursor-pointer
        "
      >
        <Trash className="w-4 h-4" />
      </div>
    </div>
  );
}

export default DashboardCard;