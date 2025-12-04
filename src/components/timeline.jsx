"use client"

import { ChevronLeft, ChevronRight, Calendar, Star, Zap, Clock, HelpCircle } from "lucide-react"
import { Button } from "./ui/Button"
import { useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import axios from "axios"
import "./timeline.css"

// ===== Toronto Theory Alternate Timeline (helper) =====
// Anchor: REAL date  = Nov 22, 2024
//         ALT date   = Apr 25, 2019
const REAL_ANCHOR_DATE = new Date(2024, 10, 22) // month is 0-based → 10 = November
const ALT_ANCHOR_DATE  = new Date(2019, 3, 25)  // 3 = April
// ---- Holiday helpers shared by timeline + cards ----
const parseHolidayTags = (holidayTagsRaw) => {
  if (Array.isArray(holidayTagsRaw)) return holidayTagsRaw
  if (typeof holidayTagsRaw === "string") {
    return holidayTagsRaw
      .split(/[;,|]/)
      .map((tag) => tag.trim())
      .filter(Boolean)
  }
  return []
}

// Holidays we only want to show once at the top of the timeline
const FIXED_HOLIDAYS = new Set(
  [
    "New Year's Eve",
    "New Year's Day",
    "Sant Patrick's Day",      // matches your Airtable exactly
    "Austin Swift's Birthday",
    "Andrea Swift's Birthday",
    "Scott Swift's Birthday",
    "Taylor's Birthday",
    "National White Wine Day",
    "National Red Wine Day",
    "World Bread Day",
    "Olivia's Birthday",
    "Meredith's Birthday",
    "Benjamin's Birthday",
    "National French Fry Day",
    "Valentine's Day",
    "National Siblings Day",
    "National Cat Day",
    "International Cat Day",
    "Mean Girls Day",
    "Last Kiss Day",
    "High Infidelity Day",
    "International Women's Day",
    "International Dance Day",
    "Halloween",
    "Marjorie Finlay's Birthday",
    "Christmas Eve",
    "Christmas Day",
  ].map((s) => s.toLowerCase())
)

const isGlobalHolidayName = (holiday) => {
  if (!holiday) return false
  const name = holiday.trim().toLowerCase()
  return FIXED_HOLIDAYS.has(name)
}

// Map holiday names to emojis
const getHolidayEmoji = (holiday) => {
  const name = holiday.toLowerCase()

  // 🐱🎂 Taylor's cats (Meredith, Olivia, Benjamin)
  if (
    name.includes("meredith") ||
    name.includes("olivia") ||
    name.includes("benjamin")
  ) {
    return "🐱🎂"
  }

  // ☘️ Saint Patrick's Day
  if (name.includes("patrick")) return "☘️"

  // 🍩 National Donut Day
  if (name.includes("donut") || name.includes("doughnut")) return "🍩"

  // 🎂 Any "birthday"
  if (name.includes("birthday")) return "🎂"

  // 🇺🇸 American holidays
  if (
    name.includes("independence") ||
    name.includes("memorial day") ||
    name.includes("labor day")
  ) {
    return "🇺🇸"
  }

  // 🍷 Wine days
  if (name.includes("red wine") || name.includes("white wine")) return "🍷"

  // 🐍 “Mean Girls Cat”
  if (name.includes("mean girls")) return "🐍"

  // 🐱 Any holiday with “cat” in it
  if (name.includes("cat")) return "🐱"

  // 🎃 Halloween
  if (name.includes("halloween")) return "🎃"

  // 🎄 Christmas
  if (name.includes("christmas") || name.includes("xmas")) return "🎄"

  // 🎆 New Years
  if (name.includes("new year")) return "🎆"

  // 💘 Valentine’s Day
  if (name.includes("valentine")) return "💘"

  // 🐣 Easter
  if (name.includes("easter")) return "🐣"

  // 🦃 Thanksgiving
  if (name.includes("thanksgiving")) return "🦃"

  // 🎀 Default
  return "🎀"
}

function getTorontoTimelineDate(date) {
  console.log("=== Toronto Date Calculation ===")
  console.log("Input date:", date)
  console.log("Input date string:", date.toDateString())
  
  // Normalize to midnight to avoid timezone issues
  const base = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  console.log("Normalized base:", base.toDateString())
  
  console.log("REAL_ANCHOR_DATE:", REAL_ANCHOR_DATE.toDateString())
  console.log("ALT_ANCHOR_DATE:", ALT_ANCHOR_DATE.toDateString())
  
  // Calculate difference in DAYS (not milliseconds) to avoid floating point issues
  const diffTime = base.getTime() - REAL_ANCHOR_DATE.getTime()
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))
  console.log("Difference in days:", diffDays)
  
  // Create result by adding days to ALT_ANCHOR_DATE
  const result = new Date(ALT_ANCHOR_DATE)
  result.setDate(result.getDate() + diffDays)
  
  console.log("Result date:", result.toDateString())
  console.log("Result year:", result.getFullYear())
  console.log("=== End Calculation ===")
  
  return result
}

