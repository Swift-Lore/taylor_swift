"use client";

import { useEffect, useRef, useState } from "react";

export default function AdComponent({
  className = "",
  minHeight = 90,           // small placeholder height
  onFilledChange,           // optional callback
}) {
  const adRef = useRef(null);
  const [filled, setFilled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const el = adRef.current;
    if (!el) return;

    let cancelled = false;
    let obs;

    const markFilled = () => {
      if (cancelled) return;
      if (!filled) {
        setFilled(true);
        onFilledChange?.(true);
      }
    };

    const checkIfFilled = () => {
      if (!el) return false;

      // Adsense typically injects an iframe or fills the ins with content
      const iframe = el.querySelector("iframe");
      if (iframe && iframe.offsetHeight > 0) return true;

      // Sometimes google marks status
      if (el.getAttribute("data-adsbygoogle-status") === "done") {
        // done can still be "no fill", but usually means attempted render.
        // We'll only treat it as filled if there's some actual height/content.
        if (el.offsetHeight > 20 || el.childElementCount > 0) return true;
      }

      // Any child content at all is usually a good sign
      if (el.childElementCount > 0 && el.offsetHeight > 20) return true;

      return false;
    };

    function tryPush() {
      if (cancelled) return;

      const width = el.offsetWidth;
      if (!width) {
        setTimeout(tryPush, 250);
        return;
      }

      try {
        // Prevent double-push
        if (el.getAttribute("data-adsbygoogle-status") === "done") return;

        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        if (import.meta.env.DEV) console.warn("AdSense (dev) warning:", e);
      }

      // Observe DOM changes inside <ins> to detect when the ad actually fills
      obs = new MutationObserver(() => {
        if (checkIfFilled()) markFilled();
      });

      obs.observe(el, { childList: true, subtree: true, attributes: true });

      // Also do a few timed checks (covers cases where MutationObserver misses)
      let attempts = 0;
      const tick = () => {
        if (cancelled) return;
        attempts += 1;
        if (checkIfFilled()) {
          markFilled();
          return;
        }
        if (attempts < 20) setTimeout(tick, 150);
      };
      tick();
    }

    tryPush();

    return () => {
      cancelled = true;
      if (obs) obs.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // If not filled yet, we still render the <ins> (so Adsense can inject),
  // but you should hide the OUTER box until filled (see AdSlot below).
  return (
    <ins
      ref={adRef}
      className={`adsbygoogle ${className}`}
      style={{
        display: "block",
        width: "100%",
        minHeight: `${minHeight}px`,
        lineHeight: 0,
        margin: 0,
      }}
      data-ad-client="ca-pub-9054923750158002"
      data-ad-slot="3327797457"
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}
