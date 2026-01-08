"use client";

import { useEffect, useRef } from "react";

export default function AdSlot({
  // Just layout helpers now
  maxWidthClass = "max-w-6xl",
  className = "",
  minHeight = 90, // small default; override per placement
}) {
  const insRef = useRef(null);

  const AD_CLIENT = "ca-pub-4534610257929133";

  useEffect(() => {
    if (!import.meta.env.PROD) return;

    const ins = insRef.current;
    if (!ins) return;

    // ✅ Key: don't push again if this ins already rendered an ad
    // (React rerenders + route changes can otherwise break AdSense)
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
          style={{ minHeight }}
        >
          [Ad Placeholder — Auto]
        </div>
      </div>
    );
  }

  return (
    <div className={`${maxWidthClass} mx-auto px-4 ${className}`}>
      <div
        className="relative rounded-xl border border-[#e6d2e1] bg-white/70 shadow-sm overflow-hidden"
        style={{ minHeight }}
      >
        {/* Label (doesn't affect height) */}
        <div className="absolute top-1 left-0 right-0 text-[10px] text-[#8e3e3e]/60 uppercase tracking-wide text-center pointer-events-none z-10">
          Sponsored
        </div>

        {/* Auto Ads responsive unit */}
        <ins
          ref={insRef}
          className="adsbygoogle"
          style={{
            display: "block",
            width: "100%",
            height: "auto",
          }}
          data-ad-client={AD_CLIENT}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    </div>
  );
}
