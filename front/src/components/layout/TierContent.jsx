import React, { useEffect, useState } from "react";

import { ReactLenis } from "lenis/react";
import TierCard from "../ui/TierCard";
import Header from "./Header";
import ChatPanel from "./ChatPanel";
import { useParams } from "react-router";

function TierContent() {

  const {id} = useParams()
  

  const [listings, setListings] = useState([]);
  const [activeCardId, setActiveCardId] = useState(null);
  const [geminiResults, setGeminiResults] = useState([])

  const tierListId = id;
  console.log(id)

  useEffect(() => {
    fetch(`http://localhost:5000/api/listings/${id}`).then((res) => res.json()).then((data) => {
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
                tierListId={tierListId}
                listings={listings}
                setListings={setListings}
                tierCardId={elem.id}
                isOpen={activeCardId === elem.id}
                
                onToggle={() => handleToggleCard(elem.id)}
              />
            ))}
          </div>
        </ReactLenis>

        <ChatPanel id={tierListId} geminiResults={geminiResults} setGeminiResults={setGeminiResults}/>
      </div>
    </div>
  );
}

export default TierContent;
