import React, { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ReactLenis } from "lenis/react";
import TierCard from "../ui/TierCard";
import Header from "./Header";
import ChatPanel from "./ChatPanel";
import { useParams } from "react-router";
import { Folder } from "lucide-react";

function TierContent() {
  const tierOrder = { S: 1, A: 2, B: 3, C: 4 };
  const { id } = useParams();
  const [listings, setListings] = useState([]);
  const [activeCardId, setActiveCardId] = useState(null);
  const [geminiResults, setGeminiResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const tierListId = id;

  useEffect(() => {
    setIsLoading(true);
    fetch(`http://localhost:5000/api/listings/${id}`, {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then((res) => {
        if (!res.ok) {
          if (res.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
            return;
          }
          throw new Error('Network response was not ok');
        }
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setListings(data);
        } else {
          setListings([]);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setListings([]);
        setIsLoading(false);
      });
  }, [id]);

  const handleToggleCard = (id) => {
    setActiveCardId(activeCardId === id ? null : id);
  };

  const sortedListings = useMemo(() => {
    return [...listings].sort((a, b) => {
      const gradeA = (geminiResults.find((res) => res.id === a.id)?.grade || a.grade || "-").toUpperCase();
      const gradeB = (geminiResults.find((res) => res.id === b.id)?.grade || b.grade || "-").toUpperCase();
      const weightA = tierOrder[gradeA] || 99;
      const weightB = tierOrder[gradeB] || 99;
      return weightA - weightB;
    });
  }, [listings, geminiResults]);

  return (
    <div className="h-screen flex flex-col w-full">
      <Header />
      <div className="flex flex-1 gap-2 overflow-hidden">
        <ReactLenis
          root={false}
          options={{
            duration: 0.6,
            easing: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
            orientation: "vertical",
            smoothWheel: true,
            wheelMultiplier: 1.1,
            touchMultiplier: 1.5,
            infinite: false,
            syncTouch: true,
          }}
          className="flex-1 rounded-tl-4xl rounded-tr-4xl overflow-hidden"
        >
          <div className="grid grid-cols-1 gap-3 w-full h-full content-start rounded-tl-[32px] rounded-tr-[32px] pr-2 pb-10 pl-1">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="rounded-[30px] bg-white/5 h-32 w-full" />
                </div>
              ))
            ) : sortedListings.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 col-span-1">
                <Folder className="w-20 h-20 mb-4 opacity-20" />
                <p className="text-lg font-medium text-white/60">Aucun produit dans cette tier list</p>
                <p className="text-sm text-white/40">Utilisez l'extension pour scanner des produits</p>
              </div>
            ) : (
              sortedListings.map((elem) => (
                <motion.div
                  key={elem.id}
                  layout="position"
                  transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 30
                  }}
                  className="w-full"
                >
                  <TierCard
                    data={elem}
                    tierListId={tierListId}
                    listings={listings}
                    setListings={setListings}
                    tierCardId={elem.id}
                    isOpen={activeCardId === elem.id}
                    geminiResults={geminiResults}
                    onToggle={() => handleToggleCard(elem.id)}
                  />
                </motion.div>
              ))
            )}
          </div>
        </ReactLenis>
        <ChatPanel
          id={tierListId}
          geminiResults={geminiResults}
          setGeminiResults={setGeminiResults}
          setListings={setListings}
        />
      </div>
    </div>
  );
}

export default TierContent;