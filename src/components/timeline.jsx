"use client"

import { ChevronLeft, ChevronRight, Calendar, Star, Zap, Clock, HelpCircle } from "lucide-react"
import { Button } from "./ui/Button"
import { useNavigate, Link } from "react-router-dom"
import { useEffect, useState } from "react"
import axios from "axios"
import "./timeline.css"
import { SITE_UPDATES } from "./site-updates"
import AdSlot from "./adslot"
import DateCalculatorModal from "./DateCalculatorModal";


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
  // Normalize to midnight to avoid timezone issues
  const base = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  // Calculate difference in DAYS between real anchor and selected date
  const diffTime = base.getTime() - REAL_ANCHOR_DATE.getTime()
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))

  // Create result by adding days to ALT_ANCHOR_DATE
  const result = new Date(ALT_ANCHOR_DATE)
  result.setDate(result.getDate() + diffDays)

  return result
}
function getRealDateFromTorontoDate(tnDate) {
  // Normalize to midnight to avoid timezone issues
  const base = new Date(tnDate.getFullYear(), tnDate.getMonth(), tnDate.getDate())

  // Difference in DAYS between selected TN date and ALT anchor
  const diffTime = base.getTime() - ALT_ANCHOR_DATE.getTime()
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))

  // Apply that to REAL anchor to get the matching real timeline date
  const result = new Date(REAL_ANCHOR_DATE)
  result.setDate(result.getDate() + diffDays)

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
  const todayLabel = today.toLocaleDateString("en-US", {
  month: "short",
  day: "2-digit",
  year: "numeric",
})
  const [showTNInfo, setShowTNInfo] = useState(false)
  const [showDateCalc, setShowDateCalc] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  
  // ===== SEO META TAGS UPDATE =====
  useEffect(() => {
    // Update page title
    document.title = `Swift-Lore - Taylor Swift Timeline | On This Day`
    
    // Update or create meta description
    let metaDescription = document.querySelector('meta[name="description"]')
    if (!metaDescription) {
      metaDescription = document.createElement('meta')
      metaDescription.name = "description"
      document.head.appendChild(metaDescription)
    }
    metaDescription.content = `Explore Taylor Swift events on this day across all eras. Interactive timeline with ${SITE_UPDATES.totalEvents}+ verified events, updated ${SITE_UPDATES.lastUpdated}.`
    
    // Add structured data for Google
    const scriptId = "structured-data-script"
    let existingScript = document.getElementById(scriptId)
    if (existingScript) {
      existingScript.remove()
    }
    
    const script = document.createElement('script')
    script.id = scriptId
    script.type = "application/ld+json"
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Swift-Lore - Taylor Swift Timeline",
      "description": `Interactive archive of ${SITE_UPDATES.totalEvents}+ Taylor Swift events from 2003 to present.`,
      "url": window.location.origin,
      "applicationCategory": "EntertainmentApplication",
      "operatingSystem": "Any",
      "datePublished": "2024-01-01",
      "dateModified": new Date().toISOString().split('T')[0]
    })
    document.head.appendChild(script)
    
    // Cleanup on component unmount
    return () => {
      if (script.parentNode) {
        script.remove()
      }
    }
  }, [])
  const torontoDate = getTorontoTimelineDate(displayDate)
