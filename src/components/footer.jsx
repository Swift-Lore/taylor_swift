import { Button } from "./ui/Button"
import { useEffect } from "react"
import AdComponent from "./ad_component"

export default function Footer() {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      (window as any).adsbygoogle &&
      process.env.NODE_ENV === "production"
    ) {
      try {
        ;(window as any).adsbygoogle = (window as any).adsbygoogle || []
        ;(window as any).adsbygoogle.push({})
      } catch (e) {
        console.error("AdSense error:", e)
      }
    }
  }, [])

  const isProd = process.env.NODE_ENV === "production"

  return (
    <footer className="mt-10 bg-gradient-to-b from-[#e8ecf7] via-[#edf1fb] to-white border-t border-[#d7dff5]">
      <div className="max-w-5xl mx-auto px-4 md:px-6 pt-8 md:pt-10 pb-6 md:pb-8">
        {/* Top area: About + Links + Ad / Support */}
        <div className="grid gap-8 md:grid-cols-[minmax(0,2.1fr)_minmax(0,1.1fr)_minmax(0,1.4fr)] items-start">
          {/* About */}
          <div>
            <h3 className="text-[#4b3a63] font-semibold text-sm md:text-base mb-2">
              About Swift Lore
            </h3>
            <p className="text-[12px] md:text-[13px] text-[#4b3a63]/80 leading-relaxed">
              Swift Lore is a fan-made project archiving Taylor Swift’s
              timeline, releases, Easter Eggs, and iconic moments. Built by
              Swifties, for Swifties — no era left behind. 💗
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-2">
            <h3 className="text-[#4b3a63] font-semibold text-sm md:text-base">
              Quick links
            </h3>
            <nav className="flex flex-col gap-1 text-[12px] md:text-[13px] text-[#4b3a63]/80">
              <button
                className="text-left hover:text-[#b66b6b] transition-colors"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              >
                Back to top
              </button>
              <a
                href="/posts"
                className="hover:text-[#b66b6b] transition-colors"
              >
                View full timeline
              </a>
              <a
                href="https://www.buymeacoffee.com/swiftlore"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#b66b6b] transition-colors"
              >
                Support the project
              </a>
            </nav>
          </div>

          {/* Ad + Support */}
          <div className="space-y-3">
            {/* Ad card */}
            <div className="bg-white/90 rounded-2xl border border-[#f8dada] shadow-[0_10px_28px_rgba(15,23,42,0.12)] px-4 py-5 min-h-[110px] flex items-center justify-center relative">
              <span className="absolute top-2 left-4 text-[10px] uppercase tracking-[0.14em] text-[#9ca3af]">
                Sponsored
              </span>

              {isProd ? (
                <AdComponent />
              ) : (
                <div className="text-[#9ca3af] text-[12px] md:text-[13px] italic text-center px-2">
                  Advertisement space — helping keep Swift Lore online ✨
                </div>
              )}
            </div>

            {/* Support buttons */}
            <div className="flex justify-start md:justify-end gap-2 flex-wrap">
              <a
                href="https://buymeacoffee.com/swiftlore"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="secondary" className="rounded-full px-4 py-1.5">
                  Support Us
                </Button>
              </a>
              <a
                href="https://docs.google.com/forms/d/e/1FAIpQLSc0f-asKuKOM81V3sPMusyvSkdcFr9XqrGVT0VgodPKKpkKPg/viewform?usp=header"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="secondary" className="rounded-full px-4 py-1.5">
                  Submit Suggestion
                </Button>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom row: disclaimer + legal */}
        <div className="mt-7 pt-4 border-t border-[#d7dff5] flex flex-col md:flex-row items-center justify-between gap-3 text-[11px] md:text-[12px] text-[#4b3a63]/80">
          <p className="text-center md:text-left">
            Swift Lore is a fan project and is not affiliated with Taylor Swift,
            her team, or any official entities.
          </p>

          <div className="flex flex-wrap justify-center md:justify-end items-center gap-4">
            <a
              href="/cookie_policy"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#b66b6b] underline"
            >
              Cookie Policy
            </a>
            <span>Copyright © 2025 Swift Lore</span>
            <a
              href="/privacy_policy"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#b66b6b] underline"
            >
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
