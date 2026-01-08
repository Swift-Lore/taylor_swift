// adslot.jsx — FIXED TOTAL HEIGHT (prevents tall boxes)
"use client";

import { useEffect, useRef } from "react";

export default function AdSlot({
  variant = "leaderboard", // "leaderboard" | "rectangle"
  maxWidthClass = "max-w-6xl",
  className = "",
}) {
  const initialized = useRef(false);

  useEffect(() => {
    if (!import.meta.env.PROD) return;

    initialized.current = false;

    const loadAd = () => {
      if (!window.adsbygoogle || initialized.current) return;
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        initialized.current = true;
      } catch {}
    };

    const t = setTimeout(loadAd, 200);
    return () => clearTimeout(t);
  }, []);

  const isLeaderboard = variant === "leaderboard";
  const SLOT_HEIGHT = isLeaderboard ? 90 : 250;

  // DEV placeholder
  if (!import.meta.env.PROD) {
    return (
      <div className={`${maxWidthClass} mx-auto px-4 ${className}`}>
        <div
          className="bg-gray-200 rounded-xl flex items-center justify-center text-sm text-gray-500"
          style={{ height: SLOT_HEIGHT }}
        >
          [Ad: {variant} — {SLOT_HEIGHT}px]
        </div>
      </div>
    );
  }

  return (
    <div className={`${maxWidthClass} mx-auto px-4 ${className}`}>
      {/* LOCK the TOTAL component height right here */}
      <div
        className="relative overflow-hidden rounded-xl border border-[#e6d2e1] bg-white/70 shadow-sm"
        style={{ height: SLOT_HEIGHT }}
      >
        {/* Sponsored label overlay (does NOT add height) */}
        <div className="absolute top-1 left-0 right-0 text-[10px] text-[#8e3e3e]/60 uppercase tracking-wide text-center pointer-events-none z-10">
          Sponsored
        </div>

        {/* Ad container fills the locked height */}
        <div className="w-full h-full flex items-center justify-center">
          <ins
            className="adsbygoogle"
            style={{
              display: "block",
              width: "100%",
              height: "100%",
            }}
            data-ad-client="ca-pub-4534610257929133"
            data-ad-slot="3327797457"
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        </div>
      </div>
    </div>
  );
}
