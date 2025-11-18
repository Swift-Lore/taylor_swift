"use client"

import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"

export default function Header() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchQuery, setSearchQuery] = useState("")

  // 👇 determine if we’re on the full timeline page
  const isFullTimelinePage = location.pathname === "/posts"

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search)
    const queryFromUrl = urlParams.get("q")
    if (queryFromUrl) {
      setSearchQuery(queryFromUrl)
    } else {
      // if no q param, clear out the search box
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

  const handleInputChange = (e) => {
    setSearchQuery(e.target.value)
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch(e)
    }
  }

  const handleLogoClick = () => {
    setSearchQuery("")
    navigate("/")
  }

  return (
    <header className="relative w-full bg-gradient-to-b from-[#9fa8f5] via-[#8a9ad4] to-[#e8ecf7] pb-6 md:pb-10 shadow-[0_10px_40px_rgba(75,85,160,0.4)] fade-in-up overflow-visible z-10">
      <div className="max-w-5xl mx-auto px-3 sm:px-4 md:px-6 pt-4 md:pt-6 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-4 relative">
        {/* Decorative background glow behind logo */}
        <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 md:left-16 md:translate-x-0 w-64 h-64 blur-3xl bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.9),_rgba(148,163,233,0))] opacity-80" />

        {/* Logo section */}
        <div className="w-full md:w-[55%] flex justify-center md:justify-start relative z-20 overflow-visible">
          <button
            type="button"
            onClick={handleLogoClick}
            className="w-full max-w-[520px] md:max-w-[640px] cursor-pointer -mt-6 md:-mt-10 relative"
          >
            <span className="absolute right-10 md:right-16 top-6 md:top-10 text-white/80 text-xl md:text-2xl twinkle">
              ✨
            </span>

            <img 
  src="/images/swift_lore.png" 
  alt="Swift Lore" 
  className="w-full h-auto object-contain min-h-[250px] max-h-[250px] md:min-h-[260px] md:max-h-[260px] logo-glow"
/>
          </button>
        </div>

        {/* Right side: blurb + search + CTA */}
        <div className="w-full md:w-2/5 flex flex-col items-center md:items-start gap-3 md:gap-4 md:mt-2 text-center md:text-left relative z-20">
          <div className="w-full max-w-xs md:max-w-sm bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 px-4 py-3 md:px-5 md:py-4 shadow-[0_14px_45px_rgba(15,23,42,0.35)]">
            <p className="text-white text-[11px] md:text-[13px] leading-snug md:leading-relaxed">
              A fan-crafted, interactive timeline chronicling the epic life and
              career of Taylor Swift. Explore everything from album releases and
              Easter Eggs to dating history and iconic moments.
              <span className="font-semibold"> Dive into the lore!</span>
            </p>
          </div>

          {/* Search Bar */}
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
              {/* ... search icons/buttons unchanged ... */}
            </form>
          </div>

          {/* CTA button: changes per page */}
          <button
            className="bg-[#b66b6b] text-white hover:bg-[#a55e5e] rounded-full px-4 md:px-5 py-1.5 md:py-2 font-semibold text-[11px] md:text-[13px] w-40 md:w-auto shadow-[0_10px_30px_rgba(88,28,135,0.45)] transition-transform hover:-translate-y-0.5"
            onClick={() => {
              if (isFullTimelinePage) {
                navigate("/")      // on full timeline → go home
              } else {
                navigate("/posts") // on home → go to full timeline
              }
            }}
          >
            {isFullTimelinePage ? "Return to Home" : "View Full Timeline"}
          </button>
        </div>
      </div>
    </header>
  )
}
