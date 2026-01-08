"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

export default function AdSlot({
  maxWidthClass = "max-w-6xl",
  className = "",
  variant = "leaderboard",
  noOuterPadding = false,
}) {
  const insRef = useRef(null);
  const { pathname } = useLocation();

  const AD_CLIENT = "ca-pub-4534610257929133";

  // Your real slot IDs
  const SLOTS = useMemo(
    () => ({
      leaderboard: "6835416711",
      rectangle: "8756354114",
      // optional: if you want to use your "taylor" unit somewhere specific:
      // taylor: "3327797457",
    }),
    []
  );

  // simple mobile breakpoint
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);

  const config = useMemo(() => {
    if (variant === "rectangle") {
      return {
        slot: SLOTS.rectangle,
        maxWidth: 300,
        minHeight: 250,
      };
    }

    // leaderboard
    return isMobile
      ? { slot: SLOTS.leaderboard, maxWidth: 320, minHeight: 100 }
      : { slot: SLOTS.leaderboard, maxWidth: 728, minHeight: 90 };
  }, [variant, isMobile, SLOTS]);

  useEffect(() => {
    if (!import.meta.env.PROD) return;

    const ins = insRef.current;
    if (!ins) return;

    // Force AdSense to treat it as "new" on route changes
    ins.removeAttribute("data-adsbygoogle-status");
    ins.innerHTML = "";

    // Push after the node is in the DOM
    const id = requestAnimationFrame(() => {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch {
        // ignore
      }
    });

    return () => cancelAnimationFrame(id);
  }, [config.slot, pathname]);

  // DEV placeholder
  if (!import.meta.env.PROD) {
    return (
      <div className={`${maxWidthClass} mx-auto px-4 ${className}`}>
        <div
          className="rounded-xl border border-[#e6d2e1] bg-white/70 shadow-sm flex items-center justify-center text-sm text-gray-500 mx-auto"
          style={{ width: "100%", maxWidth: config.maxWidth, minHeight: config.minHeight }}
        >
          [Ad: {variant} — up to {config.maxWidth}px wide]
        </div>
      </div>
    );
  }

  return (
    <div className={`${maxWidthClass} mx-auto px-4 ${className}`}>
      <div
        className="relative rounded-xl border border-[#e6d2e1] bg-white/70 shadow-sm mx-auto flex items-center justify-center"
        style={{
          width: "100%",
          maxWidth: config.maxWidth,
          minHeight: config.minHeight,
          // IMPORTANT: don't clip ads
          overflow: "hidden",
        }}
      >
        <ins
          // key makes React remount this ins when route changes
          key={`${variant}-${config.slot}-${pathname}`}
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
