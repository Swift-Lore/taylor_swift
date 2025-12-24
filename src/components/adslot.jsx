"use client";

import { useState } from "react";
import AdComponent from "./ad_component";

export default function AdSlot({
  maxWidthClass = "max-w-4xl",
  minHeight = 90,
  className = "",
}) {
  const [filled, setFilled] = useState(false);

  return (
    <div className={`${maxWidthClass} mx-auto px-4 my-6`}>
      {/* Visible container — only shows AFTER ad fills */}
      {filled && (
        <div
          className={`relative rounded-2xl border border-[#f8dada] 
            bg-gradient-to-b from-[#fff8f8] to-[#fdeeee] 
            shadow-sm px-4 py-3 flex items-center justify-center ${className}`}
        >
          <span className="absolute top-2 left-4 text-[10px] uppercase tracking-[0.12em] text-[#9ca3af]">
            Sponsored
          </span>

          <AdComponent minHeight={minHeight} onFilledChange={setFilled} />
        </div>
      )}

      {/* Hidden loader — lets Google inject the ad without layout impact */}
      {!filled && (
        <div className="h-0 overflow-hidden">
          <AdComponent minHeight={minHeight} onFilledChange={setFilled} />
        </div>
      )}
    </div>
  );
}