export default function Timeline() {
  const navigate = useNavigate()
  const [records, setRecords] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCalendar, setShowCalendar] = useState(false)
  const [dateEventsMap, setDateEventsMap] = useState({})
  const [isTorontoMode, setIsTorontoMode] = useState(false)
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1)
  const [currentDay, setCurrentDay] = useState(today.getDate())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const displayDate = new Date(currentYear, currentMonth - 1, currentDay)
  const [showTNInfo, setShowTNInfo] = useState(false)
  // The mapped date for whatever "On This Day" you're currently viewing
  const torontoDate = getTorontoTimelineDate(displayDate)

    // Global (fixed-date) holidays for this day (shown once at top)
  const globalHolidayTagsForDay = (() => {
    const seen = new Set()
    const result = []

    records.forEach((record) => {
      const tags = parseHolidayTags(record?.fields?.HOLIDAYS)
      tags.forEach((tag) => {
        if (!tag) return
        if (!isGlobalHolidayName(tag)) return

        const key = tag.toLowerCase()
        if (!seen.has(key)) {
          seen.add(key)
          result.push(tag)
        }
      })
    })

    return result
  })()

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
    setCurrentYear(calendarYear)        // ADD THIS LINE
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
  setCurrentYear(today.getFullYear())   // Make sure this is here
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

  // ===== Calendar Modal Component =====
  const CalendarModal = () => {
    if (!showCalendar) return null

    const calendarDays = generateCalendar()

    return (
      <div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={() => setShowCalendar(false)}   // click outside closes
      >
        <div
          className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 animate-in fade-in-zoom-in-95"
          onClick={(e) => e.stopPropagation()}   // clicks inside don't close
        >
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
  const TNInfoModal = () => {
    if (!showTNInfo) return null

    return (
      <div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={() => setShowTNInfo(false)}
      >
        <div
          className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-lg font-semibold text-[#8e3e3e]">
            What is the Taylor Nation Timeline?
          </h3>

          <p className="text-sm text-[#5c678f] leading-relaxed">
            On November 22, 2024, Taylor Nation tweeted about everyone being
            &quot;back in Nashville that one morning on April 25th, 2019&quot; and
            praised fans for their top-notch detective skills. That playful post
            sparked a fan theory about a &quot;Taylor Nation timeline&quot; - an
            alternate timeline that runs in parallel to the current date.
          </p>

          <p className="text-sm text-[#5c678f] leading-relaxed">
            This tool lets you jump to the date that lines up with that alternate
            timeline so you can see what Taylor was doing on that &quot;TN
            timeline&quot; day.
          </p>

          <a
            href="https://x.com/taylornation13/status/1860097353564446759?s=20"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[#8a3f5b] underline decoration-dotted hover:text-[#6c3047]"
          >
            View the original Taylor Nation tweet
          </a>

          <div className="flex justify-end pt-2">
            <Button
              variant="secondary"
              className="rounded-full px-4"
              onClick={() => setShowTNInfo(false)}
            >
              Got it
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ===== Existing Functions =====
    const handleNextDay = () => {
  const currentDate = new Date(currentYear, currentMonth - 1, currentDay)
  currentDate.setDate(currentDate.getDate() + 1)
  setCurrentMonth(currentDate.getMonth() + 1)
  setCurrentDay(currentDate.getDate())
  setCurrentYear(currentDate.getFullYear())
  // DON'T exit Toronto mode - keep it active
}

const handlePreviousDay = () => {
  const currentDate = new Date(currentYear, currentMonth - 1, currentDay)
  currentDate.setDate(currentDate.getDate() - 1)
  setCurrentMonth(currentDate.getMonth() + 1)
  setCurrentDay(currentDate.getDate())
  setCurrentYear(currentDate.getFullYear())
  // DON'T exit Toronto mode - keep it active
}

    // ===== Airtable fetch =====
  useEffect(() => {
    const fetchRecordsByDate = async (month, day, year) => {
      const fetchByDate = async () => {
        let filterFormula
      
        if (isTorontoMode) {
          // In Toronto mode: show ONLY this specific year
          filterFormula = `AND(MONTH(DATE) = ${month}, DAY(DATE) = ${day}, YEAR(DATE) = ${year})`
        } else {
          // Normal mode: show this day across all years
          filterFormula = `AND(MONTH(DATE) = ${month}, DAY(DATE) = ${day})`
        }
      
        const response = await axios.get(
          "https://api.airtable.com/v0/appVhtDyx0VKlGbhy/Taylor%20Swift%20Master%20Tracker",
          {
            headers: {
              Authorization: `Bearer ${import.meta.env.VITE_AIRTABLE_API_KEY}`,
            },
            params: {
              filterByFormula: filterFormula,
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

    if (currentMonth && currentDay) {
      fetchRecordsByDate(currentMonth, currentDay, currentYear)
    }
  }, [currentMonth, currentDay, currentYear, isTorontoMode])

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
response.data.records?.forEach((record) => {
  const raw = record.fields.DATE
  if (!raw) return

  // Handle "YYYY-MM-DD" or "YYYY-MM-DDTHH:MM:SS..."
  const [datePart] = raw.split("T")
  const [yearStr, monthStr, dayStr] = datePart.split("-")
  if (!yearStr || !monthStr || !dayStr) return

  const year = Number(yearStr)
  const month = Number(monthStr) // 1–12
  const day = Number(dayStr)

  const dateKey = `${year}-${month}-${day}`
  eventsMap[dateKey] = true
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

    // HOLIDAYS badges helper (supports array or text with multiple tags)
// Use shared helpers and remove global (top-of-page) holidays from cards
const rawHolidayTags = parseHolidayTags(record?.fields?.HOLIDAYS)
const holidayTags = rawHolidayTags.filter((tag) => !isGlobalHolidayName(tag))
const hasHoliday = holidayTags.length > 0

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
            <div className="bg-white/80 backdrop-blur-sm rounded-[10px] p-3 border border-[#f0d0d3] relative">
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 -translate-y-1/4 border border-[#8e3e3e] bg-white rounded-full px-3 py-1 text-sm text-[#8e3e3e] font-semibold shadow-md z-10 min-w-[150px] text-center">
                {formatDate(record?.fields?.DATE)}
              </div>
              {/* Holiday badges */}
{holidayTags.length > 0 && (
  <>
    {/* MOBILE: centered under the date, in normal flow */}
<div className="mt-2 mb-1 flex justify-center md:hidden">
  <div className="flex flex-wrap gap-1 justify-center">
    {holidayTags.map((holiday, index) => (
      <span
        key={index}
        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#fbeff7] text-[#8e3e3e] border border-[#e3b0b0] shadow-sm"
      >
        <span className="mr-1">{getHolidayEmoji(holiday)}</span>
        <span className="truncate max-w-[110px]">{holiday}</span>
      </span>
    ))}
  </div>
</div>

        {/* DESKTOP: upper-left, a bit lower to avoid long titles */}
        <div className="hidden md:flex absolute top-1 left-3 flex-wrap gap-1 justify-start max-w-[45%]">
      {holidayTags.map((holiday, index) => (
        <span
          key={index}
          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#fbeff7] text-[#8e3e3e] border border-[#e3b0b0] shadow-sm"
        >
          <span className="mr-1 text-sm">{getHolidayEmoji(holiday)}</span>
          <span className="truncate max-w-[140px]">{holiday}</span>
        </span>
      ))}
    </div>
  </>
)}

                            <div
  className={`flex flex-col gap-2.5 mt-3 ${
    hasHoliday ? "md:mt-7" : "md:mt-3"
  } timeline-card-text`}
>

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
const hasGlobalHoliday = globalHolidayTagsForDay.length > 0
  // ===== JSX =====
  return (
    <section className="w-full bg-[#e8ecf7] py-2 px-2 md:px-10 flex flex-col min-h-0">
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
        <div className="text-center mb-3 flex-shrink-0">
          {/* Glowy header card */}
          <div className="relative w-full mb-3 md:mb-4 px-2 md:px-5">
            <div
              className="
                relative w-full px-4 md:px-6 py-4 md:py-5
                bg-gradient-to-b from-[#fdf6fb] via-[#fbeff7] to-[#f6e5f0]
                rounded-3xl
                border border-[#e6d2e1]
                shadow-[0_10px_25px_rgba(210,160,180,0.28)]
              "
            >
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif text-[#8e3e3e]">
                  <span className="block tracking-wide">ON THIS DAY</span>
                  <span className="text-sm sm:text-base md:text-lg lg:text-xl block mt-1 text-[#b4667f]">
                    across Taylor&apos;s eras
                  </span>
                </h2>

                <p className="mt-3 text-[#6b7db3] text-xs sm:text-sm md:text-base leading-relaxed px-2">
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

                    {/* Date navigation + Taylor Nation alternate timeline box */}
<div className="relative mt-1 md:mt-2 flex flex-col items-center md:min-h-[90px]">
  {/* Main date navigation (perfectly centered) */}
  <div className="flex items-center justify-center gap-2 md:gap-3">
    {/* PREVIOUS – same size as NEXT */}
    <Button
      variant="secondary"
      className="
        rounded-full h-8 md:h-9 px-3 md:px-4
        text-[11px] sm:text-xs md:text-sm
        flex items-center justify-center gap-1 min-w-[96px]
      "
      onClick={handlePreviousDay}
    >
      <ChevronLeft size={12} />
      <span className="hidden sm:inline">Previous</span>
      <span className="sm:hidden">Prev</span>
    </Button>

    {/* Date bubble with calendar icon INSIDE, but still centered */}
    <div className="relative">
      <div
        className="
          bg-white rounded-full
          pl-3 sm:pl-5 md:pl-6
          pr-8 sm:pr-10 md:pr-11
          py-1 md:py-1.5
          min-w-[130px] sm:min-w-[160px] md:min-w-[190px]
          border border-[#b66b6b]
          flex items-center justify-center
        "
      >
        <span className="text-[#8e3e3e] text-sm md:text-base font-medium">
          {displayDate.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
          })}
        </span>
      </div>

      <button
        onClick={() => setShowCalendar(true)}
        className="
          absolute right-1.5 sm:right-2 md:right-2.5
          top-1/2 -translate-y-1/2
          bg-white rounded-full p-1
          shadow-sm border border-[#b66b6b]
          hover:bg-[#f8d7da] transition-colors
        "
        title="Open calendar"
      >
        <Calendar size={14} className="text-[#8e3e3e]" />
      </button>
    </div>

    {/* NEXT – same classes as PREVIOUS */}
    <Button
      variant="secondary"
      className="
        rounded-full h-8 md:h-9 px-3 md:px-4
        text-[11px] sm:text-xs md:text-sm
        flex items-center justify-center gap-1 min-w-[96px]
      "
      onClick={handleNextDay}
    >
      <span className="hidden sm:inline">Next</span>
      <span className="sm:hidden">Next</span>
      <ChevronRight size={12} />
    </Button>
  </div>

  {/* TN box – mobile: stacked under nav */}
<div className="mt-3 w-full max-w-xs mx-auto md:hidden">
  <div className="bg-white/80 border border-[#e6d2e1] rounded-2xl shadow-sm px-3 sm:px-4 py-3">
    <p className="text-[11px] sm:text-xs text-[#6b7db3] leading-snug mb-2">
      {isTorontoMode
        ? "TN Timeline Mode"
        : "Click to view events on this day on Taylor Nation's alternate timeline."}
      <button
        type="button"
        onClick={() => setShowTNInfo(true)}
        className="inline-flex items-center ml-1 text-[10px] text-[#b66b6b] underline decoration-dotted hover:text-[#8e3e3e]"
      >
        <HelpCircle size={12} className="mr-0.5" />
        What is this?
      </button>
    </p>

    <Button
      variant="outline"
      className="
        rounded-full px-3 sm:px-4 py-1.5
        text-[11px] sm:text-xs
        border-[#b66b6b] text-[#8e3e3e]
        bg-white/90 hover:bg-[#fbeff7]
        w-full break-words whitespace-normal
      "
      onClick={() => {
        if (isTorontoMode) {
          const today = new Date()
          setCurrentYear(today.getFullYear())
          setCurrentMonth(today.getMonth() + 1)
          setCurrentDay(today.getDate())
          setIsTorontoMode(false)
        } else {
          setCurrentYear(torontoDate.getFullYear())
          setCurrentMonth(torontoDate.getMonth() + 1)
          setCurrentDay(torontoDate.getDate())
          setIsTorontoMode(true)
        }
      }}
    >
      {isTorontoMode ? (
        <>
          <span className="font-semibold mr-1">← Return to Today:</span>
          {new Date().toLocaleDateString("en-US", {
            month: "short",
            day: "2-digit",
            year: "numeric",
          })}
        </>
      ) : (
        <>
          <span className="font-semibold mr-1">Taylor Nation Timeline:</span>
          {torontoDate.toLocaleDateString("en-US", {
            month: "short",
            day: "2-digit",
            year: "numeric",
          })}
        </>
      )}
    </Button>
  </div>
</div>

    {/* TN box – desktop: compact TN control */}
<div className="hidden md:block absolute right-6 top-1/2 -translate-y-1/2">
  <div className="bg-white/90 border border-[#e6d2e1] rounded-2xl shadow-sm px-4 py-3 max-w-xs">
    {/* Primary action on top – shows TN date directly */}
    <Button
      variant="outline"
      className="
        rounded-xl px-3 py-1.5
        text-xs md:text-sm font-medium
        border-[#b66b6b] text-[#8e3e3e]
        bg-white/95 hover:bg-[#fbeff7]
        w-full break-words whitespace-normal
      "
      onClick={() => {
        if (isTorontoMode) {
          const today = new Date()
          setCurrentYear(today.getFullYear())
          setCurrentMonth(today.getMonth() + 1)
          setCurrentDay(today.getDate())
          setIsTorontoMode(false)
        } else {
          setCurrentYear(torontoDate.getFullYear())
          setCurrentMonth(torontoDate.getMonth() + 1)
          setCurrentDay(torontoDate.getDate())
          setIsTorontoMode(true)
        }
      }}
    >
      {isTorontoMode ? (
  <>
    <span className="font-semibold mr-1">← Return to Today:</span>
    {new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    })}
  </>
) : (
  <>
    <span className="font-semibold mr-1">Taylor Nation Timeline:</span>
    {torontoDate.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    })}
  </>
)}
    </Button>

    {/* Short, more readable helper text */}
    <p className="mt-2 text-xs md:text-sm text-[#5c678f] leading-snug">
  {isTorontoMode ? (
    <>TN Timeline Mode</>
  ) : (
    <>Click to view events on this day on Taylor Nation's alternate timeline.</>
  )}

  <button
    type="button"
    onClick={() => setShowTNInfo(true)}
    className="inline-flex items-center ml-1 text-[11px] md:text-xs text-[#b66b6b] underline decoration-dotted hover:text-[#8e3e3e]"
  >
    <HelpCircle size={12} className="mr-0.5" />
    What is this?
  </button>
</p>
  </div>
</div>
</div>

{/* 🌟 Global fixed-date holiday badge + Event Counter */}
<div className="w-full">
  {/* MOBILE holiday pill – centered under date nav */}
  {hasGlobalHoliday && (
    <div className="md:hidden flex justify-center mt-2 mb-0">
      <span
        className="
          inline-flex items-center
          px-4 py-1.5
          rounded-full
          text-sm font-semibold
          bg-[#fbeff7]
          text-[#8e3e3e]
          border border-[#e3b0b0]
          shadow-sm
          max-w-[90%]
        "
      >
        <span className="mr-2 text-base">
          {getHolidayEmoji(globalHolidayTagsForDay[0])}
        </span>
        {globalHolidayTagsForDay[0]}
      </span>
    </div>
  )}

  {/* DESKTOP holiday pill – positioned to match timeline cards */}
  {hasGlobalHoliday && (
    <div className="hidden md:block">
      <div className="relative">
        {/* Position badge to match timeline cards */}
        <div className="absolute left-1/4 -translate-x-1/4">
          <span
            className="
              inline-flex items-center
              px-4 py-1.5
              rounded-full
              text-sm font-semibold
              bg-[#fbeff7]
              text-[#8e3e3e]
              border border-[#e3b0b0]
              shadow-sm
              whitespace-nowrap
            "
          >
            <span className="mr-2 text-base">
              {getHolidayEmoji(globalHolidayTagsForDay[0])}
            </span>
            {globalHolidayTagsForDay[0]}
          </span>
        </div>
      </div>
    </div>
  )}

    {/* Event Counter – balanced spacing */}
  <div
    className={`flex justify-center ${
      hasGlobalHoliday ? "mt-4 md:mt-1" : "mt-2 md:-mt-3"
    } mb-2 flex-shrink-0`}
  >
    <div
      className="
        event-counter-pill
        bg-white rounded-full px-2 sm:px-3 md:px-4 py-1
        border border-[#b66b6b] shadow-sm
      "
    >
      <div className="flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-[#8e3e3e] animate-pulse" />

        <span className="event-counter-text text-[#8e3e3e] text-xs md:text-sm font-medium">
          {isLoading
            ? "Loading events..."
            : `${records.length} ${
                records.length === 1 ? "Event" : "Events"
              } Found${isTorontoMode ? " (TN Timeline)" : ""}`}
        </span>

        <div className="w-1.5 h-1.5 rounded-full bg-[#8e3e3e] animate-pulse" />
      </div>
    </div>
  </div>
</div>
        </div>

        {/* Mobile Timeline - Vertical line behind cards */}
<div className="md:hidden mt-2 px-4">
  <div className="relative">
    {/* Background line + top & bottom bubbles */}
    <div className="pointer-events-none absolute inset-0 flex justify-center z-0">
      {/* Main vertical line */}
      <div className="w-[2px] h-full bg-[#8a9ad4]" />

      {/* TOP bubble (inside container, not negative) */}
      <div className="absolute left-1/2 -translate-x-1/2 top-0 w-7 h-7 rounded-full bg-[#6B78B4]" />

      {/* BOTTOM bubble */}
      <div className="absolute left-1/2 -translate-x-1/2 -bottom-3 w-7 h-7 rounded-full bg-[#6B78B4]" />
    </div>

    {/* Cards centered over the line, above the background */}
    <div className="relative w-full max-w-xl mx-auto z-10 pt-4">
      {records.map((record, index) => (
        <div key={`mobile-${record.id}`} className="relative mb-6">
          {/* Connecting line from card to center line */}
          <div className="absolute left-1/2 top-6 w-6 h-[2px] bg-[#8a9ad4] -translate-x-1/2" />

          <TimelineCard record={record} index={index} />
        </div>
      ))}
    </div>
  </div>
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
        
                {/* Modals */}
        <CalendarModal />
        <TNInfoModal />
      </div>
    </section>
  )
}