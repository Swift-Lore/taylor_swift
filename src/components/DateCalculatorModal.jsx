"use client"

import { useState, useEffect } from "react"
import { Button } from "./ui/Button"

export default function DateCalculatorModal({ onClose }) {
  const [tab, setTab] = useState("add")

  const todayISO = () => {
    const t = new Date()
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(
      t.getDate()
    ).padStart(2, "0")}`
  }

  // ===== Add / Subtract =====
  const [baseDate, setBaseDate] = useState(todayISO())
  const [deltaYears, setDeltaYears] = useState("0")
  const [deltaMonths, setDeltaMonths] = useState("0")
  const [deltaDays, setDeltaDays] = useState("0")
  const [sign, setSign] = useState(1)
  const [addRes, setAddRes] = useState(null)

  // ===== Between =====
  const [startBetween, setStartBetween] = useState(todayISO())
  const [endBetween, setEndBetween] = useState(todayISO())
  const [includeEnd, setIncludeEnd] = useState(false)
  const [betweenRes, setBetweenRes] = useState(null)

  const formatMMDDYYYY = (date) =>
    date.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" })

  // ===== CALCULATIONS =====
  useEffect(() => {
    if (!baseDate) return

    const d = new Date(baseDate)
    if (isNaN(d)) return

    const out = new Date(d)
    out.setFullYear(out.getFullYear() + sign * Number(deltaYears || 0))
    out.setMonth(out.getMonth() + sign * Number(deltaMonths || 0))
    out.setDate(out.getDate() + sign * Number(deltaDays || 0))

    const diff =
      Math.round((out.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)) || 0

    setAddRes({
      base: d,
      out,
      totalDayShift: Math.abs(diff),
    })
  }, [baseDate, deltaYears, deltaMonths, deltaDays, sign])

  useEffect(() => {
    if (!startBetween || !endBetween) {
      setBetweenRes(null)
      return
    }

    const start = new Date(startBetween)
    const end = new Date(endBetween)
    if (isNaN(start) || isNaN(end)) return

    let totalDays = Math.round((end - start) / (1000 * 60 * 60 * 24))
    if (includeEnd) totalDays += 1

    setBetweenRes({
      start,
      end,
      totalDays,
    })
  }, [startBetween, endBetween, includeEnd])

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold text-[#8e3e3e] mb-4">
          Date Calculator
        </h2>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={tab === "add" ? "default" : "outline"}
            className="flex-1"
            onClick={() => setTab("add")}
          >
            Add / Subtract
          </Button>
          <Button
            variant={tab === "between" ? "default" : "outline"}
            className="flex-1"
            onClick={() => setTab("between")}
          >
            Days Between
          </Button>
        </div>

        {tab === "add" && (
          <>
            <label className="block text-sm mb-1">Base date</label>
            <input
              type="date"
              value={baseDate}
              onChange={(e) => setBaseDate(e.target.value)}
              className="w-full mb-2"
            />

            <div className="grid grid-cols-3 gap-2 mb-2">
              <input value={deltaYears} onChange={(e) => setDeltaYears(e.target.value)} />
              <input value={deltaMonths} onChange={(e) => setDeltaMonths(e.target.value)} />
              <input value={deltaDays} onChange={(e) => setDeltaDays(e.target.value)} />
            </div>

            {addRes && (
              <div className="text-sm mt-2">
                New date: <strong>{formatMMDDYYYY(addRes.out)}</strong>
              </div>
            )}
          </>
        )}

        {tab === "between" && (
          <>
            <label className="block text-sm mb-1">Start date</label>
            <input
              type="date"
              value={startBetween}
              onChange={(e) => setStartBetween(e.target.value)}
              className="w-full mb-2"
            />

            <label className="block text-sm mb-1">End date</label>
            <input
              type="date"
              value={endBetween}
              onChange={(e) => setEndBetween(e.target.value)}
              className="w-full mb-2"
            />

            <label className="flex items-center gap-2 text-sm mt-2">
              <input
                type="checkbox"
                checked={includeEnd}
                onChange={(e) => setIncludeEnd(e.target.checked)}
              />
              Include end date
            </label>

            {betweenRes && (
              <div className="text-sm mt-2">
                Total days: <strong>{betweenRes.totalDays}</strong>
              </div>
            )}
          </>
        )}

        <Button onClick={onClose} className="w-full mt-4">
          Close
        </Button>
      </div>
    </div>
  )
}
