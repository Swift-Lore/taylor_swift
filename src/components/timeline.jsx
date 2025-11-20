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
  const [isLoading, setIsLoading] = useState(true)

  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1)
  const [currentDay, setCurrentDay] = useState(today.getDate())

  const displayDate = new Date(2020, currentMonth - 1, currentDay)

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
        setIsLoading(true)
        const fetched = await fetchByDate()
        setRecords(fetched)
        console.log("Fetched records:", fetched)
      } catch (error) {
        console.error("Error fetching records:", error)
        setRecords([])
      } finally {
        setIsLoading(false)
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

  // ===== Card component =====
  const TimelineCard = ({ record, index }) => {

    const handleTagClick = (e, keyword) => {
      e.preventDefault()
      e.stopPropagation()
      navigate(`/posts?keyword=${encodeURIComponent(keyword)}`)
    }

    return (
      <Link
        to={`/post_details?id=${record.id}`}
        className="block relative cursor-pointer hover:opacity-95 transition-opacity"
        style={{ marginTop: index === 0 ? "17px" : "43px" }}
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

                {/* Notes with line breaks */}
{record?.fields?.NOTES && (
  <div className="text-xs md:text-sm text-center font-medium text-gray-700 leading-relaxed whitespace-pre-line">
    {record.fields.NOTES}
  </div>
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
  <section className="w-full bg-[#e8ecf7] py-2 px-2 md:px-10 flex flex-col min-h-0">
    <div className="container mx-auto flex flex-col min-h-0 flex-1">
      {/* Homepage Intro for SEO / AdSense */}
<div className="max-w-3xl mx-auto text-center mt-4 mb-6 px-4">
  <h2 className="text-2xl md:text-3xl font-serif text-[#8e3e3e] mb-3">
    Swift Lore: Explore Taylor Swift’s Complete Career Timeline
  </h2>

  <p className="text-[#6b7db3] text-sm md:text-base leading-relaxed">
    A fan-crafted, interactive archive chronicling Taylor Swift’s life,
    releases, and iconic moments. Dive into albums, performances, easter eggs,
    and the evolution of her artistry, all in one place.
  </p>
</div>

      {/* On This Day Section - simplified */}
      <div className="text-center mb-2 flex-shrink-0">
        <div className="relative w-full mb-2 md:mb-3 px-2 md:px-5">
          <div className="relative w-full px-2 md:px-3 py-2.5 md:py-5 bg-[#e8eef9]">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-lg sm:text-xl md:text-2xl lg:text-5xl font-serif text-[#8e3e3e] text-center">
  <span className="block">ON THIS DAY</span>
  <span className="text-base sm:text-sm md:text-xl lg:text-2xl block mt-1">
    across Taylor’s eras
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
{/* Supporting paragraph below header */}
<div className="max-w-2xl mx-auto mt-2 mb-3 px-4 text-center">
  <p className="text-[#6b7db3] text-sm md:text-base leading-relaxed">
    Each day in Taylor’s career has a story. Explore everything that happened
    on this day across years: releases, performances, interviews, and more.
  </p>
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

      {/* Event Counter - simplified */}
      <div className="flex justify-center mb-2 flex-shrink-0">
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

      {/* Timeline Section - THIS IS THE KEY PART */}
      <div className="flex-1 min-h-0 relative">
        
        {/* Mobile Timeline - NO FIXED HEIGHT */}
        <div className="md:hidden h-auto min-h-0 overflow-y-auto mobile-timeline-container">
          <div className="relative flex justify-center py-2">
            {/* Center line */}
            <div className="relative w-[2px] flex flex-col items-center bg-[#e8ecf7]">
              <div className="h-full w-[3px] bg-[#8a9ad4] min-h-[200px]"></div>

              <div className="absolute left-1/2 -translate-x-1/2 top-[0px] w-4 h-4 rounded-full bg-[#6B78B4]"></div>
              {records.slice(1, 5).map((_, index) => (
                <div
                  key={`mobile-circle-${index}`}
                  className="absolute left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-[#FEE6E3] border-2 border-[#6B78B4]"
                  style={{ top: `${120 + index * 120}px` }}
                ></div>
              ))}
              <div className="absolute left-1/2 -translate-x-1/2 bottom-4 w-4 h-4 rounded-full bg-[#6B78B4]"></div>
            </div>

            {/* Mobile Timeline Items */}
            <div className="absolute left-[17px] w-[calc(100%-26px)] space-y-6 pb-3">
              {records.map((record, index) => (
                <TimelineCard key={`mobile-${record.id}`} record={record} index={index} />
              ))}
            </div>
          </div>

          {/* Scroll hint */}
          {showScrollHint && records.length > 2 && (
            <div className="scroll-hint bottom-0">
              <div className="scroll-blur"></div>
              <span className="scroll-text">Scroll down</span>
            </div>
          )}
        </div>

        {/* Desktop Timeline */}
        <div className="hidden md:block min-h-0">
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
      <div className="flex justify-center mt-2 mb-2 flex-shrink-0">
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