import { useEffect, useState } from "react";
import { Button } from "./ui/Button";
import AdSlot from "./adslot";

export default function Footer() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <footer className="bg-gradient-to-b from-[#e8ecf7] to-[#b6c1e3] pt-0 pb-2">
      {/* Main footer content */}
      <div className="max-w-5xl mx-auto px-4 py-3">
        <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-stretch justify-between min-h-0">
          {/* About section */}
          <div className="bg-white/70 rounded-3xl shadow-sm px-4 py-3 md:px-5 md:py-4 w-full md:w-1/2 flex flex-col">
            <h2 className="text-sm md:text-base font-semibold text-[#5a2b60] tracking-wide mb-2 logo-glow">
              About Swift-Lore
            </h2>
            <p className="text-xs md:text-sm text-[#4b4b63] leading-relaxed flex-1">
              Swift-Lore is a fan-crafted, interactive timeline chronicling the
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

         {/* AD SECTION – footer sponsored card */}
{import.meta.env.PROD && mounted && (
  <div className="w-full md:w-1/2 flex items-center">
    <AdSlot maxWidthClass="max-w-full" minHeight={180} />
  </div>
)}
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="bg-[#8a9ad4] py-2 px-4 text-center text-white mt-0">
        <div className="max-w-5xl mx-auto flex flex-wrap justify-center items-center gap-2 md:gap-3 text-[11px] md:text-sm">
          
          <a
            href="/cookie-policy"
            className="text-white hover:text-gray-200 underline"
          >
            Cookie Policy
          </a>

          <span className="mx-1">•</span>

          <a
            href="/about"
            className="text-white hover:text-gray-200 underline"
          >
            About / Contact
          </a>

          <span className="mx-1">•</span>

          <a
            href="/privacy_policy"
            className="text-white hover:text-gray-200 underline"
          >
            Privacy Policy
          </a>

          <span className="mx-1">•</span>

          <p className="mx-1">
            Copyright © 2025 Swift-Lore · Fan-made, not affiliated with Taylor Swift.
          </p>
        </div>
      </div>
    </footer>
  );
}