"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "./ui/Button"
import { useNavigate, Link } from "react-router-dom"
import { useEffect, useState } from "react"
import axios from "axios"

import "./timeline.css"

export default function Timeline() {
  const navigate = useNavigate()
  const [showScrollHint, setShowScrollHint] = useState(true)
  const [records, setRecords] = useState([])
  const [screenScale, setScreenScale] = useState(1)
  const [isLoading, setIsLoading] = useState(true)   // 👈 NEW

  // Use the visitor's *local* date for "today"
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1)
  const [currentDay, setCurrentDay] = useState(today.getDate())

  // Dummy year just for pretty label between Prev/Next
  const displayDate = new Date(2020, currentMonth - 1, currentDay)

  // ===== dynamic scale =====
  useEffect(() => {
    const calculateScale = () => {
      const screenWidth = window.screen.width
      const screenHeight = window.screen.height
      const pixelDensity = window.devicePixelRatio || 1

      const effectiveWidth = screenWidth * pixelDensity
      const effectiveHeight = screenHeight * pixelDensity

      console.log(
        `Screen: ${screenWidth}x${screenHeight}, Pixel Density: ${pixelDensity}, Effective: ${effectiveWidth}x${effectiveHeight}`
      )

      let scale = 1

      if (effectiveWidth >= 5120) {
        scale = 0.51
      } else if (effectiveWidth >= 3840) {
        scale = 0.55
      } else if (effectiveWidth >= 2560) {
        scale = 0.6
      } else if (effectiveWidth >= 1920) {
        scale = 0.72
      } else if (effectiveWidth >= 1440) {
        scale = 0.77
      } else {
        scale = 0.85
      }

      const viewportWidth = window.innerWidth
      if (viewportWidth >= 1536) {
        scale *= 0.81
      } else if (viewportWidth >= 1280) {
        scale *= 0.85
      } else if (viewportWidth >= 1024) {
        scale *= 0.89
      }

      console.log(`Applied scale: ${scale}`)
      setScreenScale(scale)
    }

    calculateScale()

    const handleResize = () => {
      setTimeout(calculateScale, 100)
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // ===== prev / next day =====
  const handleNextDay = () => {
    const currentDate = new Date(2020, currentMonth - 1, currentDay)
    currentDate.setDate(currentDate.getDate() + 1)
    setCurrentMonth(currentDate.getMonth() + 1)
    setCurrentDay(currentDate.getDate())
  }

  const handlePreviousDay = () => {
    const currentDate = new Date(2020, currentMonth - 1, currentDay)
    currentDate.setDate(currentDate.getDate() - 1)
    setCurrentMonth(currentDate.getMonth() + 1)
    setCurrentDay(currentDate.getDate())
  }

  // ===== Airtable fetch =====
  useEffect(() => {
    const fetchRecordsByDate = async (month, day) => {
      const fetchByDate = async () => {
        const response = await axios.get(
          "https://api.airtable.com/v0/appVhtDyx0VKlGbhy/Taylor%20Swift%20Master%20Tracker",
          {
            headers: {
              Authorization: `Bearer ${import.meta.env.VITE_AIRTABLE_API_KEY}`,
            },
            params: {
              filterByFormula: `AND(MONTH(DATE) = ${month}, DAY(DATE) = ${day})`,
              sort: [{ field: "DATE", direction: "desc" }],
            },
          }
        )
        return response.data.records || []
      }

      try {
        setIsLoading(true)                    // 👈 start loading
        const fetched = await fetchByDate()
        setRecords(fetched)
        console.log("Fetched records:", fetched)
      } catch (error) {
        console.error("Error fetching records:", error)
        setRecords([])                        // optional: clear on error
      } finally {
        setIsLoading(false)                   // 👈 done loading
      }
    }

    console.log("Fetching Airtable for:", currentMonth, currentDay)
    if (currentMonth && currentDay) {
      fetchRecordsByDate(currentMonth, currentDay)
    }
  }, [currentMonth, currentDay])

  // ===== scroll hint =====
  useEffect(() => {
    const timelineElement = document.querySelector(".mobile-timeline-container")

    const handleScroll = () => {
      if (timelineElement && timelineElement.scrollTop > 0) {
        setShowScrollHint(false)
      }
    }

    timelineElement?.addEventListener("scroll", handleScroll)
    return () => timelineElement?.removeEventListener("scroll", handleScroll)
  }, [])

  // ===== Card component (used for mobile & desktop) =====
  const TimelineCard = ({ record, index }) => {
    const navigate = useNavigate()

    // click on a tag = go to /posts?keyword=...
    const handleTagClick = (e, keyword) => {
      e.preventDefault() // don’t follow the card link
      e.stopPropagation()
      navigate(`/posts?keyword=${encodeURIComponent(keyword)}`)
    }

    // the whole card is now a <Link>, so right-click / cmd-click works
    return (
      <Link
        to={`/post_details?id=${record.id}`}
        className="block relative mt-[43px] cursor-pointer hover:opacity-95 transition-opacity"
        style={{ marginTop: index === 0 ? "17px" : "" }}
      >
        <div className="relative">
          <div className="bg-gradient-to-br from-[#fce0e0] to-[#f8d7da] rounded-[13px] shadow-lg border border-[#e8c5c8] p-1">
            <div className="bg-white/80 backdrop-blur-sm rounded-[10px] p-3 border border-[#f0d0d3]">
              {/* Date Badge */}
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 -translate-y-1/4 border border-[#8e3e3e] bg-white rounded-full px-3 py-1 text-sm text-[#8e3e3e] font-semibold shadow-md z-10 min-w-[150px] text-center">
                {record?.fields?.DATE
                  ? (() => {
                      const date = new Date(record.fields.DATE)
                      const options = {
                        month: "short",
                        day: "2-digit",
                        year: "numeric",
                        timeZone: "UTC",
                      }
                      return date.toLocaleDateString("en-US", options)
                    })()
                  : "Loading..."}
              </div>

              <div className="flex flex-col gap-2.5 mt-1.5">
                {/* Event Description */}
                <h3 className="text-[#8e3e3e] font-bold text-sm md:text-base leading-relaxed text-center">
                  {record?.fields?.EVENT || "Event description unavailable"}
                </h3>

                {/* Notes */}
                {record?.fields?.NOTES && (
                  <p className="text-xs md:text-sm text-center font-medium text-gray-700 leading-relaxed">
                    {record.fields.NOTES}
                  </p>
                )}

                {/* Keywords section with clickable tags */}
                {record?.fields?.KEYWORDS && record.fields.KEYWORDS.length > 0 && (
                  <div className="flex flex-wrap gap-1 md:gap-1.5 justify-center">
                    {record.fields.KEYWORDS.slice(0, 4).map((tag, tagIndex) => (
                      <button
                        key={tagIndex}
                        type="button"
                        className="bg-[#8a9ac7] text-white font-medium text-xs px-2 py-0.5 rounded-full whitespace-nowrap shadow-sm cursor-pointer hover:bg-[#6b7db3] transition-colors"
                        onClick={(e) => handleTagClick(e, tag)}
                      >
                        {tag}
                      </button>
                    ))}
                    {record.fields.KEYWORDS.length > 4 && (
                      <div className="bg-[#b8c5e8] text-[#8e3e3e] font-medium text-xs px-2 py-0.5 rounded-full">
                        +{record.fields.KEYWORDS.length - 4}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  // ===== JSX =====
  return (
    <section className="w-full bg-[#e8ecf7] py-3 md:py-7 px-2 md:px-10 flex-grow">
      <div className="container mx-auto h-full flex flex-col">
        {/* On This Day Section */}
        <div className="text-center mb-1 md:mb-3 transform translate-x-0 md:translate-x-[-19px]">
          <div className="relative w-full mb-2 md:mb-3 px-2 md:px-5">
            <div className="relative w-full px-2 md:px-3 py-2.5 md:py-5 bg-[#e8eef9]">
              <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-lg sm:text-xl md:text-2xl lg:text-5xl font-serif text-[#8e3e3e] text-center">
                  <span className="block">ON THIS DAY</span>
                  <span className="text-base sm:text-sm md:text-xl lg:text-2xl block mt-1">
                    in Taylor Swift's History
                  </span>
                </h2>
              </div>

              <div className="absolute left-1 sm:left-2 md:left-3 lg:left-7 top-1/2 transform -translate-y-1/2">
                <img
                  src="/images/star.png"
                  alt="Star"
                  className="w-[26px] h-[26px] sm:w-[34px] sm:h-[34px] md:w-[56px] md:h-[56px] lg:w-[85px] lg:h-[85px]"
                />
              </div>

              <div className="absolute right-1 sm:right-2 md:right-3 lg:right-7 top-1/2 transform -translate-y-1/2">
                <img
                  src="/images/star.png"
                  alt="Star"
                  className="w-[26px] h-[26px] sm:w-[34px] sm:h-[34px] md:w-[56px] md:h-[56px] lg:w-[85px] lg:h-[85px]"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-1 sm:gap-2 md:gap-3 my-2 md:my-3">
            <Button
              variant="secondary"
              className="rounded-full px-2 sm:px-3 md:px-5 text-xs sm:text-sm flex items-center gap-1 md:gap-2 mr-2.5"
              onClick={handlePreviousDay}
            >
              <ChevronLeft size={10} className="md:size-14" />
              <span className="hidden sm:inline">Previous Day</span>
              <span className="sm:hidden mr-1.5">Prev</span>
            </Button>

            <div className="bg-white rounded-full px-3 sm:px-5 md:px-7 py-1 md:py-1.5 min-w-[102px] sm:min-w-[136px] md:min-w-[170px] border border-[#b66b6b]">
              <span className="text-[#8e3e3e] text-sm md:text-base font-medium">
                {displayDate.toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>

            <Button
              variant="secondary"
              className="rounded-full px-2 sm:px-3 md:px-5 text-xs sm:text-sm flex items-center gap-1 md:gap-2 ml-2.5"
              onClick={handleNextDay}
            >
              <span className="hidden sm:inline">Next Day</span>
              <span className="sm:hidden ml-1.5">Next</span>
              <ChevronRight size={10} className="md:size-14" />
            </Button>
          </div>
        </div>

        {/* Event Counter */}
        <div className="flex justify-center transform translate-x-0 md:translate-x-[-9px]">
          <div className="bg-white rounded-full px-2 sm:px-3 md:px-4 py-1 border border-[#b66b6b] shadow-sm">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#8e3e3e] animate-pulse"></div>
              <span className="text-[#8e3e3e] text-xs md:text-sm font-medium">
                {isLoading
                  ? "Loading events..."
                  : `${records.length} ${records.length === 1 ? "Event" : "Events"} Found`}
              </span>
              <div className="w-1.5 h-1.5 rounded-full bg-[#8e3e3e] animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Timeline Section */}
        <div className="relative mt-5 md:mt-10 mb-3 md:mb-7 flex-grow">
          {/* Mobile Timeline (Single Column) */}
          <div className="md:hidden h-[60vh] overflow-y-auto relative mobile-timeline-container">
            <div className="relative flex justify-center">
              {/* Center line */}
              <div className="relative w-[2px] flex flex-col items-center bg-[#e8ecf7]">
                <div className="h-[1200px] w-[3px] bg-[#8a9ad4]"></div>

                <div className="absolute left-1/2 -translate-x-1/2 top-[0px] w-4 h-4 rounded-full bg-[#6B78B4]"></div>
                {records.slice(1, 5).map((_, index) => (
                  <div
                    key={`mobile-circle-${index}`}
                    className="absolute left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-[#FEE6E3] border-2 border-[#6B78B4]"
                    style={{ top: `${120 + index * 120}px` }}
                  ></div>
                ))}
                <div className="absolute left-1/2 -translate-x-1/2 top-[720px] w-4 h-4 rounded-full bg-[#6B78B4]"></div>
              </div>

              {/* Mobile Timeline Items */}
              <div className="absolute left-[17px] w-[calc(100%-26px)] space-y-[43px] pb-3">
                {records.map((record, index) => (
                  <TimelineCard key={`mobile-${record.id}`} record={record} index={index} />
                ))}
              </div>
            </div>

            {/* Scroll hint */}
            {showScrollHint && (
              <div className="scroll-hint bottom-0">
                <div className="scroll-blur"></div>
                <span className="scroll-text">Scroll down</span>
              </div>
            )}
          </div>

          {/* Desktop Timeline */}
          <div className="hidden md:block">
            <div className="relative flex justify-center">
              {/* Center line - spans full height */}
              <div className="absolute w-[2px] flex flex-col items-center h-full">
                <div className="w-[5px] bg-[#8a9ad4] h-full"></div>
                <div className="absolute left-1/2 -translate-x-1/2 top-0 w-7 h-7 rounded-full bg-[#6B78B4]"></div>
                <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-7 h-7 rounded-full bg-[#6B78B4]"></div>
              </div>

              {/* Desktop Timeline Items */}
              <div className="relative left-[37.5%] -translate-x-1/4 w-3/4">
                {records.map((record, index) => (
                  <div
                    key={`desktop-${record.id}`}
                    className="relative transition-all duration-300"
                    style={{
                      marginTop: index === 0 ? "0" : "50px",
                    }}
                  >
                    <div className="transform scale-[0.90] origin-top -translate-x-1/4">
                      <TimelineCard record={record} index={index} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* View Full Timeline Button */}
        <div className="flex justify-center mt-1 md:mt-3">
          <Button
            variant="secondary"
            className="rounded-full px-5 py-1.5 w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg"
            onClick={() => {
              navigate("/posts")
              window.scrollTo(0, 0)
            }}
          >
            View Full Timeline
          </Button>
        </div>
      </div>
    </section>
  )
}

