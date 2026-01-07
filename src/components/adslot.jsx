// adslot.jsx - SIMPLIFIED VERSION
"use client";

import { useEffect, useRef } from "react";

export default function AdSlot({
  maxWidthClass = "max-w-4xl",
  minHeight = 90,
  className = "",
}) {
  const adRef = useRef(null);
  const initialized = useRef(false);

  useEffect(() => {
    // Only run in production
    if (!import.meta.env.PROD || initialized.current) return;

    // Wait for component to mount and Google script to load
    const loadAd = () => {
      try {
        // Check if Google script is loaded
        if (typeof window === 'undefined' || !window.adsbygoogle) {
          console.warn('AdSense script not loaded yet, retrying...');
          setTimeout(loadAd, 500);
          return;
        }

        // Only initialize once
        if (adRef.current && !initialized.current) {
          // This is the standard way to load ads in React
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          initialized.current = true;
          console.log('Ad initialized');
        }
      } catch (error) {
        console.error('Error loading ad:', error);
      }
    };

    // Initial load attempt
    loadAd();

    // Fallback: try again after 1 second
    const timeoutId = setTimeout(() => {
      if (!initialized.current) {
        loadAd();
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, []);

  // Don't show in development
  if (!import.meta.env.PROD) {
    return (
      <div className={`${maxWidthClass} mx-auto px-4 my-6`}>
        <div className="bg-gray-100 rounded-lg p-4 text-center text-gray-600 border border-dashed border-gray-300">
          [Ad Slot - 300x250]
        </div>
      </div>
    );
  }

  return (
    <div className={`${maxWidthClass} mx-auto px-4 my-6 ${className}`}>
      <div className="ad-container rounded-lg border border-gray-200 bg-gray-50 p-2">
        <div className="text-xs text-gray-500 uppercase tracking-wide mb-1 text-center">
          Advertisement
        </div>
        
        <div
          ref={adRef}
          style={{ minHeight: `${minHeight}px` }}
          className="flex items-center justify-center"
        >
          <ins
            className="adsbygoogle"
            style={{
              display: 'block',
              width: '100%',
              minHeight: `${minHeight}px',
            }}
            data-ad-client="ca-pub-4534610257929133"
            data-ad-slot="3327797457"
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        </div>
        
        <div className="text-center text-gray-400 text-xs mt-1">
          Advertisement may take a moment to load
        </div>
      </div>
    </div>
  );
}