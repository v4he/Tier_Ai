import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ReactLenis } from "lenis/react";
import TierCard from "../ui/TierCard";
import Header from "./Header";
import ChatPanel from "./ChatPanel";
import { useParams } from "react-router";
import { Folder, MessageSquare } from "lucide-react";

function TierContent() {
  const tierOrder = { S: 1, A: 2, B: 3, C: 4 };
  const { id } = useParams();
  const [listings, setListings] = useState([]);
  const [activeCardId, setActiveCardId] = useState(null);
  const [geminiResults, setGeminiResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isChatOpenMobile, setIsChatOpenMobile] = useState(false);
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
    <div className="h-screen flex flex-col w-full overflow-hidden relative">
      <Header />
      <div className="flex flex-1 gap-2 overflow-hidden pr-2 pl-3 sm:pl-0 lg:pr-2 relative rounded-t-[30px]">
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
          className="flex-1 h-full overflow-hidden rounded-t-[30px]"
        >
          <div className="grid grid-cols-1 gap-3 w-full h-full content-start pr-0 md:pr-0 pb-24 pl-0">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="rounded-[30px] bg-white/5 h-[136px] w-full" />
                </div>
              ))
            ) : sortedListings.length === 0 ? (
              <div className="flex flex-col  items-center justify-center h-full text-gray-400 col-span-1 py-20">
                <Folder className="w-20 h-20 mb-4 opacity-20" />
                <p className="text-lg font-medium text-white/60">Aucun produit dans cette tier list</p>
                <p className="text-sm text-white/40">Utilisez l'extension pour scanez</p>
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

        <div className="hidden lg:block h-full w-92 shrink-0">
          <ChatPanel
            id={tierListId}
            geminiResults={geminiResults}
            setGeminiResults={setGeminiResults}
            setListings={setListings}
          />
        </div>

        <AnimatePresence>
          {isChatOpenMobile && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsChatOpenMobile(false)}
                className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              />
              <motion.div 
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed top-0 right-0 bottom-0 w-[340px] max-w-[calc(100vw-40px)] z-50 lg:hidden bg-[#3d3d3d] shadow-2xl pt-4"
              >
                <ChatPanel
                  id={tierListId}
                  geminiResults={geminiResults}
                  setGeminiResults={setGeminiResults}
                  setListings={setListings}
                  onCloseMobile={() => setIsChatOpenMobile(false)}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <button
          onClick={() => setIsChatOpenMobile(true)}
          className="lg:hidden fixed bottom-6 right-6 z-30 p-4 bg-[#ba6f6f] text-white rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
          aria-label="Open AI Chat"
        >
          <MessageSquare size={24} />
        </button>
      </div>
    </div>
  );
}

export default TierContent;