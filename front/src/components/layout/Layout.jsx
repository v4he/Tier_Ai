import React, { useState } from "react";
import { Outlet } from "react-router";
import Sidebar from "../layout/Sidebar";
import MobileSidebar from "../layout/MobileSidebar";

function Layout() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="flex bg-[#212121] w-full h-screen overflow-hidden relative">
      <Sidebar />
      <MobileSidebar 
        isOpen={isMobileSidebarOpen} 
        onClose={() => setIsMobileSidebarOpen(false)} 
      />
      <main className="flex flex-1 h-full overflow-hidden">
        <Outlet context={{ setIsMobileSidebarOpen }} />
      </main>
    </div>
  );
}

export default Layout;