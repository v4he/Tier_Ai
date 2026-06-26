import React, { useState, useEffect } from "react";
import { useLocation } from "react-router";
import {
  Feather,
  LayoutDashboard,
  MessageSquare,
  BarChart3,
  Settings,
  FolderHeart,
  Menu,
  X,
  Search,
} from "lucide-react";
import SidebarItem from "../ui/SidebarItem";

function MobileSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const location = useLocation();

  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const toggleMenu = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <>
      {/* Мобильный хедер с логотипом, поиском и бургером */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-[#2b2b2b]/95 backdrop-blur-sm px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-3 mb-2">
          <Feather className="text-amber-50 flex-shrink-0" size={28} />
          <span className="text-xl text-amber-50 font-bold flex-1">TierAI</span>
          <button
            onClick={toggleMenu}
            aria-label={isOpen ? "Close menu" : "Open menu"}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors text-white"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        
        {/* Поисковая строка */}
        <div className="flex items-center rounded-full bg-white/10 px-4 py-2 gap-3 border border-white/5 focus-within:border-white/20 transition-all">
          <Search size={18} className="text-white/40 flex-shrink-0" />
          <input
            className="w-full outline-none bg-transparent text-white/90 text-sm placeholder-white/40"
            type="text"
            placeholder="Search..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            aria-label="Rechercher"
          />
        </div>
      </div>

      {/* Оверлей */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 mobile-overlay"
          onClick={toggleMenu}
        />
      )}

      {/* Мобильное меню */}
      <div
        className={`
          md:hidden fixed top-0 left-0 bottom-0 z-50
          w-[280px] bg-[#2b2b2b] shadow-2xl
          transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          flex flex-col
        `}
      >
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/5">
          <Feather className="text-amber-50" size={32} />
          <span className="text-2xl text-amber-50 font-bold">TierAI</span>
        </div>

        <div className="flex-1 px-3 py-6 overflow-y-auto">
          <div className="flex flex-col gap-1.5">
            <SidebarItem
              icon={<LayoutDashboard size={20} />}
              label="Dashboard"
              isCollapsed={false}
            />
            <SidebarItem
              icon={<MessageSquare size={20} />}
              label="AI Chat"
              isCollapsed={false}
            />
            <SidebarItem
              icon={<BarChart3 size={20} />}
              label="Analytics"
              isCollapsed={false}
            />
            <SidebarItem
              icon={<FolderHeart size={20} />}
              label="Saved Tiers"
              isCollapsed={false}
            />
            <SidebarItem
              icon={<Settings size={20} />}
              label="Settings"
              isCollapsed={false}
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-white/5">
          <p className="text-xs text-white/40">TierAI v1.0</p>
        </div>
      </div>

      {/* Отступ для контента на мобильных */}
      <div className="md:hidden h-[100px]" />
    </>
  );
}

export default MobileSidebar;