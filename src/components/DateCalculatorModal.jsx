"use client"

import { useState, useEffect } from "react"
import { Button } from "./ui/Button"

export default function DateCalculatorModal({ onClose }) {
  useEffect(() => {
    // Store original overflow value
    const originalStyle = window.getComputedStyle(document.body).overflow
    
    // Prevent scrolling on body
    document.body.style.overflow = 'hidden'
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = originalStyle
    }
  }, [])
  
  // --- Tabs ---
  const [tab, setTab] = useState("between")

  // Days Between option: include end date (+1 day)
  const [includeEndDate, setIncludeEndDate] = useState(false)

  // --- Between dates state ---
  const [startBetween, setStartBetween] = useState("")
  const [endBetween, setEndBetween] = useState("")

  // --- Add/Subtract state ---
  const [baseDate, setBaseDate] = useState(() => {
    const t = new Date()
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(
      t.getDate()
    ).padStart(2, "0")}`
  })

  const [sign, setSign] = useState(1) // 1 add, -1 subtract
  const [deltaYears, setDeltaYears] = useState("")
  const [deltaMonths, setDeltaMonths] = useState("")
  const [deltaDays, setDeltaDays] = useState("")

  // --- helpers (UTC-safe to prevent off-by-one bugs) ---
  const toDateUTC = (yyyyMMdd) => {
    if (!yyyyMMdd) return null
    const [y, m, d] = yyyyMMdd.split("-").map(Number)
    if (!y || !m || !d) return null
    return new Date(Date.UTC(y, m - 1, d))
  }

  const formatMMDDYYYY = (dateObj) => {
    if (!dateObj) return ""
    const m = String(dateObj.getUTCMonth() + 1).padStart(2, "0")
    const d = String(dateObj.getUTCDate()).padStart(2, "0")
    const y = dateObj.getUTCFullYear()
    return `${m}/${d}/${y}`
  }

  const todayISO = () => {
    const t = new Date()
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(
      t.getDate()
    ).padStart(2, "0")}`
  }

  const lastDayOfMonthUTC = (year, monthIndex0) =>
    new Date(Date.UTC(year, monthIndex0 + 1, 0)).getUTCDate()

  const addYearsUTC = (dateObj, yearsToAdd) => {
    const y = dateObj.getUTCFullYear()
    const m = dateObj.getUTCMonth()
    const d = dateObj.getUTCDate()
    const newY = y + yearsToAdd
    const maxD = lastDayOfMonthUTC(newY, m)
    return new Date(Date.UTC(newY, m, Math.min(d, maxD)))
  }

  const addMonthsUTC = (dateObj, monthsToAdd) => {
    const y = dateObj.getUTCFullYear()
    const m = dateObj.getUTCMonth()
    const d = dateObj.getUTCDate()

    const total = m + monthsToAdd
    const newY = y + Math.floor(total / 12)
    const newM = ((total % 12) + 12) % 12

    const maxD = lastDayOfMonthUTC(newY, newM)
    return new Date(Date.UTC(newY, newM, Math.min(d, maxD)))
  }

  const addDaysUTC = (dateObj, daysToAdd) =>
    new Date(dateObj.getTime() + daysToAdd * 24 * 60 * 60 * 1000)

  const diffDaysUTC = (a, b) => {
    const msPerDay = 24 * 60 * 60 * 1000
    return Math.round((b.getTime() - a.getTime()) / msPerDay)
  }

  const calcAddSubtract = () => {
    const base = toDateUTC(baseDate)
    if (!base) return null

    const y = parseInt(deltaYears || "0", 10) * sign
    const mo = parseInt(deltaMonths || "0", 10) * sign
    const da = parseInt(deltaDays || "0", 10) * sign

    if (Number.isNaN(y) || Number.isNaN(mo) || Number.isNaN(da)) return null

    let out = addYearsUTC(base, y)
    out = addMonthsUTC(out, mo)
    out = addDaysUTC(out, da)

    return { base, out, totalDayShift: diffDaysUTC(base, out) }
  }

  const calcBetween = () => {
    const start = toDateUTC(startBetween)
    const end = toDateUTC(endBetween)
    if (!start || !end) return null

    // Check if end comes before start (negative days)
    const isReversed = end.getTime() < start.getTime()
    
    // Always calculate from earlier to later date
    const earlier = isReversed ? end : start
    const later = isReversed ? start : end

    const totalDaysExclusive = diffDaysUTC(earlier, later)
    const totalDays = totalDaysExclusive + (includeEndDate ? 1 : 0)
    
    // Apply negative sign if dates are reversed
    const finalTotalDays = isReversed ? -totalDays : totalDays

    // Build Years / Months / Days by stepping forward (always from earlier to later)
    let cursor = new Date(earlier.getTime())

    let years = 0
    while (addYearsUTC(cursor, 1).getTime() <= later.getTime()) {
      cursor = addYearsUTC(cursor, 1)
      years += 1
    }

    let months = 0
    while (addMonthsUTC(cursor, 1).getTime() <= later.getTime()) {
      cursor = addMonthsUTC(cursor, 1)
      months += 1
    }

    const days = diffDaysUTC(cursor, later)
    
    // Apply negative sign to all components if dates are reversed
    const finalYears = isReversed ? -years : years
    const finalMonths = isReversed ? -months : months
    const finalDays = isReversed ? -days : days
    const totalMonths = years * 12 + months
    const finalTotalMonths = isReversed ? -totalMonths : totalMonths

    return {
      start,
      end,
      isReversed,
      earlier,
      later,
      totalDays: finalTotalDays,
      ymd: { years: finalYears, months: finalMonths, days: finalDays },
      md: { months: finalTotalMonths, days: finalDays },
    }
  }

  // Function to swap start and end dates
  const swapDates = () => {
    const temp = startBetween
    setStartBetween(endBetween)
    setEndBetween(temp)
  }

  const addRes = tab === "add" ? calcAddSubtract() : null
  const betweenRes = tab === "between" ? calcBetween() : null

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 z-[9998]" 
        onClick={onClose} 
      />
      <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4 pointer-events-none">
        <div
          className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 pointer-events-auto max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-xl font-semibold text-[#8e3e3e] mb-3">Date Calculator</h2>

          {/* Tabs */}
          <div className="flex gap-2 mb-4 min-w-0">
            <button
              type="button"
              onClick={() => setTab("between")}
              className={`flex-1 min-w-0 rounded-full px-3 sm:px-4 py-2 text-xs sm:text-sm border transition-colors whitespace-nowrap ${
                tab === "between"
                  ? "bg-[#8e3e3e] text-white border-[#8e3e3e]"
                  : "bg-white text-[#6b7db3] border-[#6b7db3] hover:bg-[#e6edf7]"
              }`}
            >
              Days Between
            </button>

            <button
              type="button"
              onClick={() => setTab("add")}
              className={`flex-1 min-w-0 rounded-full px-3 sm:px-4 py-2 text-xs sm:text-sm border transition-colors whitespace-nowrap ${
                tab === "add"
                  ? "bg-[#8e3e3e] text-white border-[#8e3e3e]"
                  : "bg-white text-[#6b7db3] border-[#6b7db3] hover:bg-[#e6edf7]"
              }`}
            >
              Add / Subtract
            </button>
          </div>

          {/* Add/Subtract tab */}
          {tab === "add" && (
            <>
              <div className="bg-[#e6edf7] rounded-2xl p-4 border border-[#d3dceb] mb-4 overflow-hidden">
                <div className="mb-3 min-w-0">
                  <label className="block text-xs font-semibold text-[#6b7db3] mb-1">
                    Base date
                  </label>
                  <input
                    type="date"
                    className="block w-full min-w-0 max-w-full box-border bg-white text-[#6b7db3] border border-[#6b7db3] rounded-full px-4 py-2 text-sm pr-10 min-h-[44px] min-w-[130px]"
                    value={baseDate}
                    onChange={(e) => setBaseDate(e.target.value)}
                    style={{
                      WebkitAppearance: 'none',
                      fontSize: '16px',
                    }}
                  />
                </div>

                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setSign(1)}
                    className={`flex-1 rounded-full px-4 py-2 text-sm border transition-colors ${
                      sign === 1
                        ? "bg-[#c25e5e] text-white border-[#c25e5e]"
                        : "bg-white text-[#6b7db3] border-[#6b7db3] hover:bg-white/70"
                    }`}
                  >
                    Add
                  </button>

                  <button
                    type="button"
                    onClick={() => setSign(-1)}
                    className={`flex-1 rounded-full px-4 py-2 text-sm border transition-colors ${
                      sign === -1
                        ? "bg-[#c25e5e] text-white border-[#c25e5e]"
                        : "bg-white text-[#6b7db3] border-[#6b7db3] hover:bg-white/70"
                    }`}
                  >
                    Subtract
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-[#6b7db3] mb-1">
                      Years
                    </label>
                    <input
                      inputMode="numeric"
                      className="w-full bg-white text-[#6b7db3] border border-[#6b7db3] rounded-full px-3 py-2 text-sm"
                      value={deltaYears}
                      onChange={(e) => setDeltaYears(e.target.value.replace(/[^\d]/g, ""))}
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#6b7db3] mb-1">
                      Months
                    </label>
                    <input
                      inputMode="numeric"
                      className="w-full bg-white text-[#6b7db3] border border-[#6b7db3] rounded-full px-3 py-2 text-sm"
                      value={deltaMonths}
                      onChange={(e) => setDeltaMonths(e.target.value.replace(/[^\d]/g, ""))}
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#6b7db3] mb-1">
                      Days
                    </label>
                    <input
                      inputMode="numeric"
                      className="w-full bg-white text-[#6b7db3] border border-[#6b7db3] rounded-full px-3 py-2 text-sm"
                      value={deltaDays}
                      onChange={(e) => setDeltaDays(e.target.value.replace(/[^\d]/g, ""))}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => setBaseDate(todayISO())}
                    className="rounded-full px-4 py-2 text-sm border border-[#8e3e3e] text-[#8e3e3e] bg-white hover:bg-[#f8d7da] transition-colors"
                  >
                    Use Today
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setBaseDate("")
                      setDeltaYears("")
                      setDeltaMonths("")
                      setDeltaDays("")
                      setSign(1)
                    }}
                    className="rounded-full px-4 py-2 text-sm border border-[#b91c1c] text-[#b91c1c] bg-white hover:bg-[#ffe8e8] transition-colors"
                  >
                    Reset
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-[#e3b0b0] p-4 mb-4">
                <div className="text-sm font-semibold text-[#8e3e3e] mb-2">Result</div>

                {addRes ? (
                  <div className="space-y-2 text-sm">
                    <div className="text-[#6b7db3]">
                      Base:{" "}
                      <span className="font-semibold text-[#8e3e3e]">
                        {formatMMDDYYYY(addRes.base)}
                      </span>
                    </div>

                    <div className="text-[#6b7db3]">
                      New date:{" "}
                      <span className="font-semibold text-[#8e3e3e]">
                        {formatMMDDYYYY(addRes.out)}
                      </span>
                    </div>

                    <div className="text-[#6b7db3]">
                      Net shift:{" "}
                      <span className="font-semibold text-[#8e3e3e]">
                        {addRes.totalDayShift}
                      </span>{" "}
                      days
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-[#6b7db3]">
                    Pick a base date and enter values to see the result.
                  </div>
                )}
              </div>
            </>
          )}
          
        {/* Between tab */}
{tab === "between" && (
  <>
    <div className="bg-[#e6edf7] rounded-2xl p-4 border border-[#d3dceb] mb-4 overflow-hidden">
      {/* Date Inputs with Swap Button in Between */}
      <div className="grid grid-cols-12 gap-2 items-end mb-3">
        {/* Start Date */}
        <div className="col-span-5 min-w-0">
          <label className="block text-xs font-semibold text-[#6b7db3] mb-1">
            Start date
          </label>
          <div className="relative">
            <input
              type="date"
              className="block w-full min-w-0 max-w-full bg-white text-[#6b7db3] border border-[#6b7db3] rounded-full px-4 py-3 text-sm min-h-[48px] min-w-[140px]"
              value={startBetween}
              onChange={(e) => setStartBetween(e.target.value)}
              style={{
                fontSize: '14px',
                lineHeight: '1.5',
                color: '#6b7db3',
              }}
            />
            {/* Custom calendar emoji */}
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none text-[#6b7db3] text-lg">
              📅
            </div>
          </div>
        </div>

        {/* Swap Button (centered) */}
        <div className="col-span-2 flex justify-center items-end h-12">
          {(startBetween || endBetween) && (
            <button
              type="button"
              onClick={swapDates}
              className="rounded-full p-2 border border-[#6b7db3] text-[#6b7db3] bg-white hover:bg-[#e6edf7] transition-colors"
              title="Swap dates"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="m18 4 4 4-4 4"/>
                <path d="M2 8h20"/>
                <path d="m6 20-4-4 4-4"/>
                <path d="M22 16H2"/>
              </svg>
            </button>
          )}
        </div>

        {/* End Date */}
        <div className="col-span-5 min-w-0">
          <label className="block text-xs font-semibold text-[#6b7db3] mb-1">
            End date
          </label>
          <div className="relative">
            <input
              type="date"
              className="block w-full min-w-0 max-w-full bg-white text-[#6b7db3] border border-[#6b7db3] rounded-full px-4 py-3 text-sm min-h-[48px] min-w-[140px]"
              value={endBetween}
              onChange={(e) => setEndBetween(e.target.value)}
              style={{
                fontSize: '14px',
                lineHeight: '1.5',
                color: '#6b7db3',
              }}
            />
            {/* Custom calendar emoji */}
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none text-[#6b7db3] text-lg">
              📅
            </div>
          </div>
        </div>
      </div>

      <label className="flex items-center gap-2 mt-3 text-sm text-[#6b7db3] select-none">
        <input
          type="checkbox"
          checked={includeEndDate}
          onChange={(e) => setIncludeEndDate(e.target.checked)}
          className="h-5 w-5 rounded border border-[#6b7db3] accent-[#8e3e3e]"
        />
        Include end date in calculation (+1 day is added)
      </label>

      <div className="flex flex-wrap gap-2 mt-3">
        <button
          type="button"
          onClick={() => setStartBetween(todayISO())}
          className="rounded-full px-4 py-2 text-sm border border-[#8e3e3e] text-[#8e3e3e] bg-white hover:bg-[#f8d7da] transition-colors"
        >
          Start = Today
        </button>

        <button
          type="button"
          onClick={() => {
            setStartBetween("")
            setEndBetween("")
            setIncludeEndDate(false)
          }}
          className="rounded-full px-4 py-2 text-sm border border-[#b91c1c] text-[#b91c1c] bg-white hover:bg-[#ffe8e8] transition-colors"
        >
          Reset
        </button>
      </div>
    </div>

    {/* Results Box - REMOVED "Result" header */}
    <div className="bg-white rounded-2xl border border-[#e3b0b0] p-4 mb-4">
      {betweenRes ? (
        <div className="space-y-3">
          {/* Date Display - REMOVED "Date Range" header */}
          <div className="text-center">
            <div className="text-[#8e3e3e] font-semibold text-sm mb-1">
              {formatMMDDYYYY(betweenRes.start)} → {formatMMDDYYYY(betweenRes.end)}
            </div>
            {betweenRes.isReversed && (
              <div className="text-xs text-red-500">
                (End date is earlier than start date)
              </div>
            )}
          </div>

          {/* Separator */}
          <div className="border-t border-[#e3b0b0] my-2"></div>

          {/* Results in Grid - More Compact */}
          <div className="grid gap-2">
            {/* Days */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-[#6b7db3]">Days</div>
              <div className={`font-semibold ${betweenRes.totalDays < 0 ? 'text-red-500' : 'text-[#8e3e3e]'}`}>
                {Math.abs(betweenRes.totalDays).toLocaleString()}
                {betweenRes.totalDays < 0 && ' (negative)'}
              </div>
            </div>

            {/* Weeks */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-[#6b7db3]">Weeks</div>
              <div className={`font-semibold ${betweenRes.isReversed ? 'text-red-500' : 'text-[#8e3e3e]'}`}>
                {Math.floor(Math.abs(betweenRes.totalDays) / 7)} Weeks{" "}
                {Math.abs(betweenRes.totalDays) % 7} Days
              </div>
            </div>

            {/* Months */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-[#6b7db3]">Months</div>
              <div className={`font-semibold ${betweenRes.isReversed ? 'text-red-500' : 'text-[#8e3e3e]'}`}>
                {Math.abs(betweenRes.md.months)} Months{" "}
                {Math.abs(betweenRes.md.days)} Days
              </div>
            </div>

            {/* Years */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-[#6b7db3]">Years</div>
              <div className={`font-semibold ${betweenRes.isReversed ? 'text-red-500' : 'text-[#8e3e3e]'}`}>
                {Math.abs(betweenRes.ymd.years)} Years{" "}
                {Math.abs(betweenRes.ymd.days)} Days
              </div>
            </div>

            {/* Years & Months */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-[#6b7db3]">Years & Months</div>
              <div className={`font-semibold ${betweenRes.isReversed ? 'text-red-500' : 'text-[#8e3e3e]'}`}>
                {Math.abs(betweenRes.ymd.years)} Years{" "}
                {Math.abs(betweenRes.ymd.months)} Months{" "}
                {Math.abs(betweenRes.ymd.days)} Days
              </div>
            </div>
          </div>

          {/* Include End Date Note */}
          {includeEndDate && (
            <div className="text-xs text-[#6b7db3] italic text-center pt-2 border-t border-[#e3b0b0] mt-2">
              * End date included in calculation (+1 day added)
            </div>
          )}
        </div>
      ) : (
        <div className="text-sm text-[#6b7db3] py-3 text-center">
          Pick a start and end date to see the result.
        </div>
      )}
    </div>
  </>
)}

          <Button onClick={onClose} className="w-full bg-[#8e3e3e] hover:bg-[#7a3434]">
            Close
          </Button>
        </div>
      </div>
    </>
  )
}