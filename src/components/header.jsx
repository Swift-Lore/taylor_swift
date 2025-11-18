"use client"

import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"

export default function Header() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchQuery, setSearchQuery] = useState("")
  const [eventData, setEventData] = useState(null)

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

  // Fetch event data when on event page
  useEffect(() => {
    if (isEventPage) {
      const searchParams = new URLSearchParams(location.search)
      const postId = searchParams.get("id")
      
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
            )
            
            if (response.ok) {
              const data = await response.json()
              setEventData(data.fields)
            }
          } catch (error) {
            console.error("Error fetching event data for header:", error)
          }
        }
        
        fetchEventData()
      }
    }
  }, [isEventPage, location.search])

  // Safe date formatting function
  const formatEventDate = (isoDate) => {
    if (!isoDate) return ""
    
    try {
      const d = new Date(isoDate)
      if (Number.isNaN(d.getTime())) return ""

      const month = d.toLocaleString("en-US", {
        month: "short",
        timeZone: "UTC",
      })
      const day = String(d.getUTCDate()).padStart(2, "0")
      const year = d.getUTCFullYear()

      return `${month}-${day}-${year}`
    } catch (error) {
      console.error("Error formatting date:", error)
      return ""
    }
  }

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
      <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 pt-4 md:pt-5 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6 relative">
        {/* Decorative glow */}
        <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 md:left-12 md:translate-x-0 w-52 h-52 blur-3xl bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.9),_rgba(148,163,233,0))] opacity-80" />

        {/* Logo section - larger and centered */}
        <div className="w-full md:w-[70%] flex flex-col items-center md:items-start relative z-20 overflow-visible">
          <button
            type="button"
            onClick={handleLogoClick}
            className="w-full max-w-[800px] cursor-pointer relative -mt-2 md:-mt-4"
          >
            {/* sparkles around the logo */}
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

          {/* Navigation buttons - under logo */}
          {!showHero && (
            <div className="flex flex-wrap justify-center gap-3 mt-3 md:mt-4">
              <button
                onClick={() => navigate("/")}
                className="bg-white/90 text-[#8e3e3e] hover:bg-white rounded-full px-5 py-1.5 text-sm font-medium shadow-md border border-white/70 transition-all"
              >
                Return to Home
              </button>
              <button
                onClick={() => navigate("/posts")}
                className="bg-white/90 text-[#8e3e3e] hover:bg-white rounded-full px-5 py-1.5 text-sm font-medium shadow-md border border-white/70 transition-all"
              >
                View Full Timeline
              </button>
            </div>
          )}
        </div>

        {/* Event page header - shows event title and date */}
        {isEventPage && (
          <div className="w-full md:w-[30%] flex flex-col items-center md:items-end gap-2 mt-2 mb-2 px-4">
            {/* Event title */}
            <h2 className="text-white text-xl md:text-2xl font-serif drop-shadow-lg tracking-wide text-center md:text-right leading-tight">
              {eventData?.EVENT || "Loading event..."}
            </h2>
            
            {/* Event date */}
            {eventData?.DATE && (
              <p className="text-white/90 text-sm md:text-base font-medium drop-shadow-md text-center md:text-right">
                {formatEventDate(eventData.DATE)}
              </p>
            )}
          </div>
        )}

        {/* Full timeline page header */}
        {isFullTimelinePage && !isEventPage && (
          <div className="w-full md:w-[30%] flex flex-col items-center md:items-end gap-2 mt-2 mb-2 px-4">
            {/* Larger, more elegant title */}
            <h2 className="text-white text-2xl md:text-3xl font-serif drop-shadow-lg tracking-wide text-center md:text-right">
              Taylor Swift's Career Timeline
            </h2>
          </div>
        )}

        {/* Blurb + search + CTA — only show on home */}
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
              onClick={() => navigate("/posts")}
            >
              View Full Timeline
            </button>
          </div>
        )}
      </div>
    </header>
  )
}