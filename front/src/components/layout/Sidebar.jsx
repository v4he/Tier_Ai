import React from "react";
import { Feather, LayoutDashboard, MessageSquare, BarChart3, Settings, FolderHeart, LogOut } from "lucide-react";
import SidebarItem from "../ui/SidebarItem";
import { useNavigate } from "react-router";

function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    console.log('🟢 [Sidebar] Logout started');
    
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    console.log('🟢 [Sidebar] localStorage очищен');
    
    window.postMessage({ type: 'LOGOUT_FROM_PAGE' }, '*');
    console.log('🟢 [Sidebar] Сообщение LOGOUT_FROM_PAGE отправлено');
    
    navigate('/login');
  };

  return (
    <div className="hidden sm:flex flex-col h-screen px-3 select-none w-[80px] bg-transparent shrink-0">
      <div className="flex gap-3 py-9 items-center overflow-hidden justify-center">
        <Feather className="text-amber-50 flex-shrink-0" size={32} />
      </div>
      <div className="flex flex-col flex-1 justify-between pb-6">
        <div className="flex flex-col gap-1.5">
          <SidebarItem icon={<LayoutDashboard size={20} />} label="Dashboard" isCollapsed={true} />
          <SidebarItem icon={<MessageSquare size={20} />} label="AI Chat" isCollapsed={true} />
          <SidebarItem icon={<BarChart3 size={20} />} label="Analytics" isCollapsed={true} />
          <SidebarItem icon={<FolderHeart size={20} />} label="Saved Tiers" isCollapsed={true} />
          <SidebarItem icon={<Settings size={20} />} label="Settings" isCollapsed={true} />
        </div>
        
        <div className="border-t border-white/10 pt-4">
          <SidebarItem 
            icon={<LogOut size={20} />} 
            label="Déconnexion" 
            isCollapsed={true}
            onClick={handleLogout}
          />
        </div>
      </div>
    </div>
  );
}

export default Sidebar;