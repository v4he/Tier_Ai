import React from "react";
import { Feather, Brackets } from "lucide-react";
import SidebarItem from "../ui/SidebarItem";

function Sidebar() {
  return (
    <div className="flex flex-col w-[260px] h-screen px-4 "> 

      <div className="flex gap-3 px-2 py-9 items-center">
        <Feather className="text-amber-50" size={32} />
        <span className="text-2xl text-amber-50 font-bold">TierAI</span>
      </div>

      <div className="flex flex-col flex-1 justify-between pb-6">
        <div className="flex flex-col gap-2">
          <SidebarItem icon={<Brackets />} label="Dashboard" />
          <SidebarItem icon={<Brackets />} label="Dashboard" />
          <SidebarItem icon={<Brackets />} label="Dashboard" />
          <SidebarItem icon={<Brackets />} label="Dashboard" />
          <SidebarItem icon={<Brackets />} label="Dashboard" />
          </div>
      </div>
    </div>
  );
}

export default Sidebar;
