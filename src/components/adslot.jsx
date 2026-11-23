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

  const SLOTS = {
    leaderboard: "6835416711",
    rectangle: "8756354114",
  };

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const config =
    variant === "rectangle"
      ? { slot: SLOTS.rectangle, maxWidth: 300, minHeight: 250 }
      : isMobile
      ? { slot: SLOTS.leaderboard, maxWidth: 320, minHeight: 100 }
      : { slot: SLOTS.leaderboard, maxWidth: 728, minHeight: 90 };

  useEffect(() => {
  if (!import.meta.env.PROD) return;

  const ins = insRef.current;
  if (!ins) return;

  let frameId;

  const requestAd = () => {
    if (!ins.isConnected) return;
    if (ins.hasAttribute("data-adsbygoogle-status")) return;
    if (ins.dataset.swiftLoreAdRequested === "true") return;
    if (ins.getBoundingClientRect().width <= 0) return;

    const script = document.querySelector(
      'script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]'
    );
    if (!script) return;

    ins.dataset.swiftLoreAdRequested = "true";

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (error) {
      console.error("AdSense initialization failed:", error);
    }
  };

  const scheduleAd = () => {
    cancelAnimationFrame(frameId);
    frameId = requestAnimationFrame(requestAd);
  };

  const resizeObserver = new ResizeObserver(scheduleAd);
  resizeObserver.observe(ins);

  const scriptObserver = new MutationObserver(scheduleAd);
  scriptObserver.observe(document.head, { childList: true });

  scheduleAd();

  return () => {
    cancelAnimationFrame(frameId);
    resizeObserver.disconnect();
    scriptObserver.disconnect();
  };
}, [config.slot, pathname]);

  return (
    <div
      className={`${maxWidthClass} mx-auto ${
        noOuterPadding ? "" : "px-4"
      } ${className}`}
    >
      <div
        className="mx-auto"
        style={{
          width: "100%",
          maxWidth: config.maxWidth,
          minHeight: config.minHeight,
          overflow: "visible",
        }}
      >
        <ins
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
