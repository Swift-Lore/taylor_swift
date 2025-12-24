// ad_component.jsx - Updated with resize observer
"use client";

import { useEffect, useRef } from "react";

export default function AdComponent({ onFilledChange, adUnitPath }) {
  const adRef = useRef(null);
  const adLoaded = useRef(false);

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;

    const loadAd = () => {
      if (adLoaded.current) return;
      
      try {
        // Set a timeout to handle ad loading
        const timeoutId = setTimeout(() => {
          if (adRef.current && adRef.current.innerHTML.trim() === "") {
            // Ad didn't load, mark as filled to hide container
            onFilledChange(false);
          }
        }, 3000);

        // Load Google Ad
        (window.adsbygoogle = window.adsbygoogle || []).push({
          google_ad_client: "ca-pub-YOUR_PUBLISHER_ID",
          enable_page_level_ads: false,
          overlays: false,
        });

        adLoaded.current = true;
        onFilledChange(true);
        
        return () => clearTimeout(timeoutId);
      } catch (error) {
        console.error("Ad loading error:", error);
        onFilledChange(false);
      }
    };

    // Load ad when component mounts
    loadAd();
  }, [onFilledChange, adUnitPath]);

  return (
    <div ref={adRef} className="ad-container w-full">
      <ins
        className="adsbygoogle"
        style={{
          display: "block",
          width: "100%",
          minWidth: "300px",
          minHeight: "90px",
          maxHeight: "600px",
        }}
        data-ad-client="ca-pub-YOUR_PUBLISHER_ID"
        data-ad-slot="YOUR_AD_SLOT_ID"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}