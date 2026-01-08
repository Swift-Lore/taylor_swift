"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export default function AdSlot({
  variant = "leaderboard", // "leaderboard" | "rectangle"
  maxWidthClass = "max-w-6xl",
  className = "",
}) {
  const insRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile breakpoint
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);

  // ✅ IMPORTANT: Put your real AdSense slot IDs here (create 3 fixed-size units in AdSense)
  const AD_CLIENT = "ca-pub-4534610257929133";
  const SLOTS = {
    LEADERBOARD_DESKTOP: "REPLACE_WITH_728x90_SLOT_ID",
    LEADERBOARD_MOBILE: "REPLACE_WITH_320x100_SLOT_ID",
    RECTANGLE: "REPLACE_WITH_300x250_SLOT_ID",
  };

  const config = useMemo(() => {
    if (variant === "rectangle") {
      return {
        slot: SLOTS.RECTANGLE,
        width: 300,
        height: 250,
      };
    }

    // leaderboard
    if (isMobile) {
      return {
        slot: SLOTS.LEADERBOARD_MOBILE,
        width: 320,
        height: 100,
      };
    }

    return {
      slot: SLOTS.LEADERBOARD_DESKTOP,
      width: 728,
      height: 90,
    };
  }, [variant, isMobile]);

  useEffect(() => {
    if (!import.meta.env.PROD) return;

    // If slot IDs are still placeholders, don't try to load ads
    if (!config.slot || config.slot.includes("REPLACE_WITH")) return;

    const ins = insRef.current;
    if (!ins) return;

    // Clear any previous ad markup when route changes / rerenders
    ins.innerHTML = "";

    // Push the ad
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // ignore
    }
  }, [config.slot]);

  // DEV placeholder
  if (!import.meta.env.PROD) {
    return (
      <div className={`${maxWidthClass} mx-auto px-4 ${className}`}>
        <div
          className="rounded-xl border border-[#e6d2e1] bg-white/70 shadow-sm flex items-center justify-center text-sm text-gray-500"
          style={{ height: config.height }}
        >
          [Ad: {variant} — {config.width}×{config.height}]
        </div>
      </div>
    );
  }

  // PROD render
  return (
    <div className={`${maxWidthClass} mx-auto px-4 ${className}`}>
      <div
        className="relative rounded-xl border border-[#e6d2e1] bg-white/70 shadow-sm overflow-hidden flex items-center justify-center"
        style={{ height: config.height }}
      >
        {/* Overlay label (does not affect height) */}
        <div className="absolute top-1 left-0 right-0 text-[10px] text-[#8e3e3e]/60 uppercase tracking-wide text-center pointer-events-none z-10">
          Sponsored
        </div>

        <ins
          ref={insRef}
          className="adsbygoogle"
          style={{
            display: "inline-block",
            width: `${config.width}px`,
            height: `${config.height}px`,
          }}
          data-ad-client={AD_CLIENT}
          data-ad-slot={config.slot}
        />
      </div>
    </div>
  );
}
