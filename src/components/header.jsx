"use client";

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [eventData, setEventData] = useState(null);
  const isFullTimelinePage = location.pathname === "/posts";
  const isEventPage = location.pathname === "/post_details";
  const isErasPage = location.pathname === "/eras-tour-shows";
  const showHero = !isFullTimelinePage && !isEventPage;
  const isHomePage = location.pathname === "/";

  // Sync search box with ?q=
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const queryFromUrl = urlParams.get("q");
    if (queryFromUrl) {
      setSearchQuery(queryFromUrl);
    } else {
      setSearchQuery("");
    }
  }, [location.search]);

  // Fetch event data for event header
  useEffect(() => {
    if (isEventPage) {
      const searchParams = new URLSearchParams(location.search);
      const postId = searchParams.get("id");

      if (postId) {
        const fetchEventData = async () => {
          try {
            const response = await fetch(
              `https://api.airtable.com/v0/appVhtDyx0VKlGbhy/Taylor%20Swift%20Master%20Tracker/${postId}`,
              {
                headers: {
                  Authorization: `Bearer ${import.meta.env.VITE_AIRTABLE_API_KEY}`,
                },
              }
            );

            if (response.ok) {
              const data = await response.json();
              setEventData(data.fields);
            }
          } catch (error) {
            console.error("Error fetching event data for header:", error);
          }
        };

        fetchEventData();
      }
    }
  }, [isEventPage, location.search]);

  // Safe date formatting
  const formatEventDate = (isoDate) => {
    if (!isoDate) return "";

    try {
      const d = new Date(isoDate);
      if (Number.isNaN(d.getTime())) return "";

      const month = d.toLocaleString("en-US", {
        month: "short",
        timeZone: "UTC",
      });
      const day = String(d.getUTCDate()).padStart(2, "0");
      const year = d.getUTCFullYear();

      return `${month}-${day}-${year}`;
    } catch (error) {
      console.error("Error formatting date:", error);
      return "";
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) {
      navigate("/");
      return;
    }

    const formattedQuery =
      trimmedQuery.charAt(0).toUpperCase() + trimmedQuery.slice(1);

    navigate(`/?q=${encodeURIComponent(formattedQuery)}`);
  };

  const handleInputChange = (e) => setSearchQuery(e.target.value);

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSearch(e);
  };

  const handleLogoClick = () => {
    setSearchQuery("");
    navigate("/");
  };

  return (
    <header className="relative w-full bg-gradient-to-b from-[#9fa8f5] via-[#8a9ad4] to-[#e6edf7] pb-1 md:pb-2 shadow-[0_8px_20px_rgba(75,85,160,0.3)] fade-in-up overflow-visible z-10">
      {/* Smaller decorative glow */}
      <div className="pointer-events-none absolute -top-3 left-1/2 -translate-x-1/2 md:left-12 md:translate-x-0 w-32 h-32 blur-xl bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.8),_rgba(148,163,233,0))] opacity-70" />

      <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 pt-2 md:pt-3 flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4 relative">
        {/* =============== FULL TIMELINE PAGE HEADER =============== */}
        {isFullTimelinePage && !isEventPage && (
          <>
            {/* Mobile layout - more compact */}
            <div className="w-full md:hidden flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={handleLogoClick}
                className="cursor-pointer"
              >
                <img
                  src="/images/swift_lore.png"
                  alt="Swift Lore"
                  className="h-auto object-contain max-h-[100px] md:max-h-[120px] logo-glow"
                  style={{ maxWidth: "220px" }}
                />
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => navigate("/")}
                  className="bg-white/90 text-[#8e3e3e] hover:bg-white rounded-full px-4 py-1 text-sm font-medium shadow-sm border border-white/70 transition-all whitespace-nowrap"
                >
                  Return to Home
                </button>
                <button
                  onClick={() => navigate("/eras-tour-shows")}
                  className="bg-white/90 text-[#8e3e3e] hover:bg-white rounded-full px-4 py-1 text-sm font-medium shadow-sm border border-white/70 transition-all whitespace-nowrap"
                >
                  Eras Tour Shows
                </button>
              </div>

              <h2 className="text-white text-xl md:text-2xl font-serif drop-shadow-lg tracking-wide text-center mt-1">
                Taylor Swift&apos;s Career Timeline
              </h2>
            </div>

            {/* Desktop layout - more compact */}
            <div className="hidden md:flex md:w-[55%] flex-col items-start">
              <h2 className="text-white text-2xl md:text-3xl font-serif drop-shadow-lg tracking-wide text-left">
                Taylor Swift&apos;s Career Timeline
              </h2>
            </div>

            <div className="hidden md:flex md:w-[35%] justify-end">
              <div className="flex flex-col items-center gap-1">
                <button
                  type="button"
                  onClick={handleLogoClick}
                  className="cursor-pointer flex justify-center"
                >
                  <img
                    src="/images/swift_lore.png"
                    alt="Swift Lore"
                    className="h-auto object-contain max-h-[100px] md:max-h-[120px] logo-glow"
                    style={{ maxWidth: "220px" }}
                  />
                </button>

                <div className="flex gap-2 mt-1">
                  <button
                    onClick={() => navigate("/")}
                    className="bg-white/90 text-[#8e3e3e] hover:bg-white rounded-full px-4 py-1 text-sm font-medium shadow-sm border border-white/70 transition-all whitespace-nowrap"
                  >
                    Return to Home
                  </button>
                  <button
                    onClick={() => navigate("/eras-tour-shows")}
                    className="bg-white/90 text-[#8e3e3e] hover:bg-white rounded-full px-4 py-1 text-sm font-medium shadow-sm border border-white/70 transition-all whitespace-nowrap"
                  >
                    Eras Tour Shows
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* =============== EVENT DETAILS PAGE HEADER =============== */}
        {isEventPage && (
          <>
            {/* Mobile: more compact */}
            <div className="w-full md:hidden flex flex-col items-center gap-3 mb-2">
              <button
                type="button"
                onClick={handleLogoClick}
                className="cursor-pointer"
              >
                <img
                  src="/images/swift_lore.png"
                  alt="Swift Lore"
                  className="h-auto object-contain max-h-[80px] logo-glow"
                  style={{ maxWidth: "160px" }}
                />
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => navigate("/")}
                  className="bg-white/90 text-[#8e3e3e] hover:bg-white rounded-full px-4 py-1 text-sm font-medium shadow-sm border border-white/70 transition-all whitespace-nowrap"
                >
                  Return to Home
                </button>
                <button
                  onClick={() => navigate("/posts")}
                  className="bg-white/90 text-[#8e3e3e] hover:bg-white rounded-full px-4 py-1 text-sm font-medium shadow-sm border border-white/70 transition-all whitespace-nowrap"
                >
                  View Full Timeline
                </button>
              </div>
            </div>

            {/* Mobile: event title/date */}
            <div className="w-full md:hidden flex flex-col items-center text-center">
              <h2 className="text-white text-xl font-serif drop-shadow-lg tracking-wide">
                {eventData?.EVENT || "Loading event..."}
              </h2>
              {eventData?.DATE && (
                <p className="text-white/90 text-xs font-medium drop-shadow-md mt-0.5">
                  {formatEventDate(eventData.DATE)}
                </p>
              )}
            </div>

            {/* Desktop: more compact */}
            <div className="hidden md:flex md:w-[55%] flex-col items-start">
              <h2 className="text-white text-2xl md:text-3xl font-serif drop-shadow-lg tracking-wide text-left">
                {eventData?.EVENT || "Loading event..."}
              </h2>
              {eventData?.DATE && (
                <p className="text-white/90 text-xs md:text-sm font-medium drop-shadow-md text-left mt-0.5">
                  {formatEventDate(eventData.DATE)}
                </p>
              )}
            </div>

            <div className="hidden md:flex md:w-[35%] flex-col items-end">
              <div className="flex flex-col items-center w-full">
                <button
                  type="button"
                  onClick={handleLogoClick}
                  className="cursor-pointer flex justify-center w-full"
                >
                  <img
                    src="/images/swift_lore.png"
                    alt="Swift Lore"
                    className="h-auto object-contain max-h-[80px] md:max-h-[100px] logo-glow"
                    style={{ maxWidth: "180px" }}
                  />
                </button>

                <div className="flex gap-2 mt-2 justify-center w-full">
                  <button
                    onClick={() => navigate("/")}
                    className="bg-white/90 text-[#8e3e3e] hover:bg-white rounded-full px-4 py-1 text-sm font-medium shadow-sm border border-white/70 transition-all whitespace-nowrap"
                  >
                    Return to Home
                  </button>
                  <button
                    onClick={() => navigate("/posts")}
                    className="bg-white/90 text-[#8e3e3e] hover:bg-white rounded-full px-4 py-1 text-sm font-medium shadow-sm border border-white/70 transition-all whitespace-nowrap"
                  >
                    View Full Timeline
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* =============== HOME / ERAS / OTHER PAGES HERO HEADER =============== */}
        {!isFullTimelinePage && !isEventPage && (
          <>
            {/* Centered logo banner - MORE COMPACT */}
            <div className="w-full flex flex-col items-center relative z-20 overflow-visible">
              <button
                type="button"
                onClick={handleLogoClick}
                className="w-full max-w-[700px] cursor-pointer relative -mt-1 md:-mt-2"
              >
                {/* Smaller decorative stars */}
                <span className="absolute left-6 md:left-8 top-6 md:top-8 text-white/70 text-lg md:text-2xl twinkle">
                  ✨
                </span>
                <span className="absolute right-8 md:right-12 top-4 md:top-6 text-white/70 text-xl md:text-3xl twinkle">
                  ✨
                </span>
                <span className="absolute right-16 md:right-24 bottom-6 md:bottom-8 text-white/70 text-base md:text-xl twinkle">
                  ✨
                </span>

                {/* Smaller logo */}
                <img
                  src="/images/swift_lore.png"
                  alt="Swift Lore"
                  className="w-full h-auto object-contain max-h-[140px] md:max-h-[160px] logo-glow"
                />
              </button>
            </div>

            {/* Home / Eras hero content - more compact */}
            {showHero && (
              <div className="w-full md:w-2/5 flex flex-col items-center md:items-start gap-2 text-center md:text-left relative z-20">
                <div className="w-full max-w-xs">
                  <form onSubmit={handleSearch} className="relative">
                    <input
                      type="text"
                      placeholder="Search events, locations, categories..."
                      value={searchQuery}
                      onChange={handleInputChange}
                      onKeyPress={handleKeyPress}
                      className="w-full rounded-full py-1.5 pl-6 pr-4 text-sm bg-white/90 text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#fbb1c3]"
                    />
                  </form>
                </div>

                {/* More compact CTA row */}
                <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-2">
  {/* Home button – always available on these hero pages */}
  <button
    className="bg-[#b66b6b] text-white hover:bg-[#a55e5e] rounded-full px-4 py-1.5 font-semibold text-xs w-full sm:w-auto shadow-sm transition-colors whitespace-nowrap"
    onClick={() => navigate("/")}
  >
    Home
  </button>

  {/* Full Timeline */}
  <button
    className="bg-[#b66b6b] text-white hover:bg-[#a55e5e] rounded-full px-4 py-1.5 font-semibold text-xs w-full sm:w-auto shadow-sm transition-colors whitespace-nowrap"
    onClick={() => navigate("/posts")}
  >
    View Full Timeline
  </button>

  {/* Eras Tour Shows – hide on the Eras page itself */}
  {!isErasPage && (
    <button
      className="bg-[#b66b6b] text-white hover:bg-[#a55e5e] rounded-full px-4 py-1.5 font-semibold text-xs w-full sm:w-auto shadow-sm transition-colors whitespace-nowrap"
      onClick={() => navigate("/eras-tour-shows")}
    >
      Eras Tour Shows
    </button>
  )}
</div>
              </div>
            )}
          </>
        )}
      </div>
    </header>
  );
}
