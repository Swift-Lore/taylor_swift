"use client";

import { useEffect } from "react";

export default function AdComponent() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Only run adsbygoogle push when the script is already loaded
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error("AdSense error:", e);
    }
  }, []);

  return (
    <ins
      className="adsbygoogle"
      style={{ display: "block", textAlign: "center", margin: "12px 0" }}
      data-ad-client="ca-pub-9054923750158002"
      data-ad-slot="3327797457"
      data-ad-format="auto"
      data-full-width-responsive="true"
    ></ins>
  );
}
