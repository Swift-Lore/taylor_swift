import { useEffect } from "react";
import { Button } from "./ui/Button";
import AdComponent from "./ad_component";

export default function Footer() {
  // AdSense init
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.adsbygoogle &&
      process.env.NODE_ENV === "production"
    ) {
      try {
        // eslint-disable-next-line no-undef
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        console.error("AdSense error:", e);
      }
    }
  }, []);

  return (
    <footer className="bg-gradient-to-b from-[#e8ecf7] to-[#b6c1e3] pt-0 md:pt-1 pb-2 md:pb-3">
      {/* Main footer content */}
      <div className="max-w-5xl mx-auto px-4 py-2">
        <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-stretch justify-between">
          {/* About / description card */}
          <div className="bg-white/70 rounded-3xl shadow-sm px-4 py-2 md:px-5 md:py-3 w-full md:w-1/2">
            <h2 className="text-sm md:text-base font-semibold text-[#5a2b60] tracking-wide mb-1 logo-glow">
              About Swift Lore
            </h2>
            <p className="text-xs md:text-sm text-[#4b4b63] leading-relaxed">
              Swift Lore is a fan-crafted, interactive timeline chronicling the
              epic life and career of Taylor Swift — from album releases and
              Easter Eggs to dating history and iconic moments.{" "}
              <span className="font-semibold">No era left behind.</span>
            </p>

            {/* Support buttons */}
            <div className="mt-3 flex flex-wrap gap-2 justify-start">
              <a
                href="https://buymeacoffee.com/swiftlore"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  variant="secondary"
                  className="rounded-full px-4 py-1.5 text-xs md:text-sm"
                >
                  Support the Site
                </Button>
              </a>
              <a
                href="https://docs.google.com/forms/d/e/1FAIpQLSc0f-asKuKOM81V3sPMusyvSkdcFr9XqrGVT0VgodPKKpkKPg/viewform?usp=header"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  variant="secondary"
                  className="rounded-full px-4 py-1.5 text-xs md:text-sm"
                >
                  Submit a Suggestion
                </Button>
              </a>
            </div>
          </div>

          {/* Ad card */}
          <div className="w-full md:w-1/2">
            <div className="relative h-full bg-white/75 rounded-3xl border border-[#f8dada] px-4 py-2 md:px-5 md:py-3 flex items-center justify-center card-soft glass-soft">
              <span className="absolute top-2 left-4 text-[10px] uppercase tracking-[0.16em] text-[#9ca3af]">
                Sponsored
              </span>

              {process.env.NODE_ENV === "production" ? (
                <AdComponent />
              ) : (
                <div className="text-[#9ca3af] text-xs md:text-sm italic text-center px-2">
                  Advertisement space — helping keep Swift Lore online 💫
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="bg-[#8a9ad4] py-1 px-4 text-center text-white">
        <div className="max-w-5xl mx-auto flex flex-wrap justify-center items-center gap-2 md:gap-3 text-[11px] md:text-sm">
          <a
            href="/cookie_policy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white hover:text-gray-200 underline"
          >
            Cookie Policy
          </a>

          <p className="mx-1">
            Copyright © 2025 Swift Lore · Fan-made, not affiliated with Taylor
            Swift.
          </p>

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
  );
}
