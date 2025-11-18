"use client"

import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"

export default function Header() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchQuery, setSearchQuery] = useState("")

  const isFullTimelinePage = location.pathname === "/posts"
const isEventPage = location.pathname === "/post_details"
const showHero = !isFullTimelinePage && !isEventPage

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search)
    const queryFromUrl = urlParams.get("q")
    if (queryFromUrl) {
      setSearchQuery(queryFromUrl)
    } else {
      setSearchQuery("")
    }
  }, [location.search])

  const handleSearch = (e) => {
    e.preventDefault()
    const trimmedQuery = searchQuery.trim()
    if (!trimmedQuery) {
      navigate("/")
      return
    }

    const formattedQuery =
      trimmedQuery.charAt(0).toUpperCase() + trimmedQuery.slice(1)

    navigate(`/?q=${encodeURIComponent(formattedQuery)}`)
  }

  const handleInputChange = (e) => setSearchQuery(e.target.value)

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSearch(e)
  }

  const handleLogoClick = () => {
    setSearchQuery("")
    navigate("/")
  }

  return (
    <header className="relative w-full bg-gradient-to-b from-[#9fa8f5] via-[#8a9ad4] to-[#e6edf7] pb-3 md:pb-5 shadow-[0_10px_40px_rgba(75,85,160,0.4)] fade-in-up overflow-visible z-10">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 pt-4 md:pt-5 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-4 relative">
        {/* Decorative glow */}
        <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 md:left-12 md:translate-x-0 w-52 h-52 blur-3xl bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.9),_rgba(148,163,233,0))] opacity-80" />

        {/* Logo section */}
        <div className="w-full md:w-[60%] flex justify-center md:justify-start relative z-20 overflow-visible">
          <button
            type="button"
            onClick={handleLogoClick}
            className="w-full max-w-[640px] md:max-w-[720px] cursor-pointer -mt-4 md:-mt-8 relative"
          >
            {/* sparkles around the logo */}
            <span className="absolute left-6 md:left-10 top-6 md:top-8 text-white/80 text-lg md:text-2xl twinkle">
              ✨
            </span>
            <span className="absolute right-8 md:right-14 top-4 md:top-6 text-white/80 text-xl md:text-3xl twinkle">
              ✨
            </span>
            <span className="absolute right-16 md:right-24 bottom-6 md:bottom-10 text-white/80 text-base md:text-xl twinkle">
              ✨
            </span>

            <img
              src="/images/swift_lore.png"
              alt="Swift Lore"
              className="w-full h-auto object-contain min-h-[270px] max-h-[270px] md:min-h-[290px] md:max-h-[290px] logo-glow"
            />
          </button>
        </div>

        {/* Blurb + search + CTA */}
        {showHero && (
        <div className="w-full md:w-2/5 flex flex-col items-center md:items-start gap-3 md:gap-3 md:mt-1 text-center md:text-left relative z-20">
          <div className="w-full max-w-xs md:max-w-sm bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 px-4 py-3 md:px-5 md:py-3 shadow-[0_14px_45px_rgba(15,23,42,0.35)]">
            <p className="text-white text-[11px] md:text-[13px] leading-snug md:leading-relaxed">
              A fan-crafted, interactive timeline chronicling the epic life and
              career of Taylor Swift. Explore everything from album releases and
              Easter Eggs to dating history and iconic moments.
              <span className="font-semibold"> Dive into the lore!</span>
            </p>
                  </div>
        )}


          {/* Search */}
          <div className="w-full max-w-xs md:max-w-sm">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Search events, locations, categories..."
                value={searchQuery}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                className="w-full rounded-full py-1.5 md:py-2 pl-7 md:pl-8 pr-6 text-[11px] md:text-[13px] bg-white/90 text-gray-800 shadow-[0_10px_30px_rgba(15,23,42,0.25)] focus:outline-none focus:ring-2 focus:ring-[#fbb1c3] focus:ring-offset-2 focus:ring-offset-[#8a9ad4]"
                inputMode="search"
                enterKeyHint="search"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
              />
            </form>
          </div>

          {/* CTA */}
          <button
            className="bg-[#b66b6b] text-white hover:bg-[#a55e5e] rounded-full px-4 md:px-5 py-1.5 md:py-2 font-semibold text-[11px] md:text-[13px] w-40 md:w-auto shadow-[0_10px_30px_rgba(88,28,135,0.45)] transition-transform hover:-translate-y-0.5"
            onClick={() => {
              if (isFullTimelinePage) navigate("/")
              else navigate("/posts")
            }}
          >
            {isFullTimelinePage ? "Return to Home" : "View Full Timeline"}
          </button>
        </div>
      </div>
    </header>
  )
}
