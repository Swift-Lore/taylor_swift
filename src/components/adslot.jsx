"use client";

import { useEffect, useMemo, useRef } from "react";

export default function AdSlot({
  maxWidthClass = "max-w-6xl",
  className = "",
  variant = "leaderboard", // "leaderboard" | "rectangle"
}) {
  const insRef = useRef(null);

  const AD_CLIENT = "ca-pub-4534610257929133";

  const adConfig = useMemo(() => ({
    leaderboard: {
      slot: "6835416711",
      maxWidth: 728,
      minHeight: 90,
    },
    rectangle: {
      slot: "8756354114",
      maxWidth: 300,
      minHeight: 250,
    },
  }), []);

  const config = adConfig[variant] || adConfig.leaderboard;

  useEffect(() => {
    if (!import.meta.env.PROD) return;

    const ins = insRef.current;
    if (!ins) return;

    // Reset so it can refill correctly on SPA rerenders
    ins.removeAttribute("data-adsbygoogle-status");
    ins.innerHTML = "";

    window.adsbygoogle = window.adsbygoogle || [];
    try {
      window.adsbygoogle.push({});
    } catch {
      // ignore
    }
  }, [config.slot]);

  // DEV placeholder
  if (!import.meta.env.PROD) {
    return (
      <div className={`${maxWidthClass} mx-auto px-4 ${className}`}>
        <div
          className="rounded-xl border border-[#e6d2e1] bg-white/70 shadow-sm flex items-center justify-center text-sm text-gray-500 mx-auto"
          style={{
            width: "100%",
            maxWidth: `${config.maxWidth}px`,
            minHeight: `${config.minHeight}px`,
          }}
        >
          [Ad: {variant} — up to {config.maxWidth}px wide]
        </div>
      </div>
    );
  }

  return (
    <div className={`${maxWidthClass} mx-auto px-4 ${className}`}>
      <div
        className="relative rounded-xl border border-[#e6d2e1] bg-white/70 shadow-sm mx-auto"
        style={{
          width: "100%",
          maxWidth: `${config.maxWidth}px`,
          minHeight: `${config.minHeight}px`,
        }}
      >
        <ins
          ref={insRef}
          className="adsbygoogle"
          style={{ display: "block", width: "100%" }}
          data-ad-client={AD_CLIENT}
          data-ad-slot={config.slot}
        />
      </div>
    </div>
  );
}
