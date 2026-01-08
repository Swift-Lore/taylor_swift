"use client";

import { useEffect, useRef } from "react";

export default function AdSlot({
  maxWidthClass = "max-w-6xl",
  className = "",
  variant = "leaderboard", // "leaderboard" | "rectangle"
}) {
  const insRef = useRef(null);
  
  // ✅ UPDATED WITH YOUR REAL IDs
  const adConfig = {
    leaderboard: {
      slot: "6835416711", // ← Your Timeline ad ID
      width: 728,
      height: 90
    },
    rectangle: {
      slot: "8756354114", // ← Your Footer ad ID
      width: 300,
      height: 250
    }
  };

  const config = adConfig[variant] || adConfig.leaderboard;

  useEffect(() => {
    if (!import.meta.env.PROD) return;

    const ins = insRef.current;
    if (!ins) return;

    const alreadyDone = ins.getAttribute("data-adsbygoogle-status") === "done";
    if (alreadyDone) return;

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // ignore
    }
  }, []);

  // DEV placeholder
  if (!import.meta.env.PROD) {
    return (
      <div className={`${maxWidthClass} mx-auto px-4 ${className}`}>
        <div
          className="rounded-xl border border-[#e6d2e1] bg-white/70 shadow-sm flex items-center justify-center text-sm text-gray-500 mx-auto"
          style={{ 
            width: `${config.width}px`,
            height: `${config.height}px`,
            maxWidth: '100%'
          }}
        >
          [Ad: {variant} — {config.width}×{config.height}]
        </div>
      </div>
    );
  }

  return (
    <div className={`${maxWidthClass} mx-auto px-4 ${className}`}>
      <div
        className="relative rounded-xl border border-[#e6d2e1] bg-white/70 shadow-sm overflow-hidden mx-auto"
        style={{ 
          width: `${config.width}px`,
          height: `${config.height}px`,
          maxWidth: '100%'
        }}
      >

        <ins
          ref={insRef}
          className="adsbygoogle"
          style={{
            display: 'block',
            width: '100%',
            height: '100%'
          }}
          data-ad-client="ca-pub-4534610257929133"
          data-ad-slot={config.slot}
        />
      </div>
    </div>
  );
}