"use client";

import { useEffect, useRef } from "react";

export default function AdSlot({
  maxWidthClass = "max-w-6xl",
  className = "",
  variant = "leaderboard", // "leaderboard" | "rectangle"
}) {
  const insRef = useRef(null);
  
  // Your actual slot IDs from AdSense (REPLACE THESE)
  const adConfig = {
    leaderboard: {
      slot: "REPLACE_WITH_728x90_SLOT_ID",
      width: 728,
      height: 90
    },
    rectangle: {
      slot: "REPLACE_WITH_300x250_SLOT_ID",
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
          className="rounded-xl border border-[#e6d2e1] bg-white/70 shadow-sm flex items-center justify-center text-sm text-gray-500"
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
        <div className="absolute top-1 left-0 right-0 text-[10px] text-[#8e3e3e]/60 uppercase tracking-wide text-center pointer-events-none z-10">
          Sponsored
        </div>

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