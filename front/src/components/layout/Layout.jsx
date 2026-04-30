import React from "react";
import { Outlet } from "react-router";
import Sidebar from "../layout/Sidebar";

function Layout() {
  return (
    <div className="flex bg-[#505050] w-full h-screen ">
      <Sidebar />
      <main className="flex flex-1 h-full">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
