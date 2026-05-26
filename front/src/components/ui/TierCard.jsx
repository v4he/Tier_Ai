import React from "react";
import { Star, ArrowUpRight, X } from "lucide-react";

function TierCard({ data, isOpen, onToggle, onDelete }) {
  if (!data) return null;

  const formattedPrice = Number(data.price).toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
  });

  const tierStyles = {
    s: "bg-[#ff7f7f] text-white",
    a: "bg-[#ffbf7f] text-white",
    b: "bg-[#ffff7f] text-gray-800",
    c: "bg-[#7fff7f] text-gray-800",
    default: "bg-gray-100 text-gray-600",
  };

  const currentTier = (data.tier || "S").toLowerCase();
  const currentTierStyle = tierStyles[currentTier] || tierStyles.default;

  const pros = Array.isArray(data.pros)
    ? data.pros
    : ["Great value for money", "Premium build quality"];

  const cons = Array.isArray(data.cons) ? data.cons : ["Limited color options"];

  return (
    <div className="w-full">
      <div className="rounded-[30px] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.05)] overflow-hidden">
        <div
          onClick={onToggle}
          className={`
            group relative flex flex-col cursor-pointer
            transition-[padding]
            duration-250 ease-out
            ${isOpen ? "p-6" : "p-4 min-h-[120px] justify-center"}
          `}
        >
          <div className="flex items-center gap-6 pr-24 pl-1">
            <div className="flex-shrink-0">
              <div
                className={`
                  rounded-2xl  overflow-hidden bg-[#f5f5f5]
                  transition-all duration-250
                  ${isOpen ? "w-32 h-32 filter shadow-lg" : "w-20 h-20 "}
                `}
              >
                <img
                  src={data.image_url || data.image}
                  alt={data.title}
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

              <h3
                className={`
                  text-gray-800 font-medium leading-snug line-clamp-2
                  transition-all duration-200
                  ${isOpen ? "text-xl mt-1" : "text-base mt-0.5"}
                `}
              >
                {data.title}
              </h3>

              <div className="flex items-center gap-4 mt-2">
                <span className="text-lg font-bold tracking-tight text-gray-900">
                  {formattedPrice}
                </span>

                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400" />
                  <span>{data.seller_rating || "0.0"}</span>
                  <span>({data.seller_reviews_count})</span>
                </div>
              </div>
            </div>
          </div>

          <div
            className={`
              absolute right-0 top-0 bottom-0 w-12
              flex items-center justify-center
              text-4xl  pb-2.5
              border-l border-black/[0.04]
              ${currentTierStyle}
            `}
          >
            {currentTier}
          </div>

          <div
            className="
              absolute top-3 right-14
              flex items-center gap-1.5
              opacity-0 translate-x-2
              group-hover:opacity-100
              group-hover:translate-x-0
              transition-all duration-300
            "
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.();
              }}
              className="
                p-1.5 rounded-lg
                bg-black/[0.04]
                hover:bg-black/[0.08]
                text-gray-500
                transition-colors
              "
            >
              <X className="w-3.5 h-3.5" />
            </button>

            <a
              href={data.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="
                p-1.5 rounded-lg
                bg-black/[0.04]
                hover:bg-black
                hover:text-white
                text-gray-500
                transition-colors
              "
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>

          <div
            className={`
              grid overflow-hidden
              transition-all duration-300
              ${
                isOpen
                  ? "grid-rows-[1fr] opacity-100 mt-5 pt-5 border-t border-black/[0.05]"
                  : "grid-rows-[0fr] opacity-0"
              }
            `}
          >
            <div className="overflow-hidden pr-14 pl-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-green-600">
                    Pros
                  </span>

                  <ul className="mt-2 space-y-1">
                    {pros.map((pro, index) => (
                      <li key={index} className="text-[11px] text-gray-600">
                        • {pro}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-rose-500">
                    Cons
                  </span>

                  <ul className="mt-2 space-y-1">
                    {cons.map((con, index) => (
                      <li key={index} className="text-[11px] text-gray-600">
                        • {con}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-4 p-3 rounded-2xl bg-[#f6f6f7]">
                <span className="text-[10px] uppercase font-bold tracking-wider text-purple-600">
                  Verdict AI
                </span>

                <p className="mt-1 text-[11px] italic text-gray-500 leading-relaxed">
                  {data.ai_verdict}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TierCard;
