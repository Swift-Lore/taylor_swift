// ad_component.jsx - COMPLETE UPDATED VERSION
"use client";

import { useEffect, useRef } from "react";

export default function AdComponent({ minHeight, onFilledChange }) {
  const adRef = useRef(null);
  const adInitialized = useRef(false);

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;
    if (adInitialized.current) return;

    const initializeAd = () => {
      try {
        // Ensure Google Ads script is loaded
        if (!window.adsbygoogle) {
          window.adsbygoogle = [];
        }

        // Set a timeout to detect if ad fails to load
        const loadTimeout = setTimeout(() => {
          if (adRef.current && !adRef.current.querySelector('iframe')) {
            console.log("Ad failed to load within timeout");
            onFilledChange(false);
          }
        }, 5000);

        // Push the ad configuration
        window.adsbygoogle.push({
          google_ad_client: "ca-pub-YOUR_PUBLISHER_ID", // REPLACE WITH YOUR PUBLISHER ID
          enable_page_level_ads: false,
          overlays: false,
        });

        adInitialized.current = true;
        
        // Mark as filled (ad will load asynchronously)
        onFilledChange(true);

        // Cleanup timeout
        return () => clearTimeout(loadTimeout);
      } catch (error) {
        console.error("Ad initialization error:", error);
        onFilledChange(false);
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(initializeAd, 50);
    
    return () => {
      clearTimeout(timer);
      adInitialized.current = false;
    };
  }, [onFilledChange]);

  return (
    <div 
      ref={adRef}
      className="google-ad-wrapper w-full h-full"
      style={{
        minHeight: `${minHeight}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <ins
        className="adsbygoogle"
        style={{
          display: 'block',
          width: '100%',
          minWidth: '300px',
          minHeight: `${minHeight}px`,
          maxHeight: '600px',
          overflow: 'hidden',
          textAlign: 'center'
        }}
        data-ad-client="ca-pub-YOUR_PUBLISHER_ID" // REPLACE WITH YOUR PUBLISHER ID
        data-ad-slot="YOUR_AD_SLOT_ID" // REPLACE WITH YOUR AD SLOT ID
        data-ad-format="auto"
        data-full-width-responsive="true"
        data-adtest={process.env.NODE_ENV === 'development' ? 'on' : 'off'}
      />
    </div>
  );
}