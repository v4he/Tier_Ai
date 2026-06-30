import React from "react";
import { Feather, LayoutDashboard, MessageSquare, BarChart3, Settings, FolderHeart, LogOut, X } from "lucide-react";
import SidebarItem from "../ui/SidebarItem";
import { useNavigate } from "react-router";

function MobileSidebar({ isOpen, onClose }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    console.log('[MobileSidebar] Logout started');
    
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    console.log('[MobileSidebar] localStorage cleared');
    
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      console.log('[MobileSidebar] Sending LOGOUT to extension');
      chrome.runtime.sendMessage({ type: 'LOGOUT' }, (response) => {
        if (response && response.success) {
          console.log('[MobileSidebar] Extension confirmed logout');
        } else {
          console.warn('[MobileSidebar] Extension did not respond');
        }
      });
    } else {
      console.warn('[MobileSidebar] chrome.runtime not available');
    }
    
    navigate('/login');
  };

  return (
    <>
      <div 
        onClick={onClose}
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 sm:hidden ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />
      
      <div className={`fixed top-0 left-0 bottom-0 w-[260px] bg-[#1e1e1e] z-50 p-4 flex flex-col justify-between select-none transform transition-transform duration-300 ease-in-out sm:hidden ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between py-4 px-2">
            <div className="flex gap-3 items-center">
              <Feather className="text-amber-50" size={28} />
              <span className="text-xl text-amber-50 font-bold">TierAI</span>
            </div>
            <button 
              onClick={onClose}
              className="text-white/60 hover:text-white p-1 rounded-lg hover:bg-white/5"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex flex-col gap-1.5" onClick={onClose}>
            <SidebarItem icon={<LayoutDashboard size={20} />} label="Dashboard" isCollapsed={false} />
            <SidebarItem icon={<MessageSquare size={20} />} label="AI Chat" isCollapsed={false} />
            <SidebarItem icon={<BarChart3 size={20} />} label="Analytics" isCollapsed={false} />
            <SidebarItem icon={<FolderHeart size={20} />} label="Saved Tiers" isCollapsed={false} />
            <SidebarItem icon={<Settings size={20} />} label="Settings" isCollapsed={false} />
          </div>
        </div>

        <div className="border-t border-white/10 pt-4">
          <SidebarItem 
            icon={<LogOut size={20} />} 
            label="Déconnexion" 
            isCollapsed={false}
            onClick={() => {
              handleLogout();
              onClose();
            }}
          />
        </div>
      </div>
    </>
  );
}

export default MobileSidebar;