"use client"

import { ChevronLeft, ChevronRight, Calendar, Star, Zap, Clock } from "lucide-react"
import { Button } from "./ui/Button"
import { useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import axios from "axios"

import "./timeline.css"

export default function Timeline() {
  const navigate = useNavigate()
  const [showScrollHint, setShowScrollHint] = useState(true)
  const [records, setRecords] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCalendar, setShowCalendar] = useState(false)
  const [dateEventsMap, setDateEventsMap] = useState({})

  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1)
  const [currentDay, setCurrentDay] = useState(today.getDate())

  const displayDate = new Date(2020, currentMonth - 1, currentDay)

  // Calendar state - use actual current year
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth())
  const [calendarYear, setCalendarYear] = useState(today.getFullYear())

  // ===== Calendar Functions =====
  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month, 1).getDay()
  }

  const generateCalendar = () => {
    const daysInMonth = getDaysInMonth(calendarMonth, calendarYear)
    const firstDay = getFirstDayOfMonth(calendarMonth, calendarYear)
    const calendar = []

    // Add empty cells for days before the first day of month
    for (let i = 0; i < firstDay; i++) {
      calendar.push(null)
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      calendar.push(i)
    }

    return calendar
  }

  const handleDateSelect = (day) => {
    if (day) {
      setCurrentMonth(calendarMonth + 1)
      setCurrentDay(day)
      setShowCalendar(false)
    }
  }

  const navigateCalendarMonth = (direction) => {
    if (direction === 'prev') {
      if (calendarMonth === 0) {
        setCalendarMonth(11)
        setCalendarYear(calendarYear - 1)
      } else {
        setCalendarMonth(calendarMonth - 1)
      }
    } else {
      if (calendarMonth === 11) {
        setCalendarMonth(0)
        setCalendarYear(calendarYear + 1)
      } else {
        setCalendarMonth(calendarMonth + 1)
      }
    }
  }

  const jumpToToday = () => {
    const today = new Date()
    setCurrentMonth(today.getMonth() + 1)
    setCurrentDay(today.getDate())
    setCalendarMonth(today.getMonth())
    setCalendarYear(today.getFullYear())
    setShowCalendar(false)
  }

  const jumpToThisMonth = () => {
    const today = new Date()
    setCalendarMonth(today.getMonth())
    setCalendarYear(today.getFullYear())
  }

  const hasEvents = (day) => {
    const dateKey = `${calendarYear}-${calendarMonth + 1}-${day}`
    return dateEventsMap[dateKey]
  }

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  // ===== Enhanced Calendar Modal =====
  const CalendarModal = () => {
    if (!showCalendar) return null

    const calendarDays = generateCalendar()

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 animate-in fade-in-zoom-in-95">
          {/* Quick Actions Bar */}
          <div className="flex gap-2 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={jumpToToday}
              className="flex-1 text-xs py-1 h-auto"
            >
              <Clock size={12} className="mr-1" />
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={jumpToThisMonth}
              className="flex-1 text-xs py-1 h-auto"
            >
              <Zap size={12} className="mr-1" />
              This Month
            </Button>
          </div>

          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateCalendarMonth('prev')}
              className="p-2 hover:bg-[#f8d7da] transition-colors"
            >
              <ChevronLeft size={18} className="text-[#8e3e3e]" />
            </Button>
            
            <div className="text-lg font-semibold text-[#8e3e3e] flex items-center gap-2">
              <Star size={16} className="text-[#ffd700]" fill="#ffd700" />
              {monthNames[calendarMonth]} {calendarYear}
              <Star size={16} className="text-[#ffd700]" fill="#ffd700" />
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateCalendarMonth('next')}
              className="p-2 hover:bg-[#f8d7da] transition-colors"
            >
              <ChevronRight size={18} className="text-[#8e3e3e]" />
            </Button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map(day => (
              <div key={day} className="text-center text-xs font-semibold text-[#6b7db3] py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => (
              <button
  key={index}
  onClick={() => handleDateSelect(day)}
  disabled={!day}
  className={`
    relative h-8 rounded-lg text-sm font-medium transition-all
    transform hover:scale-105 active:scale-95
    ${!day ? 'invisible' : ''}
    ${
      day === currentDay && (calendarMonth + 1) === currentMonth
        ? 'bg-[#8e3e3e] text-white shadow-md scale-105'
        : 'bg-white/80 text-[#8e3e3e] hover:bg-[#f8d7da]'
    }
    ${
      hasEvents(day)
        ? 'border-2 border-[#e3b0b0]'
        : 'border border-transparent'
    }
  `}
>
  {day}
  {/* Event indicator dot */}
  {hasEvents(day) && (
    <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#8e3e3e] rounded-full"></div>
  )}
</button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-center mt-4">
            <Button
              variant="secondary"
              onClick={() => setShowCalendar(false)}
              className="rounded-full px-6 flex-1"
            >
              Close
            </Button>
            <Button
              onClick={jumpToToday}
              className="rounded-full px-6 flex-1 bg-[#8e3e3e] hover:bg-[#7a3434]"
            >
              Go to Today
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ===== Existing Functions =====
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

  // ===== Pre-fetch events for calendar indicators =====
  useEffect(() => {
    const fetchEventsForMonth = async (month, year) => {
      try {
        const response = await axios.get(
          "https://api.airtable.com/v0/appVhtDyx0VKlGbhy/Taylor%20Swift%20Master%20Tracker",
          {
            headers: {
              Authorization: `Bearer ${import.meta.env.VITE_AIRTABLE_API_KEY}`,
            },
            params: {
              filterByFormula: `AND(MONTH(DATE) = ${month}, YEAR(DATE) = ${year})`,
              fields: ["DATE"],
            },
          }
        )
        
        // Create a map of dates that have events
        const eventsMap = {}
        response.data.records?.forEach(record => {
          if (record.fields.DATE) {
            const date = new Date(record.fields.DATE)
            const dateKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
            eventsMap[dateKey] = true
          }
        })
        
        setDateEventsMap(prev => ({ ...prev, ...eventsMap }))
      } catch (error) {
        console.error("Error fetching calendar events:", error)
      }
    }

    if (showCalendar) {
      fetchEventsForMonth(calendarMonth + 1, calendarYear)
    }
  }, [calendarMonth, calendarYear, showCalendar])

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
    const [isSelectingText, setIsSelectingText] = useState(false)

    const handleTagClick = (e, keyword) => {
      e.preventDefault()
      e.stopPropagation()
      navigate(`/posts?keyword=${encodeURIComponent(keyword)}`)
    }

    const handleCardClick = () => {
      if (!isSelectingText) {
        navigate(`/post_details?id=${record.id}`)
      }
      setIsSelectingText(false)
    }

    const handleMouseDown = (e) => {
      const isTextElement = e.target.closest('.timeline-card-text h3') || 
                           e.target.closest('.timeline-card-text div:not(.keyword-container)')
      if (isTextElement) {
        setIsSelectingText(false)
      }
    }

    const handleMouseUp = (e) => {
      const selection = window.getSelection()
      if (selection.toString().length > 0) {
        setIsSelectingText(true)
      }
    }

    const formatDate = (dateString) => {
      if (!dateString) return "Loading..."
      const date = new Date(dateString)
      const options = {
        month: "short",
        day: "2-digit", 
        year: "numeric",
        timeZone: "UTC",
      }
      return date.toLocaleDateString("en-US", options)
    }

    return (
      <div
        className="block relative hover:opacity-95 transition-opacity timeline-card"
        style={{ marginTop: index === 0 ? "17px" : "43px" }}
        onClick={handleCardClick}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      >
        <div className="relative">
          <div className="bg-gradient-to-br from-[#fce0e0] to-[#f8d7da] rounded-[13px] shadow-lg border border-[#e8c5c8] p-1">
            <div className="bg-white/80 backdrop-blur-sm rounded-[10px] p-3 border border-[#f0d0d3]">
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 -translate-y-1/4 border border-[#8e3e3e] bg-white rounded-full px-3 py-1 text-sm text-[#8e3e3e] font-semibold shadow-md z-10 min-w-[150px] text-center">
                {formatDate(record?.fields?.DATE)}
              </div>

              <div className="flex flex-col gap-2.5 mt-1.5 timeline-card-text">
                <h3 className="text-[#8e3e3e] font-bold text-sm md:text-base leading-relaxed text-center">
                  {record?.fields?.EVENT || "Event description unavailable"}
                </h3>

                {record?.fields?.NOTES && (
                  <div className="text-xs md:text-sm text-center font-medium text-gray-700 leading-relaxed whitespace-pre-line">
                    {record.fields.NOTES}
                  </div>
                )}

                {record?.fields?.KEYWORDS && record.fields.KEYWORDS.length > 0 && (
                  <div className="flex flex-wrap gap-1 md:gap-1.5 justify-center keyword-container">
                    {record.fields.KEYWORDS.slice(0, 4).map((tag, tagIndex) => (
                      <button
                        key={tagIndex}
                        type="button"
                        className="bg-[#8a9ac7] text-white font-medium text-xs px-2 py-0.5 rounded-full whitespace-nowrap shadow-sm hover:bg-[#6b7db3] transition-colors"
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
      </div>
    )
  }

  // ===== JSX =====
  return (
    <section className="w-full bg-gradient-to-b from-[#3d2965] via-[#5e3f83] to-[#f7d7e3] py-6 px-2 md:px-10 flex flex-col min-h-0">
      <div className="container mx-auto flex flex-col min-h-0 flex-1">
        {/* Homepage Intro for SEO / AdSense */}
        <div className="max-w-3xl mx-auto mt-4 mb-8 px-4">
          <div className="bg-white/70 border border-[#e3d5dd] rounded-2xl shadow-sm px-5 py-4 md:px-8 md:py-5 text-center">
            <h2 className="text-xl md:text-2xl font-semibold text-[#8e3e3e] mb-2">
              Swift Lore: Explore Taylor Swift's Complete Career Timeline
            </h2>
            <p className="text-[#6b7db3] text-sm md:text-base leading-relaxed">
              A fan-crafted, interactive archive chronicling Taylor Swift's life,
              releases, and iconic moments. Dive into albums, performances, easter
              eggs, and the evolution of her artistry, all in one place.
            </p>
          </div>
        </div>

        {/* ON THIS DAY Section */}
        <div className="text-center mb-4 flex-shrink-0">
          <div className="relative w-full mb-3 md:mb-4 px-2 md:px-5">
  <div
    className="
      relative w-full px-4 md:px-6 py-4 md:py-5
      bg-white/10
      backdrop-blur-xl
      rounded-3xl
      border border-white/30
      shadow-[0_0_45px_rgba(255,255,255,0.35)]
    "
  >
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif text-[#ffe5f3]">
  <span className="block tracking-wide">ON THIS DAY</span>
  <span className="text-sm sm:text-base md:text-lg lg:text-xl block mt-1 text-[#fbd3f0]">
    across Taylor&apos;s eras
  </span>
</h2>

                <p className="mt-3 text-[#e3d4ff] text-xs sm:text-sm md:text-base leading-relaxed px-2">
  Each day in Taylor&apos;s career has a story. Explore everything that
  happened on this day across years: releases, performances,
  interviews, and more.
</p>
              </div>

              {/* Side stars */}
              <div className="pointer-events-none absolute left-1 sm:left-2 md:left-3 lg:left-7 top-1/2 -translate-y-1/2 opacity-70">
                <img
                  src="/images/star.png"
                  alt="Star"
                  className="w-[26px] h-[26px] sm:w-[34px] sm:h-[34px] md:w-[56px] md:h-[56px] lg:w-[72px] lg:h-[72px]"
                />
              </div>

              <div className="pointer-events-none absolute right-1 sm:right-2 md:right-3 lg:right-7 top-1/2 -translate-y-1/2 opacity-70">
                <img
                  src="/images/star.png"
                  alt="Star"
                  className="w-[26px] h-[26px] sm:w-[34px] sm:h-[34px] md:w-[56px] md:h-[56px] lg:w-[72px] lg:h-[72px]"
                />
              </div>
            </div>
          </div>

          {/* Date navigation - Calendar integrated into the bubble */}
          <div className="flex items-center justify-center gap-1 sm:gap-2 md:gap-3 mt-1 md:mt-2">
  <Button
    variant="secondary"
    className="rounded-full h-8 md:h-9 px-2 sm:px-3 md:px-4 text-[11px] sm:text-xs md:text-sm flex items-center gap-1 mr-1"
    onClick={handlePreviousDay}
  >
    <ChevronLeft size={12} />
    <span className="hidden sm:inline">Previous</span>
    <span className="sm:hidden">Prev</span>
  </Button>

  {/* Date bubble with calendar button integrated */}
  <div className="relative">
    <div className="bg-white rounded-full px-3 sm:px-5 md:px-6 py-1 md:py-1.5 min-w-[102px] sm:min-w-[136px] md:min-w-[170px] border border-[#b66b6b] flex items-center justify-center">
      <span className="text-[#8e3e3e] text-sm md:text-base font-medium">
        {displayDate.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
        })}
      </span>
    </div>
    {/* Calendar button positioned inside the bubble */}
    <button
      onClick={() => setShowCalendar(true)}
      className="absolute -right-2 top-1/2 -translate-y-1/2 bg-white rounded-full p-1 shadow-sm border border-[#b66b6b] hover:bg-[#f8d7da] transition-colors"
      title="Open calendar"
    >
      <Calendar size={14} className="text-[#8e3e3e]" />
    </button>
  </div>

  <Button
    variant="secondary"
    className="rounded-full h-8 md:h-9 px-2 sm:px-3 md:px-4 text-[11px] sm:text-xs md:text-sm flex items-center gap-1 ml-1"
    onClick={handleNextDay}
  >
    <span className="hidden sm:inline">Next</span>
    <span className="sm:hidden">Next</span>
    <ChevronRight size={12} />
  </Button>
</div>
        </div>

        {/* Event Counter */}
        <div className="flex justify-center mb-2 flex-shrink-0">
          <div className="bg-white rounded-full px-2 sm:px-3 md:px-4 py-1 border border-[#b66b6b] shadow-sm">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#8e3e3e] animate-pulse"></div>
              <span className="text-[#8e3e3e] text-xs md:text-sm font-medium">
                {isLoading
                  ? "Loading events..."
                  : `${records.length} ${
                      records.length === 1 ? "Event" : "Events"
                    } Found`}
              </span>
              <div className="w-1.5 h-1.5 rounded-full bg-[#8e3e3e] animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Timeline Section */}
        <div className="flex-1 min-h-0 relative">
          {/* Mobile Timeline */}
          <div className="md:hidden mt-2 space-y-6">
            {records.map((record, index) => (
              <TimelineCard
                key={`mobile-${record.id}`}
                record={record}
                index={index}
              />
            ))}
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
        
        {/* Calendar Modal */}
        <CalendarModal />
      </div>
    </section>
  )
}