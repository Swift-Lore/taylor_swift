"use client";

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function Header({ showHero = true }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [eventData, setEventData] = useState(null);

  const currentPath = location.pathname;

  const isFullTimelinePage = currentPath === "/posts";
  const isEventPage = currentPath === "/post_details";
  const isHomeRoute = currentPath === "/" || currentPath === "/timeline";
  const isTimelineRoute = currentPath === "/posts";
  const isErasRoute = currentPath === "/eras-tour-shows";

  // hero only on true "home" route, not on posts or event pages
  const showHomeHero = showHero && isHomeRoute && !isEventPage;

  const navBaseClasses =
    "rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap border transition-all";
  const navActiveClasses =
    "bg-[#b66b6b] text-white border-[#b66b6b] shadow-md hover:bg-[#a55e5e] hover:-translate-y-0.5 transform";
  const navInactiveClasses =
    "bg-white/80 text-[#8e3e3e] border-white/70 hover:bg-white hover:shadow-md";

  // keep search bar in sync with ?q=
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const queryFromUrl = urlParams.get("q");
    if (queryFromUrl) {
      setSearchQuery(queryFromUrl);
    } else {
      setSearchQuery("");
    }
  }, [location.search]);

  // Fetch event data when on event page (for header title/date)
  useEffect(() => {
    if (!isEventPage) return;

    const searchParams = new URLSearchParams(location.search);
    const postId = searchParams.get("id");
    if (!postId) return;

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
  }, [isEventPage, location.search]);

  // Safe date formatting function
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
    <header className="relative w-full bg-gradient-to-b from-[#9fa8f5] via-[#8a9ad4] to-[#e6edf7] pb-2 md:pb-3 shadow-[0_10px_30px_rgba(75,85,160,0.35)] fade-in-up overflow-visible z-10">
      {/* Compact decorative glow */}
      <div className="pointer-events-none absolute -top-4 left-1/2 -translate-x-1/2 md:left-12 md:translate-x-0 w-40 h-40 blur-2xl bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.9),_rgba(148,163,233,0))] opacity-80" />

      <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 pt-4 md:pt-5 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6 relative">
        {/* ======================
            EVENT DETAIL HEADER
           ====================== */}
        {isEventPage && (
          <>
            {/* Mobile: logo + buttons */}
            <div className="w-full md:hidden flex flex-col items-center gap-4 mb-4">
              <button
                type="button"
                onClick={handleLogoClick}
                className="cursor-pointer"
              >
                <img
                  src="/images/swift_lore.png"
                  alt="Swift Lore"
                  className="h-auto object-contain max-h-[100px] logo-glow"
                  style={{ maxWidth: "180px" }}
                />
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => navigate("/")}
                  className="bg-white/90 text-[#8e3e3e] hover:bg-white rounded-full px-5 py-1.5 text-sm font-medium shadow-md border border-white/70 transition-all whitespace-nowrap"
                >
                  Return to Home
                </button>
                <button
                  onClick={() => navigate("/posts")}
                  className="bg-white/90 text-[#8e3e3e] hover:bg-white rounded-full px-5 py-1.5 text-sm font-medium shadow-md border border-white/70 transition-all whitespace-nowrap"
                >
                  View Full Timeline
                </button>
              </div>
            </div>

            {/* Mobile: event info */}
            <div className="w-full md:hidden flex flex-col items-center text-center">
              <h2 className="text-white text-2xl font-serif drop-shadow-lg tracking-wide">
                {eventData?.EVENT || "Loading event..."}
              </h2>
              {eventData?.DATE && (
                <p className="text-white/90 text-sm font-medium drop-shadow-md mt-1">
                  {formatEventDate(eventData.DATE)}
                </p>
              )}
            </div>

            {/* Desktop: left = event info, right = logo + buttons */}
            <div className="hidden md:flex md:w-[55%] flex-col items-start">
              <h2 className="text-white text-3xl md:text-4xl font-serif drop-shadow-lg tracking-wide text-left">
                {eventData?.EVENT || "Loading event..."}
              </h2>
              {eventData?.DATE && (
                <p className="text-white/90 text-sm md:text-base font-medium drop-shadow-md text-left mt-1">
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
                    className="h-auto object-contain max-h-[100px] md:max-h-[120px] logo-glow"
                    style={{ maxWidth: "200px" }}
                  />
                </button>
                <div className="flex gap-3 mt-3 justify-center w-full">
                  <button
                    onClick={() => navigate("/")}
                    className="bg-white/90 text-[#8e3e3e] hover:bg-white rounded-full px-5 py-1.5 text-sm font-medium shadow-md border border-white/70 transition-all whitespace-nowrap"
                  >
                    Return to Home
                  </button>
                  <button
                    onClick={() => navigate("/posts")}
                    className="bg-white/90 text-[#8e3e3e] hover:bg-white rounded-full px-5 py-1.5 text-sm font-medium shadow-md border border-white/70 transition-all whitespace-nowrap"
                  >
                    View Full Timeline
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ======================
            FULL TIMELINE HEADER
           ====================== */}
        {isFullTimelinePage && !isEventPage && (
          <>
            {/* Mobile: logo */}
            <div className="w-full md:hidden flex flex-col items-center gap-4">
              <button
                type="button"
                onClick={handleLogoClick}
                className="cursor-pointer"
              >
                <img
                  src="/images/swift_lore.png"
                  alt="Swift Lore"
                  className="h-auto object-contain max-h-[100px] logo-glow"
                  style={{ maxWidth: "180px" }}
                />
              </button>
            </div>

            {/* Mobile: text */}
            <div className="w-full md:hidden flex flex-col items-center mt-4">
              <h2 className="text-white text-2xl font-serif drop-shadow-lg tracking-wide text-center">
                Taylor Swift&apos;s Career Timeline
              </h2>
            </div>

            {/* Desktop: left = title, right = logo */}
            <div className="hidden md:flex md:w-[40%] flex-col items-start">
              <h2 className="text-white text-3xl md:text-4xl font-serif drop-shadow-lg tracking-wide text-left">
                Taylor Swift&apos;s Career Timeline
              </h2>
            </div>

            <div className="hidden md:flex md:w-[30%] flex-col items-end">
              <div className="flex justify-end w-full">
                <button
                  type="button"
                  onClick={handleLogoClick}
                  className="cursor-pointer flex justify-end"
                >
                  <img
                    src="/images/swift_lore.png"
                    alt="Swift Lore"
                    className="h-auto object-contain max-h-[100px] md:max-h-[120px] logo-glow"
                    style={{ maxWidth: "200px" }}
                  />
                </button>
              </div>
            </div>
          </>
        )}

        {/* ======================
            HOME / ERAS HEADER
           ====================== */}
        {showHomeHero && !isEventPage && !isFullTimelinePage && (
          <div className="w-full flex flex-col items-center relative z-20 overflow-visible">
            <button
              type="button"
              onClick={handleLogoClick}
              className="w-full max-w-[800px] cursor-pointer relative -mt-2 md:-mt-4"
            >
              <span className="absolute left-8 md:left-12 top-8 md:top-10 text-white/80 text-xl md:text-3xl twinkle">
                ✨
              </span>
              <span className="absolute right-10 md:right-16 top-6 md:top-8 text-white/80 text-2xl md:text-4xl twinkle">
                ✨
              </span>
              <span className="absolute right-20 md:right-28 bottom-8 md:bottom-12 text-white/80 text-lg md:text-2xl twinkle">
                ✨
              </span>

              <img
                src="/images/swift_lore.png"
                alt="Swift Lore"
                className="w-full h-auto object-contain max-h-[200px] md:max-h-[240px] logo-glow"
              />
            </button>
          </div>
        )}

        {/* Home page search bar */}
        {showHomeHero && (
          <div className="w-full md:w-1/2 flex flex-col items-center md:items-start gap-3 text-center md:text-left relative z-20">
            <div className="w-full max-w-lg">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  placeholder="Search events, locations, categories..."
                  value={searchQuery}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  className="w-full rounded-full py-2.5 pl-7 pr-4 text-sm bg-white/90 text-gray-800 shadow focus:outline-none focus:ring-2 focus:ring-[#fbb1c3]"
                />
              </form>
            </div>
          </div>
        )}

        {/* ======================
            GLOBAL NAV BUTTONS
           ====================== */}
        <nav className="w-full mt-4 mb-2">
          <div className="flex flex-wrap justify-center gap-2 md:gap-3">
            {/* Hide Home button on home page */}
            {!isHomeRoute && (
              <button
                onClick={handleLogoClick}
                className={`${navBaseClasses} ${
                  isHomeRoute ? navActiveClasses : navInactiveClasses
                }`}
              >
                Home
              </button>
            )}

            <button
              onClick={() => navigate("/posts")}
              className={`${navBaseClasses} ${
                isTimelineRoute ? navActiveClasses : navInactiveClasses
              }`}
            >
              Full Timeline
            </button>

            <button
              onClick={() => navigate("/eras-tour-shows")}
              className={`${navBaseClasses} ${
                isErasRoute ? navActiveClasses : navInactiveClasses
              }`}
            >
              Eras Tour Shows
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}
