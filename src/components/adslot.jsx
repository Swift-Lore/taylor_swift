// adslot.jsx - COMPLETE UPDATED VERSION
"use client";

import { useState, useEffect, useRef } from "react";
import AdComponent from "./ad_component";

export default function AdSlot({
  maxWidthClass = "max-w-4xl",
  minHeight = 90,
  className = "",
}) {
  const [filled, setFilled] = useState(false);
  const [showAd, setShowAd] = useState(false);
  const containerRef = useRef(null);

  // Delay showing ad to ensure container is properly sized
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowAd(true);
    }, 100); // Small delay to ensure DOM is ready

    return () => clearTimeout(timer);
  }, []);

  // Handle ad fill state changes
  const handleFilledChange = (isFilled) => {
    setFilled(isFilled);
    
    // If ad fails to load after 5 seconds, hide the container
    if (!isFilled) {
      const timeout = setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.style.display = 'none';
        }
      }, 5000);
      
      return () => clearTimeout(timeout);
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`${maxWidthClass} mx-auto px-4 my-6 ad-slot-container`}
    >
      {/* Always visible container with proper dimensions */}
      <div
        className={`relative rounded-2xl border border-[#f8dada] 
          bg-gradient-to-b from-[#fff8f8] to-[#fdeeee] 
          shadow-sm flex items-center justify-center ${className}`}
        style={{ 
          minHeight: `${minHeight}px`,
          width: '100%',
          minWidth: '300px', // Prevent skinny loading
          maxWidth: '100%',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {/* "Sponsored" label - always show */}
        <span className="absolute top-2 left-4 text-[10px] uppercase tracking-[0.12em] text-[#9ca3af] z-10">
          Sponsored
        </span>

        {/* Ad Content */}
        <div className="w-full h-full flex items-center justify-center">
          {showAd && (
            <AdComponent 
              minHeight={minHeight} 
              onFilledChange={handleFilledChange} 
            />
          )}
        </div>

        {/* Loading placeholder - shows while ad loads */}
        {!filled && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/90 z-20">
            <div className="text-sm text-gray-400 animate-pulse">
              Loading advertisement...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}