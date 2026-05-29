import React, { useEffect, useState } from "react";

import { ReactLenis } from "lenis/react";
import TierCard from "../ui/TierCard";
import Header from "./Header";
import ChatPanel from "./ChatPanel";

function TierContent() {
  const [listings, setListings] = useState([]);
  const [activeCardId, setActiveCardId] = useState(null);

  const TIER_LIST_ID = 1;

  useEffect(() => {
    fetch("http://localhost:5000/api/listings").then((res) => res.json()).then((data) => {
        if (Array.isArray(data)) {
          setListings(data);
          console.log(data)
        } else {
          console.error(data);
          setListings([]);
        }
      })
      .catch((err) => {
        console.error(err);
        setListings([]);
      });
  }, []);

  const handleToggleCard = (id) => {
    setActiveCardId(activeCardId === id ? null : id);
  };

  return (
    <div className="h-screen flex flex-col w-full ">
      <Header />

      <div className="flex flex-1 gap-2 overflow-hidden">
        <ReactLenis
          root={false}
          options={{
            duration: 0.75,

            easing: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),

            orientation: "vertical",
            smoothWheel: true,

            wheelMultiplier: 1.3,

            touchMultiplier: 1.8,

            infinite: false,
            syncTouch: true,
          }}
          className="flex-1 rounded-tl-4xl rounded-tr-4xl overflow-hidden"
        >
          <div className="grid grid-cols-1 gap-2 no-scrollbar overflow-y-auto w-full h-full content-start rounded-tl-[32px] rounded-tr-[32px] pr-1">
            {listings.map((elem) => (
              <TierCard
                key={elem.id}
                data={elem}
                isOpen={activeCardId === elem.id}
                onToggle={() => handleToggleCard(elem.id)}
              />
            ))}
          </div>
        </ReactLenis>

        <ChatPanel id={TIER_LIST_ID}/>
      </div>
    </div>
  );
}

export default TierContent;
