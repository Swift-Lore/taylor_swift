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
    <header className="relative w-full bg-gradient-to-b from-[#9fa8f5] via-[#8a9ad4] to-[#e6edf7] pb-2 md:pb-3 shadow-[0_10px_40px_rgba(75,85,160,0.4)] overflow-visible z-10">
      {/* Compact decorative glow */}
      <div className="pointer-events-none absolute -top-4 left-1/2 -translate-x-1/2 md:left-12 md:translate-x-0 w-40 h-40 blur-2xl bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.9),_rgba(148,163,233,0))] opacity-80" />

      <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 pt-3 md:pt-4 flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4 relative">
        
        {/* Logo section - larger logo with minimal spacing */}
        <div className="w-full flex flex-col items-center relative z-20">
          <button
            type="button"
            onClick={handleLogoClick}
            className="w-full max-w-[600px] cursor-pointer relative"
          >
            {/* Sparkles */}
            <span className="absolute left-4 top-2 text-white/80 text-xl twinkle">
              ✨
            </span>
            <span className="absolute right-6 top-2 text-white/80 text-2xl twinkle">
              ✨
            </span>
            <span className="absolute right-12 bottom-2 text-white/80 text-lg twinkle">
              ✨
            </span>

            <img
              src="/images/swift_lore.png"
              alt="Swift Lore"
              className="w-full h-auto object-contain max-h-[160px] md:max-h-[180px]" // Much larger logo
            />
          </button>

          {/* Navigation buttons - minimal spacing */}
          {!showHero && (
            <div className="flex flex-wrap justify-center gap-2 mt-1 w-full">
              {(isFullTimelinePage || isEventPage) && (
                <button
                  onClick={() => navigate("/")}
                  className="bg-white/90 text-[#8e3e3e] hover:bg-white rounded-full px-4 py-1 text-sm font-medium shadow border border-white/70 transition-all whitespace-nowrap" // Added whitespace-nowrap
                >
                  Return to Home
                </button>
              )}
              
              {isEventPage && (
                <button
                  onClick={() => navigate("/posts")}
                  className="bg-white/90 text-[#8e3e3e] hover:bg-white rounded-full px-4 py-1 text-sm font-medium shadow border border-white/70 transition-all whitespace-nowrap" // Added whitespace-nowrap
                >
                  View Full Timeline
                </button>
              )}
            </div>
          )}
        </div>

        {/* Event page header */}
        {isEventPage && (
          <div className="w-full md:w-[30%] flex flex-col items-center md:items-end gap-1 mt-0 px-2">
            <h2 className="text-white text-lg md:text-xl font-serif drop-shadow-lg tracking-wide text-center md:text-right leading-tight">
              {eventData?.EVENT || "Loading event..."}
            </h2>
            
            {eventData?.DATE && (
              <p className="text-white/90 text-xs md:text-sm font-medium drop-shadow-md text-center md:text-right">
                {formatEventDate(eventData.DATE)}
              </p>
            )}
          </div>
        )}

        {/* Full timeline page header */}
        {isFullTimelinePage && !isEventPage && (
          <div className="w-full md:w-[30%] flex flex-col items-center md:items-end gap-1 mt-0 px-2">
            <h2 className="text-white text-xl md:text-2xl font-serif drop-shadow-lg tracking-wide text-center md:text-right">
              Taylor Swift's Career Timeline
            </h2>
          </div>
        )}

        {/* Home page content */}
        {showHero && (
          <div className="w-full md:w-2/5 flex flex-col items-center md:items-start gap-3 text-center md:text-left relative z-20">
            <div className="w-full max-w-xs bg-white/10 backdrop-blur-md rounded-xl border border-white/20 px-4 py-3 shadow">
              <p className="text-white text-sm leading-relaxed"> {/* Larger text */}
                A fan-crafted, interactive timeline chronicling the epic life and
                career of Taylor Swift. Explore everything from album releases and
                Easter Eggs to dating history and iconic moments.
                <span className="font-semibold"> Dive into the lore!</span>
              </p>
            </div>

            {/* Search */}
            <div className="w-full max-w-xs">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  placeholder="Search events, locations, categories..."
                  value={searchQuery}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  className="w-full rounded-full py-2 pl-7 pr-4 text-sm bg-white/90 text-gray-800 shadow focus:outline-none focus:ring-2 focus:ring-[#fbb1c3]" // Larger input
                />
              </form>
            </div>

            {/* CTA - single line */}
            <button
              className="bg-[#b66b6b] text-white hover:bg-[#a55e5e] rounded-full px-5 py-2 font-semibold text-sm w-auto shadow transition-transform hover:-translate-y-0.5 whitespace-nowrap" // Added whitespace-nowrap
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