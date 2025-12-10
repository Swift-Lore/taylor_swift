"use client";

import { useEffect, useRef } from "react";

export default function AdComponent() {
  const adRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const el = adRef.current;
    if (!el) return;

    let cancelled = false;

    function tryPush() {
      if (cancelled) return;
      const width = el.offsetWidth;

      // If the container width is 0 (common in dev/iframes), wait and try again
      if (!width) {
        setTimeout(tryPush, 500);
        return;
      }

      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        // In dev, you'll still see this sometimes, but it's safe to ignore
        if (import.meta.env.DEV) {
          console.warn("AdSense (dev) warning:", e);
        }
      }
    }

    tryPush();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ins
      ref={adRef}
      className="adsbygoogle"
      style={{
        display: "block",
        textAlign: "center",
        margin: "12px 0",
        minHeight: "90px", // gives it some visible space
      }}
      data-ad-client="ca-pub-9054923750158002"
      data-ad-slot="3327797457"
      data-ad-format="auto"
      data-full-width-responsive="true"
    ></ins>
  );
}
