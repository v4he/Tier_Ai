import React from "react";

function SidebarItem({ icon, label, isCollapsed, onClick }) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={label}
      onClick={onClick}
      className={`flex items-center w-full p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-all duration-200 cursor-pointer overflow-hidden ${
        isCollapsed ? "justify-center px-2 gap-0" : "justify-start px-3 gap-3"
      }`}
      title={isCollapsed ? label : undefined}
    >
      <div className="flex items-center justify-center flex-shrink-0 w-6 h-6 transition-colors">
        {icon}
      </div>
      {!isCollapsed && (
        <span className="text-sm font-medium whitespace-nowrap opacity-100">
          {label}
        </span>
      )}
    </div>
  );
}

export default SidebarItem;