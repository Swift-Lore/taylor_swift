// adslot.jsx - Updated version
"use client";

import { useState, useEffect } from "react";
import AdComponent from "./ad_component";

export default function AdSlot({
  maxWidthClass = "max-w-4xl",
  className = "",
  adUnitPath = "/123456789/example_ad_unit", // Add your ad unit path
}) {
  const [filled, setFilled] = useState(false);
  const [adLoaded, setAdLoaded] = useState(false);

  // Force container dimensions
  const adContainerStyle = {
    width: '100%',
    minHeight: '90px', // or 250px for rectangle, 600px for tall skyscraper
    maxHeight: '600px',
    overflow: 'hidden',
  };

  return (
    <div className={`${maxWidthClass} mx-auto px-4 my-6`}>
      {/* Visible container with fixed dimensions */}
      <div
        className={`relative rounded-2xl border border-[#f8dada] 
          bg-gradient-to-b from-[#fff8f8] to-[#fdeeee] 
          shadow-sm px-4 py-3 flex items-center justify-center ${className}`}
        style={adContainerStyle}
      >
        {/* "Sponsored" label - always show */}
        <span className="absolute top-2 left-4 text-[10px] uppercase tracking-[0.12em] text-[#9ca3af]">
          Sponsored
        </span>

        {/* Ad container with min-height */}
        <div className="w-full" style={{ minHeight: '90px' }}>
          <AdComponent 
            onFilledChange={setFilled} 
            adUnitPath={adUnitPath}
          />
        </div>

        {/* Loading state */}
        {!filled && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80">
            <div className="text-sm text-gray-500">Loading ad...</div>
          </div>
        )}
      </div>
    </div>
  );
}