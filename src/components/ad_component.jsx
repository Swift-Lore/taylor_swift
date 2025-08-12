"use client"

import { useEffect } from 'react'

export default function AdComponent() {
  useEffect(() => {
    // Load the ad script
    const script = document.createElement('script')
    script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4534610257929133'
    script.async = true
    script.crossOrigin = 'anonymous'
    document.body.appendChild(script)

    // Initialize the ad
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch (e) {
      console.error('Ad error:', e)
    }

    return () => {
      // Cleanup
      document.body.removeChild(script)
    }
  }, [])

  return (
    <div className="flex justify-center mt-8 mb-4">
      <ins 
        className="adsbygoogle"
        style={{ display: 'inline-block', width: '728px', height: '90px' }}
        data-ad-client="ca-pub-4534610257929133"
        data-ad-slot="3327797457"
      ></ins>
    </div>
  )
}