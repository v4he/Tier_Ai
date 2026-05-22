import React from "react";

import TierCard from "../ui/TierCard";
import Header from "./Header";
import ChatPanel from "./ChatPanel";
import { useEffect } from "react";
import { useState } from "react";

function TierContent() {
  return (
    <div className="h-screen flex flex-col w-full ">
      <Header />

      <div className="flex flex-1 gap-2 overflow-hidden  ">


        <div className="flex-1  bg-amber-50 p-6 rounded-tl-[40px] rounded-tr-[32px]">
          <div className="grid grid-cols-1 gap-6 overflow-y-auto  w-full h-full  content-start rounded-tl-[32px] rounded-tr-[32px]">
            <TierCard />
            <TierCard />
            <TierCard />
            <TierCard />
            <TierCard />
            <TierCard />
            <TierCard />
          </div>
        </div>


<ChatPanel />
      </div>
    </div>
  );
}

export default TierContent;
