import React from "react";

function SidebarItem({ icon, label, isCollapsed }) {
  return (
    <div
      className={`flex items-center w-full p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-all duration-200 cursor-pointer overflow-hidden
        sm:justify-center sm:px-0 sm:gap-0 px-2 gap-3`}
      title={isCollapsed ? label : undefined}
    >
      <div className="flex items-center justify-center flex-shrink-0 w-6 h-6 transition-colors">
        {icon}
      </div>

      <span
        className={`text-sm font-medium transition-all duration-200 whitespace-nowrap
        sm:opacity-0 sm:w-0 sm:pointer-events-none opacity-100`}
      >
        {label}
      </span>
    </div>
  );
}

export default SidebarItem;
