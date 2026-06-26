import React, { useState } from "react";
import { Feather, LayoutDashboard, MessageSquare, BarChart3, Settings, FolderHeart } from "lucide-react";
import SidebarItem from "../ui/SidebarItem";

function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem("sidebar-collapsed") === "true";
  });

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const nextState = !prev;
      localStorage.setItem("sidebar-collapsed", String(nextState));
      return nextState;
    });
  };

  return (
    <div className={`absolute z-20 bg-black sm:relative sm:bg-transparent flex flex-col h-screen px-3 transition-all duration-250 ease-in-out select-none w-[260px] sm:w-[80px] ${isCollapsed ? "left-[-260px]" : "left-[0px]"}`}>
      <div className={`flex gap-3 py-9 items-center overflow-hidden transition-all duration-250 sm:justify-center sm:px-0`}>
        <Feather className="text-amber-50 flex-shrink-0" size={32} />
        <span className={`text-2xl text-amber-50 font-bold transition-all duration-200 whitespace-nowrap sm:opacity-0 sm:w-0 sm:pointer-events-none`}>
          TierAI
        </span>
      </div>
      <div className="flex flex-col flex-1 justify-between pb-6">
        <div className="flex flex-col gap-1.5">
          <SidebarItem icon={<LayoutDashboard size={20} />} label="Dashboard" isCollapsed={isCollapsed} />
          <SidebarItem icon={<MessageSquare size={20} />} label="AI Chat" isCollapsed={isCollapsed} />
          <SidebarItem icon={<BarChart3 size={20} />} label="Analytics" isCollapsed={isCollapsed} />
          <SidebarItem icon={<FolderHeart size={20} />} label="Saved Tiers" isCollapsed={isCollapsed} />
          <SidebarItem icon={<Settings size={20} />} label="Settings" isCollapsed={isCollapsed} />
        </div>
      </div>
      <div
        onClick={toggleSidebar}
        className="absolute top-0 right-0 bottom-0 w-5 mr-[-10px] cursor-col-resize flex items-center justify-center group transition-colors"
        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <div className="hover:bg-gray-400/40 w-1"></div>
      </div>
    </div>
  );
}

export default Sidebar;