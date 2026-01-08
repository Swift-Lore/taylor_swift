// adslot.jsx — CONTROLLED HEIGHT VERSION
"use client";

import { useEffect, useRef } from "react";

export default function AdSlot({
  variant = "leaderboard", // "leaderboard" | "rectangle"
  maxWidthClass = "max-w-6xl",
  className = "",
}) {
  const insRef = useRef(null);
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

    setTimeout(loadAd, 200);
  }, []);

  if (!import.meta.env.PROD) {
    return (
      <div className={`${maxWidthClass} mx-auto px-4 ${className}`}>
        <div className="h-[90px] bg-gray-200 rounded-xl flex items-center justify-center text-sm text-gray-500">
          [Ad: {variant}]
        </div>
      </div>
    );
  }

  const isLeaderboard = variant === "leaderboard";

  return (
    <div className={`${maxWidthClass} mx-auto px-4 ${className}`}>
      <div className="rounded-xl border border-[#e6d2e1] bg-white/70 shadow-sm px-2 py-2">
        <div className="text-[10px] text-[#8e3e3e]/60 uppercase tracking-wide mb-1 text-center">
          Sponsored
        </div>

        <div
          className={`
            overflow-hidden
            flex items-center justify-center
            ${isLeaderboard ? "h-[90px]" : "h-[250px]"}
          `}
        >
          <ins
            ref={insRef}
            className="adsbygoogle"
            style={{
              display: "block",
              width: "100%",
              height: isLeaderboard ? "90px" : "250px",
            }}
            data-ad-client="ca-pub-4534610257929133"
            data-ad-slot="3327797457"
            data-ad-format={isLeaderboard ? "horizontal" : "rectangle"}
            data-full-width-responsive="true"
          />
        </div>
      </div>
    </div>
  );
}
