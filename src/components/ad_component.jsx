"use client"

import { useEffect } from "react"

export default function AdComponent() {
  useEffect(() => {
    if (typeof window === "undefined") return

    // Only inject the script once
    if (!window.__adsenseLoaded) {
      const script = document.createElement("script")
      script.src =
        "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4534610257929133"
      script.async = true
      script.crossOrigin = "anonymous"
      document.body.appendChild(script)
      window.__adsenseLoaded = true
    }

    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch (e) {
      console.error("Ad error:", e)
    }
  }, [])

  return (
    <ins
      className="adsbygoogle block"
      style={{ display: "block", width: "100%", height: "90px" }}
      data-ad-client="ca-pub-4534610257929133"
      data-ad-slot="3327797457"
    ></ins>
  )
}
