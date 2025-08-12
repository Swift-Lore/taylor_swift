import { Button } from "./ui/Button"
import { useEffect } from "react"
import AdComponent from "./ad_component";

export default function Footer() {

  useEffect(() => {
    // Initialize AdSense ad after component mounts (only in production)
    if (typeof window !== 'undefined' && window.adsbygoogle && process.env.NODE_ENV === 'production') {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        console.error("AdSense error:", e);
      }
    }
  }, []);

  return (
    <footer className="w-full overflow-hidden">
      <div className="relative">
        {/* Background Image */}
        <div className="relative w-full h-[410px]">
          <img
            src="/images/taylor_swift_background.jpg"
            alt="Taylor Swift Background"
            className="absolute inset-0 w-full h-full object-cover object-[center_20%]"
          />
          <div className="absolute inset-0 bg-black/30"></div>
        </div>

        {/* Ad Placement - Fixed for mobile */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md mx-auto">
          <div className="bg-white/90 p-4 rounded-lg text-center min-h-[100px] flex items-center justify-center">
            {process.env.NODE_ENV === 'production' ? (
              <ins 
                className="adsbygoogle"
                style={{ 
                  display: 'block',
                  width: '100%',
                  maxWidth: '320px',
                  margin: '0 auto'
                }}
                data-ad-client="ca-pub-4534610257929133"
                data-ad-slot="3327797457"
                data-ad-format="auto"
                data-full-width-responsive="true"
              />
            ) : (
              <div className="text-gray-500 text-sm">
                <AdComponent />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Support Buttons */}
      <div className="bg-[#e8ecf7] py-5 px-4">
        <div className="flex justify-center gap-3 flex-wrap">
          <a
            href="https://buymeacoffee.com/swiftlore"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="secondary" className="rounded-full px-7">
              Support Us
            </Button>
          </a>
          <a
            href="https://docs.google.com/forms/d/e/1FAIpQLSc0f-asKuKOM81V3sPMusyvSkdcFr9XqrGVT0VgodPKKpkKPg/viewform?usp=header"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="secondary" className="rounded-full px-7">
              Submit Suggestion
            </Button>
          </a>
        </div>
      </div>

      {/* Copyright - Fixed syntax error */}
      <div className="bg-[#8a9ad4] py-3 px-4 text-center text-white">
        <div className="flex flex-wrap justify-center items-center gap-4 text-sm">
          <a
            href="/cookie_policy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white hover:text-gray-200 underline"
          >
            Cookie Policy
          </a>

          <p>Copyright © 2025 Swift Lore</p>

          <a
            href="/privacy_policy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white hover:text-gray-200 underline"
          >
            Privacy Policy
          </a>
        </div>
      </div>
    </footer>
  )
}