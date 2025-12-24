// adslot.jsx - FINAL VERSION WITH YOUR CORRECT IDs
"use client";

import { useEffect, useRef, useState } from "react";

export default function AdSlot({
  maxWidthClass = "max-w-4xl",
  minHeight = 90,
  className = "",
}) {
  const [filled, setFilled] = useState(false);
  const [showAd, setShowAd] = useState(false);
  const containerRef = useRef(null);
  const adRef = useRef(null);
  const adInitialized = useRef(false);

  // Delay showing ad to ensure container is properly sized
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowAd(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Initialize Google Ad
  useEffect(() => {
    if (!showAd || adInitialized.current || typeof window === "undefined") return;

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
            setFilled(false);
            
            // Hide container after 5 seconds if ad fails
            setTimeout(() => {
              if (containerRef.current) {
                containerRef.current.style.display = 'none';
              }
            }, 2000);
          }
        }, 5000);

        // Push the ad configuration WITH YOUR CORRECT IDs
        window.adsbygoogle.push({
          google_ad_client: "ca-pub-4534610257929133", // Your Publisher ID from script tag
          enable_page_level_ads: false,
          overlays: false,
        });

        adInitialized.current = true;
        setFilled(true);

        // Cleanup timeout
        return () => clearTimeout(loadTimeout);
      } catch (error) {
        console.error("Ad initialization error:", error);
        setFilled(false);
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(initializeAd, 50);
    
    return () => {
      clearTimeout(timer);
      adInitialized.current = false;
    };
  }, [showAd]);

  // Handle ad fill state changes
  useEffect(() => {
    if (!filled && containerRef.current) {
      const timeout = setTimeout(() => {
        if (containerRef.current && !filled) {
          containerRef.current.style.display = 'none';
        }
      }, 7000); // Hide after 7 seconds if ad never loads
      
      return () => clearTimeout(timeout);
    }
  }, [filled]);

  return (
    <div 
      ref={containerRef}
      className={`${maxWidthClass} mx-auto px-4 my-6 ad-slot-container`}
    >
      {/* Always visible container with proper dimensions */}
      <div
        className={`relative rounded-2xl border border-[#f8dada] 
          bg-gradient-to-b from-[#fff8f8] to-[#fdeeee] 
          shadow-sm flex items-center justify-center ${className}`}
        style={{ 
          minHeight: `${minHeight}px`,
          width: '100%',
          minWidth: '300px', // Prevent skinny loading
          maxWidth: '100%',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {/* "Sponsored" label - always show */}
        <span className="absolute top-2 left-4 text-[10px] uppercase tracking-[0.12em] text-[#9ca3af] z-10">
          Sponsored
        </span>

        {/* Ad Content */}
        <div className="w-full h-full flex items-center justify-center">
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
              data-ad-client="ca-pub-4534610257929133" // Your Publisher ID from script tag
              data-ad-slot="3327797457" // Your Ad Slot ID from AdSense
              data-ad-format="auto"
              data-full-width-responsive="true"
              data-adtest={process.env.NODE_ENV === 'development' ? 'on' : 'off'}
            />
          </div>
        </div>

        {/* Loading placeholder - shows while ad loads */}
        {!filled && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/90 z-20">
            <div className="text-sm text-gray-400 animate-pulse">
              Loading advertisement...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}