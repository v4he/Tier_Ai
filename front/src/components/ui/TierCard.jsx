import React from "react";
import { Star, ArrowUpRight, X } from "lucide-react";

function TierCard({
  data,
  isOpen,
  onToggle,
  tierListId,
  tierCardId,
  setListings,
}) {
  if (!data) return null;

  const formattedPrice = Number(data.price).toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
  });

  const tierStyles = {
    S: "bg-[#ff7f7f] text-[#733838] text-[28px] pt-[6px] font-bold",
    A: "bg-[#ffbf7f] text-[#733838] text-[28px] pt-[6px] font-bold",
    B: "bg-[#ffff7f] text-[#733838] text-[28px] pt-[6px] font-bold",
    C: "bg-[#7fff7f] text-[#733838] text-[28px] pt-[6px] font-bold",
    default: "bg-gray-100 text-gray-600",
  };

  const currentTier = (data.grade || "-").toUpperCase();
  const currentTierStyle = tierStyles[currentTier] || tierStyles.default;

  const pros = Array.isArray(data.pros) ? data.pros : ["Great value for money", "Premium build quality"];
  const cons = Array.isArray(data.cons) ? data.cons : ["Limited color options"];

  const handleDeleteCard = async (e) => {
    e.stopPropagation();
    try {
      const reponse = await fetch(`http://localhost:5000/api/deleteListing`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('token')}`
        },
        method: "POST",
        body: JSON.stringify({
          tierCardId: tierCardId,
          tierListId: tierListId,
        }),
      });

      if (!reponse.ok) {
        if (reponse.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
          return;
        }
        throw new Error('Network response was not ok');
      }
      const result = await reponse.json();
      setListings(prev => prev.filter(elem => elem.id !== result));
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="w-full">
      <div className="rounded-[30px] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.05)] overflow-hidden">
        <div onClick={onToggle} className="group relative flex flex-col cursor-pointer p-5">
          <div className="flex items-center gap-6 pr-24 pl-1">
            <div className="flex-shrink-0">
              <div className="rounded-2xl overflow-hidden bg-[#f5f5f5] w-24 h-24 filter shadow-sm">
                <img
                  src={data.image_url || data.image}
                  alt={data.title || "Image du produit"}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-gray-400">
                <span>{data.condition_category || "New"}</span>
                <span>•</span>
                <span>{data.source_site}</span>
              </div>
              <h3 className="text-gray-800 font-medium leading-snug line-clamp-2 mt-1 text-lg">
                {data.title}
              </h3>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-lg font-bold tracking-tight text-gray-900">
                  {formattedPrice}
                </span>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400" aria-hidden="true" />
                  <span>{data.seller_rating || "0.0"}</span>
                  <span>({data.seller_reviews_count})</span>
                </div>
              </div>
            </div>
          </div>

          <div className={`absolute right-0 top-0 bottom-0 w-12 flex items-center justify-center text-4xl pb-2.5 border-l border-black/[0.04] ${currentTierStyle}`}>
            {currentTier}
          </div>

          <div className="absolute top-3 right-14 flex items-center gap-1.5 opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
            <button
              onClick={handleDeleteCard}
              aria-label="Supprimer ce produit"
              className="cursor-pointer p-1.5 rounded-lg bg-black/[0.04] hover:bg-red-500 hover:text-white text-gray-500 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <a
              href={data.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Voir l'annonce originale"
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 rounded-lg bg-black/[0.04] hover:bg-black hover:text-white text-gray-500 transition-colors"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className={`grid overflow-hidden transition-all duration-300 ${isOpen ? "grid-rows-[1fr] opacity-100 mt-5 pt-5 border-t border-black/[0.05]" : "grid-rows-[0fr] opacity-0"}`}>
            <div className="overflow-hidden pr-14 pl-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <span className="text-[11px] uppercase font-bold tracking-wider text-green-600">Pros</span>
                  <ul className="mt-2 space-y-1.5">
                    {pros.map((pro, index) => (
                      <li key={index} className="text-[13px] leading-relaxed text-gray-600">• {pro}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="text-[11px] uppercase font-bold tracking-wider text-rose-500">Cons</span>
                  <ul className="mt-2 space-y-1.5">
                    {cons.map((con, index) => (
                      <li key={index} className="text-[13px] leading-relaxed text-gray-600">• {con}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="mt-5 p-4 rounded-2xl bg-[#f6f6f7]">
                <span className="text-[11px] uppercase font-bold tracking-wider text-purple-600">Verdict AI</span>
                <p className="mt-1.5 text-[13px] font-normal italic text-gray-600 leading-relaxed">{data.ai_verdict}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TierCard;