const matchingRealDate = getRealDateFromTorontoDate(displayDate)
const matchingRealLabel = matchingRealDate.toLocaleDateString("en-US", {
  month: "short",
  day: "2-digit",
  year: "numeric",
})

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

  // 🔒 Pad out to a full 6-week (42 cell) grid
  while (calendar.length < 42) {
    calendar.push(null)
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
  setCurrentYear(today.getFullYear())
  setCurrentMonth(today.getMonth() + 1)
  setCurrentDay(today.getDate())
  setIsTorontoMode(false)
  setShowCalendar(false)
  resetPagination()
}

  const jumpToThisMonth = () => {
    const today = new Date()
    setCalendarMonth(today.getMonth())
    setCalendarYear(today.getFullYear())
  }

  const hasEvents = (day) => {
  if (!day) return false
  const dateKey = `${calendarYear}-${calendarMonth + 1}-${day}`
  return !!dateEventsMap[dateKey]
}

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  // ===== Calendar Modal Component =====
  const CalendarModal = () => {
    useEffect(() => {
    if (showCalendar) {
      const originalStyle = window.getComputedStyle(document.body).overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalStyle
      }
    }
  }, [showCalendar])

  if (!showCalendar) return null

    const calendarDays = generateCalendar()

            return (
      <>
        <div 
          className="fixed inset-0 bg-black/50 z-[9998]" 
          onClick={() => setShowCalendar(false)} 
        />
        <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4 pointer-events-none">
          <div
            className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 animate-in fade-in-zoom-in-95 pointer-events-auto max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Keep all the existing CalendarModal content here - it's the same */}
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
            <div className="flex items-center justify-between mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateCalendarMonth("prev")}
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
                onClick={() => navigateCalendarMonth("next")}
                className="p-2 hover:bg-[#f8d7da] transition-colors"
              >
                <ChevronRight size={18} className="text-[#8e3e3e]" />
              </Button>
            </div>

            {/* Month / Year dropdowns */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <select
                className="border border-[#e3b0b0] rounded-full px-3 py-1 text-xs text-[#8e3e3e] bg-white"
                value={calendarMonth}
                onChange={(e) => setCalendarMonth(Number(e.target.value))}
              >
                {monthNames.map((name, idx) => (
                  <option key={name} value={idx}>
                    {name}
                  </option>
                ))}
              </select>

              <select
                className="border border-[#e3b0b0] rounded-full px-3 py-1 text-xs text-[#8e3e3e] bg-white"
                value={calendarYear}
                onChange={(e) => setCalendarYear(Number(e.target.value))}
              >
                {Array.from(
                  { length: new Date().getFullYear() + 5 - 2006 + 1 },
                  (_, i) => 2006 + i
                ).map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
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
              {calendarDays.map((day, index) => {
                const isEmpty = !day
                let isSelected = false
                if (!isEmpty) {
                  isSelected =
                    day === currentDay &&
                    calendarMonth + 1 === currentMonth &&
                    calendarYear === currentYear
                }

                const baseClasses =
                  "relative h-8 rounded-lg text-sm font-medium transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center"

                const visibilityClasses = isEmpty ? "invisible" : ""
                const stateClasses = isSelected
                  ? "bg-[#8e3e3e] text-white shadow-md scale-105"
                  : "bg-white/80 text-[#8e3e3e] hover:bg-[#f8d7da]"
                const borderClasses = hasEvents(day)
                  ? "border-2 border-[#e3b0b0]"
                  : "border border-transparent"

                return (
                  <button
                    key={index}
                    onClick={() => handleDateSelect(day)}
                    disabled={isEmpty}
                    className={`${baseClasses} ${visibilityClasses} ${stateClasses} ${borderClasses}`}
                  >
                    {!isEmpty && (
                      <span className="relative z-10">
                        {day}
                      </span>
                    )}
                    {hasEvents(day) && !isEmpty && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#8e3e3e] rounded-full" />
                    )}
                  </button>
                )
              })}
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
                onClick={() => {
                  const today = new Date()
                  setCurrentYear(today.getFullYear())
                  setCurrentMonth(today.getMonth() + 1)
                  setCurrentDay(today.getDate())
                  setIsTorontoMode(false)
                  setShowCalendar(false)
                }}
                className="rounded-full px-6 flex-1 bg-[#8e3e3e] hover:bg-[#7a3434]"
              >
                Go to Today
              </Button>
            </div>
          </div>
        </div>
      </>
    )
    }
  const TNInfoModal = () => {
    if (!showTNInfo) return null

    return (
      <div
  className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4"
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
          filterFormula = `AND(MONTH({DATE}) = ${month}, DAY({DATE}) = ${day}, YEAR({DATE}) = ${year})`
        } else {
          // Normal mode: show this day across all years
          filterFormula = `AND(MONTH({DATE}) = ${month}, DAY({DATE}) = ${day})`
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
        setIsInitialLoad(false) // ← ADD THIS LINE
      } catch (error) {
        console.error("Error fetching records:", error)
        setRecords([])
        setIsInitialLoad(false) // ← ADD THIS LINE
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
  filterByFormula: `AND(MONTH({DATE}) = ${month}, YEAR({DATE}) = ${year})`,
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
  const handleTagClick = (e, keyword) => {
    e.preventDefault()
    e.stopPropagation()
    navigate(`/posts?keyword=${encodeURIComponent(keyword)}`)
  }

  const handleCardClick = (e) => {
    // If click is on a keyword pill, let that handler do its thing
    if (e.target.closest(".keyword-container")) {
      return
    }

    // If there is ANY selected text, don't navigate
    const sel = window.getSelection()
    if (sel && sel.toString().length > 0) {
      e.preventDefault()
      return
    }

    // Otherwise, let the <Link> handle navigation normally
    // (left-click, Cmd/Ctrl+click, middle-click, etc.)
  }

  const handleCardCopy = (e) => {
    const selection = window.getSelection()
    if (!selection) return

    const text = selection.toString()
    if (!text) return

    // Prevent browser from adding the link URL to the copied text
    e.preventDefault()
    e.clipboardData.setData("text/plain", text)
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

  const rawHolidayTags = parseHolidayTags(record?.fields?.HOLIDAYS)
  const holidayTags = rawHolidayTags.filter((tag) => !isGlobalHolidayName(tag))
  const hasHoliday = holidayTags.length > 0

  return (
    <Link
      to={`/post_details?id=${record.id}`}
      className="block relative hover:opacity-95 transition-opacity timeline-card"
      style={{ marginTop: index === 0 ? "17px" : "43px" }}
      draggable={false}
      onDragStart={(e) => e.preventDefault()}
      onClick={handleCardClick}
      onCopy={handleCardCopy}
    >
      <div className="relative">
        <div className="bg-gradient-to-br from-[#fce0e0] to-[#f8d7da] rounded-[13px] shadow-lg border border-[#e8c5c8] p-1">
          <div className="bg-white/80 backdrop-blur-sm rounded-[10px] p-3 border border-[#f0d0d3] relative">
            {/* Top date pill - not selectable */}
            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 -translate-y-1/4 border border-[#8e3e3e] bg-white rounded-full px-3 py-1 text-sm text-[#8e3e3e] font-semibold shadow-md z-10 min-w-[150px] text-center no-text-highlight">
              {formatDate(record?.fields?.DATE)}
            </div>

            {/* Holiday badges - not selectable */}
            {holidayTags.length > 0 && (
              <>
                {/* MOBILE */}
                <div className="mt-2 mb-1 flex justify-center md:hidden">
                  <div className="flex flex-wrap gap-1 justify-center no-text-highlight">
                    {holidayTags.map((holiday, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#fbeff7] text-[#8e3e3e] border border-[#e3b0b0] shadow-sm"
                      >
                        <span className="mr-1">
                          {getHolidayEmoji(holiday)}
                        </span>
                        <span className="truncate max-w-[110px]">
                          {holiday}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* DESKTOP */}
                <div className="hidden md:flex absolute top-1 left-3 flex-wrap gap-1 justify-start max-w-[45%] no-text-highlight">
                  {holidayTags.map((holiday, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#fbeff7] text-[#8e3e3e] border border-[#e3b0b0] shadow-sm"
                    >
                      <span className="mr-1 text-sm">
                        {getHolidayEmoji(holiday)}
                      </span>
                      <span className="truncate max-w-[140px]">
                        {holiday}
                      </span>
                    </span>
                  ))}
                </div>
              </>
            )}

            {/* Main text content – this stays fully selectable */}
            <div
              className={`timeline-card-text flex flex-col gap-2.5 mt-3 ${
                hasHoliday ? "md:mt-7" : "md:mt-3"
              }`}
            >
              <h3 className="text-[#8e3e3e] font-bold text-sm md:text-base leading-relaxed text-center">
                {record?.fields?.EVENT || "Event description unavailable"}
              </h3>

              {record?.fields?.NOTES && (
                <div className="text-xs md:text-sm text-center font-medium text-gray-700 leading-relaxed whitespace-pre-line">
                  {record.fields.NOTES}
                </div>
              )}

              {/* Keywords – clickable buttons */}
              {record?.fields?.KEYWORDS &&
                record.fields.KEYWORDS.length > 0 && (
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
    </Link>
  )
}
const hasGlobalHoliday = globalHolidayTagsForDay.length > 0
     // ===== JSX =====
  return (
    <>
      {/* ===== HIDDEN SEO CONTENT FOR CRAWLERS ===== */}
      <div style={{ 
        position: 'absolute', 
        opacity: 0, 
        height: 0, 
        overflow: 'hidden',
        pointerEvents: 'none'
      }}>
        <h1>Swift-Lore - Taylor Swift Complete Career Timeline</h1>
        <h2>Interactive Archive of Taylor Swift Events</h2>
        <p>Swift-Lore is a comprehensive interactive timeline documenting Taylor Alison Swift's complete career from her earliest performances in 2003 through the present day. This fan-run archive includes thousands of verified events including album releases, tour dates, award show appearances, interviews, music videos, public appearances, personal milestones, and cultural moments.</p>
        <p>Browse Taylor Swift's career by specific dates, filter events by era (Debut, Fearless, Speak Now, Red, 1989, Reputation, Lover, Folklore, Evermore, Midnights, The Tortured Poets Department), search for specific keywords, or explore connections between different moments in her career.</p>
        <p>Each event includes detailed descriptions, contextual background information, source citations, and keyword tagging for easy navigation. The archive is regularly updated with new events and additional context.</p>
        <h3>Featured Content Areas:</h3>
        <ul>
          <li>Album Releases and Announcements</li>
          <li>Tour Dates and Concert Information</li>
          <li>Award Show Appearances and Wins</li>
          <li>Music Video Releases</li>
          <li>Interview and Media Appearances</li>
          <li>Public Events and Appearances</li>
          <li>Personal Milestones and Birthdays</li>
          <li>Cultural Impact Moments</li>
          <li>Fan Community Events</li>
          <li>Charity and Philanthropy</li>
        </ul>
        <p>This independent research project is maintained by dedicated fans and serves as a comprehensive resource for understanding the timeline and context of Taylor Swift's career evolution.</p>
      </div>
            {/* ===== VISIBLE TO CRAWLERS, HIDDEN FROM USERS ===== */}
      <div className="sr-only" aria-hidden="true">
        <h1>Taylor Swift Timeline Archive</h1>
        <p>Browse {SITE_UPDATES.totalEvents}+ events from Taylor Swift's career including album releases, tour dates, awards, interviews, and personal milestones.</p>
        <p>Current date: {displayDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        <p>Archive last updated: {SITE_UPDATES.lastUpdated}</p>
      </div>
      
      {/* Your existing visible timeline JSX */}
      <section className="w-full bg-[#e8ecf7] py-1 px-2 md:px-6 flex flex-col min-h-0">
        <div className="container mx-auto flex flex-col min-h-0 flex-1">
          {/* Homepage Intro for SEO / AdSense - WIDER but same height */}
          <div className="max-w-4xl mx-auto mt-1 mb-2 px-3">
            <div className="bg-white/70 border border-[#e3d5dd] rounded-xl shadow-sm px-4 py-3 md:px-6 md:py-3 text-center">
              <h2 className="text-base md:text-lg font-semibold text-[#8e3e3e] mb-2">
                Swift-Lore: Taylor Swift's Complete Career Timeline
              </h2>
              <div className="text-[#6b7db3] text-sm md:text-base leading-relaxed space-y-2">
                <p>
                  Swift-Lore is an independent, fan-run research archive documenting Taylor
                  Swift's career from her earliest performances to the present day.
                  Each entry is tied to a specific date, with context notes and source links.
                </p>
                <p>
                  Browse by date, filter events, and follow her journey across albums and
                  eras — from releases and award shows to interviews, paparazzi spots, and
                  deep-cut easter eggs. The timeline currently tracks thousands of verified
                  moments and is updated regularly.
                </p>
              </div>
            </div>
          </div>

          {/* ON THIS DAY Section */}
<div className="text-center mb-1 flex-shrink-0">
  {/* Glowy header card */}
  <div className="relative w-full mb-2 md:mb-3 px-2">
    <div
      className="
        relative w-full max-w-md mx-auto px-3 py-2
        bg-gradient-to-b from-[#fdf6fb] via-[#fbeff7] to-[#f6e5f0]
        rounded-2xl
        border border-[#e6d2e1]
        shadow-[0_8px_20px rgba(210,160,180,0.25)]
      "
    >
      <div className="mx-auto text-center">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-serif text-[#8e3e3e]">
          <span className="block tracking-wide">ON THIS DAY</span>
          <span className="text-xs sm:text-sm md:text-base block mt-0.5 text-[#b4667f]">
            across Taylor&apos;s eras
          </span>
        </h2>

        <p className="mt-1 text-[#6b7db3] text-xs leading-relaxed px-1">
          Explore what happened on this day across the years
        </p>
      </div>

      {/* Side stars */}
      <div className="pointer-events-none absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 opacity-70">
        <img
          src="/images/star.png"
          alt="Star"
          className="w-[20px] h-[20px] sm:w-[26px] sm:h-[26px]"
        />
      </div>

      <div className="pointer-events-none absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 opacity-70">
        <img
          src="/images/star.png"
          alt="Star"
          className="w-[20px] h-[20px] sm:w-[26px] sm:h-[26px]"
        />
      </div>
    </div>
  </div>

  {/* Date navigation container with properly positioned TN box */}
  <div className="relative mt-0 md:mt-1 max-w-3xl mx-auto">
    {/* Main date navigation - CENTERED (Date Calc does NOT affect centering) */}
<div className="relative w-full">
  {/* Mobile: Date Calc on its own row */}
  <div className="flex justify-center mb-2 sm:hidden">
    <Button
      variant="secondary"
      className="
        rounded-full h-7 px-3
        text-[10px]
        flex items-center justify-center
        min-w-[90px]
      "
      onClick={() => setShowDateCalc(true)}
      title="Open date calculator"
    >
      Date Calc
    </Button>
  </div>

  {/* Desktop/tablet: Date Calc pinned left, doesn't push center */}
  <div className="hidden sm:block absolute left-0 top-1/2 -translate-y-1/2">
    <Button
      variant="secondary"
      className="
        rounded-full h-7 md:h-8 px-2 md:px-3
        text-[10px] sm:text-xs
        flex items-center justify-center
        min-w-[90px]
      "
      onClick={() => setShowDateCalc(true)}
      title="Open date calculator"
    >
      Date Calc
    </Button>
  </div>

  {/* TRUE centered row */}
  <div className="flex items-center justify-center gap-1 md:gap-2">
    <Button
      variant="secondary"
      className="
        rounded-full h-7 md:h-8 px-2 md:px-3
        text-[10px] sm:text-xs
        flex items-center justify-center gap-1 min-w-[80px]
      "
      onClick={handlePreviousDay}
    >
      <ChevronLeft size={10} />
      <span className="hidden sm:inline">Previous</span>
      <span className="sm:hidden">Prev</span>
    </Button>

    {/* Date bubble */}
    <div className="relative">
      <div
        className="
          bg-white rounded-full
          pl-3 sm:pl-4
          pr-7 sm:pr-8
          py-0.5
          min-w-[120px] sm:min-w-[140px]
          border border-[#b66b6b]
          flex items-center justify-center
        "
      >
        <span className="text-[#8e3e3e] text-sm font-medium">
          {displayDate.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
          })}
        </span>
      </div>

      <button
        onClick={() => setShowCalendar(true)}
        className="
          absolute right-1 sm:right-1.5
          top-1/2 -translate-y-1/2
          bg-white rounded-full p-0.5
          shadow-sm border border-[#b66b6b]
          hover:bg-[#f8d7da] transition-colors
        "
        title="Open calendar"
      >
        <Calendar size={12} className="text-[#8e3e3e]" />
      </button>
    </div>

    <Button
      variant="secondary"
      className="
        rounded-full h-7 md:h-8 px-2 md:px-3
        text-[10px] sm:text-xs
        flex items-center justify-center gap-1 min-w-[80px]
      "
      onClick={handleNextDay}
    >
      <span className="hidden sm:inline">Next</span>
      <span className="sm:hidden">Next</span>
      <ChevronRight size={10} />
    </Button>
  </div>
</div>

    {/* TN box - Desktop: positioned to right */}
    <div
      className="
        hidden
        lg:block lg:absolute lg:right-[-10px] lg:top-[-5px]
      "
    >
      <div className="bg-white/90 border border-[#e6d2e1] rounded-xl shadow-sm px-3 py-2 w-56">
        <Button
          variant="outline"
          className="
            rounded-xl px-2 py-1
            text-xs font-medium
            border-[#b66b6b] text-[#8e3e3e]
            bg-white/95 hover:bg-[#fbeff7]
            w-full break-words whitespace-normal
            flex items-center justify-center text-center
          "
          onClick={() => {
  if (isTorontoMode) {
    // FIXED: Go to the matching real date shown on the button, not today
    setCurrentYear(matchingRealDate.getFullYear())
    setCurrentMonth(matchingRealDate.getMonth() + 1)
    setCurrentDay(matchingRealDate.getDate())
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
            <span className="font-semibold flex items-center">
              <ChevronLeft size={12} className="mr-1" />
              Return to: {matchingRealLabel}
            </span>
          ) : (
            <span className="font-semibold flex flex-col leading-snug">
              <span>Taylor Nation Timeline Date:</span>
              <span className="text-[11px] mt-0.5">
                {torontoDate.toLocaleDateString("en-US", {
                  month: "short",
                  day: "2-digit",
                  year: "numeric",
                })}
              </span>
            </span>
          )}
        </Button>

        <div className="mt-1 flex items-center justify-center gap-1 text-[11px]">
          {isTorontoMode && (
            <span className="text-[#6b7db3]">TN Timeline Mode</span>
          )}
          <button
            type="button"
            onClick={() => setShowTNInfo(true)}
            className="inline-flex items-center text-[10px] text-[#b66b6b] underline decoration-dotted hover:text-[#8e3e3e]"
          >
            <HelpCircle size={10} className="mr-0.5" />
            What is this?
          </button>
        </div>
      </div>
    </div>

    {/* Mobile TN box - centered */}
    <div className="mt-2 w-full md:mt-3 lg:hidden">
      <div className="w-full flex justify-center">
        <div className="bg-white/90 border border-[#e6d2e1] rounded-xl shadow-sm px-3 py-2 w-56">
          <Button
            variant="outline"
            className="
              rounded-xl px-2 py-1
              text-xs font-medium
              border-[#b66b6b] text-[#8e3e3e]
              bg-white/95 hover:bg-[#fbeff7]
              w-full break-words whitespace-normal
              flex items-center justify-center text-center
            "
            onClick={() => {
  if (isTorontoMode) {
    // FIXED: Go to the matching real date shown on the button, not today
    setCurrentYear(matchingRealDate.getFullYear())
    setCurrentMonth(matchingRealDate.getMonth() + 1)
    setCurrentDay(matchingRealDate.getDate())
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
              <span className="font-semibold flex items-center">
                <ChevronLeft size={12} className="mr-1" />
                Return to: {matchingRealLabel}
              </span>
            ) : (
              <span className="font-semibold flex flex-col leading-snug">
                <span>Taylor Nation Timeline Date:</span>
                <span className="text-[11px] mt-0.5">
                  {torontoDate.toLocaleDateString("en-US", {
                    month: "short",
                    day: "2-digit",
                    year: "numeric",
                  })}
                </span>
              </span>
            )}
          </Button>

          <div className="mt-1 flex items-center justify-center gap-1 text-[11px]">
            {isTorontoMode && (
              <span className="text-[#6b7db3]">TN Timeline Mode</span>
            )}
            <button
              type="button"
              onClick={() => setShowTNInfo(true)}
              className="inline-flex items-center text-[10px] text-[#b66b6b] underline decoration-dotted hover:text-[#8e3e3e]"
            >
              <HelpCircle size={10} className="mr-0.5" />
              What is this?
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  {/* 🌟 Global fixed-date holiday badge + Event Counter */}
  <div className="w-full mt-2">
    {hasGlobalHoliday && (
      <div className="flex justify-center mb-1">
        <span
          className="
            inline-flex items-center
            px-3 py-1
            rounded-full
            text-xs font-semibold
            bg-[#fbeff7]
            text-[#8e3e3e]
            border border-[#e3b0b0]
            shadow-sm
            max-w-[85%]
          "
        >
          <span className="mr-1 text-sm">
            {getHolidayEmoji(globalHolidayTagsForDay[0])}
          </span>
          {globalHolidayTagsForDay[0]}
        </span>
      </div>
    )}

    <div className="flex justify-center mt-0.5 mb-1 flex-shrink-0">
      <div
        className="
          event-counter-pill
          bg-white rounded-full px-2 py-0.5
          border border-[#b66b6b] shadow-sm
        "
      >
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-[#8e3e3e] animate-pulse" />
                    <span className="event-counter-text text-[#8e3e3e] text-xs font-medium">
            {isInitialLoad
              ? `Loading ${SITE_UPDATES.totalEvents}+ events...`
              : isLoading
              ? "Loading events..."
              : `${records.length} ${
                  records.length === 1 ? "Event" : "Events"
                } Found${isTorontoMode ? " (TN)" : ""}`}
          </span>
          <div className="w-1.5 h-1.5 rounded-full bg-[#8e3e3e] animate-pulse" />
        </div>
      </div>
    </div>
  </div>
</div>
            
                    {/* Mobile Timeline – only show when there are events */}
          {records.length > 0 && (
            <div className="md:hidden mt-1 px-3">
              <div className="relative">
                <div className="pointer-events-none absolute inset-0 flex justify-center z-0">
                  <div className="w-[2px] h-full bg-[#8a9ad4]" />
                  <div className="absolute left-1/2 -translate-x-1/2 top-0 w-6 h-6 rounded-full bg-[#6B78B4]" />
                  <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-6 h-6 rounded-full bg-[#6B78B4]" />
                </div>

                <div className="relative w-full max-w-xl mx-auto z-10 pt-2">
                  {records.map((record, index) => (
                    <div key={`mobile-${record.id}`} className="relative mb-4">
                      <div className="absolute left-1/2 top-4 w-6 h-[2px] bg-[#8a9ad4] -translate-x-1/2" />
                      <TimelineCard record={record} index={index} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

                    {/* Desktop Timeline – only show when there are events */}
          {records.length > 0 && (
            <div className="hidden md:block min-h-0">
              <div className="relative flex justify-center">
                <div className="absolute w-[2px] flex flex-col items-center h-full">
                  <div className="w-[5px] bg-[#8a9ad4] h-full"></div>
                  <div className="absolute left-1/2 -translate-x-1/2 top-0 w-6 h-6 rounded-full bg-[#6B78B4]"></div>
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-6 h-6 rounded-full bg-[#6B78B4]"></div>
                </div>

                <div className="relative left-[37.5%] -translate-x-1/4 w-3/4">
                  {records.map((record, index) => (
                    <div
                      key={`desktop-${record.id}`}
                      className="relative transition-all duration-300"
                      style={{
                        marginTop: index === 0 ? "0" : "40px",
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
          )}
          {/* Empty state when no events for this date */}
          {!isLoading && !isInitialLoad && records.length === 0 && (
            <div className="text-center text-xs md:text-sm text-[#6b7db3] mt-3 mb-2 px-4">
              No events are logged for this date yet. The archive is still growing, so check back soon.
            </div>
          )}
          {/* Timeline meta / last updated */}
<div className="text-center text-[11px] md:text-xs text-[#6b7db3] mt-2 mb-2 px-4">
  Last updated: {SITE_UPDATES.lastUpdated} · Currently tracking{" "}
  <span className="font-semibold">{SITE_UPDATES.totalEvents}+</span> Taylor Swift events
  from {SITE_UPDATES.firstYear} to present.
</div>
<div className="text-center text-[10px] text-[#6b7db3] mt-1 mb-3 px-4 leading-tight">
  All event dates and information are collected from publicly available sources.
  Swift-Lore is a fan-created research project and may contain occasional inaccuracies.
  If you spot an error, please contact us.
</div>
          
          {/* View Full Timeline Button */}
          <div className="flex justify-center mt-1 mb-1 flex-shrink-0">
            <Button
              variant="secondary"
              className="rounded-full px-4 py-1 text-sm w-full max-w-xs sm:max-w-sm"
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
          {showDateCalc && (
  <DateCalculatorModal onClose={() => setShowDateCalc(false)} />
)}
        </div>
      </section>
    </>
  )
}