import { useEffect, useState } from "react";
import axios from "axios";
import { ChevronLeft, ChevronRight, Star, Zap, Clock, HelpCircle } from "lucide-react";
import { Button } from "./ui/Button";

export default function DateToolsModal({
  onClose,
  isTorontoMode,
  setIsTorontoMode,
  torontoDate,
  matchingRealDate,
  matchingRealLabel,
  setCurrentYear,
  setCurrentMonth,
  setCurrentDay,
  onShowTNInfo,
}) {
  const [tab, setTab] = useState("calendar");
const [showTNExplanation, setShowTNExplanation] = useState(false);
  const getInitialSelectedDate = () => {
  const params = new URLSearchParams(window.location.search);
  const dateParam = params.get("date");

  if (dateParam) {
    const parsed = new Date(dateParam + "T00:00:00");
    if (!isNaN(parsed.getTime())) return parsed;
  }

  return new Date();
};

const initialSelectedDate = getInitialSelectedDate();
const today = new Date();

const [calendarMonth, setCalendarMonth] = useState(initialSelectedDate.getMonth());
const [calendarYear, setCalendarYear] = useState(initialSelectedDate.getFullYear());
const [selectedDate, setSelectedDate] = useState(initialSelectedDate);
const [dateEventsMap, setDateEventsMap] = useState({});

useEffect(() => {
  const originalStyle = window.getComputedStyle(document.body).overflow;
  document.body.style.overflow = "hidden";

  return () => {
    document.body.style.overflow = originalStyle;
  };
}, []);

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
      );

      const eventsMap = {};
      response.data.records?.forEach((record) => {
        const raw = record.fields.DATE;
        if (!raw) return;

        const [datePart] = raw.split("T");
        const [yearStr, monthStr, dayStr] = datePart.split("-");
        if (!yearStr || !monthStr || !dayStr) return;

        const y = Number(yearStr);
        const m = Number(monthStr);
        const d = Number(dayStr);

        const dateKey = `${y}-${m}-${d}`;
        eventsMap[dateKey] = true;
      });

      setDateEventsMap((prev) => ({ ...prev, ...eventsMap }));
    } catch (error) {
      console.error("Error fetching calendar events:", error);
    }
  };

  fetchEventsForMonth(calendarMonth + 1, calendarYear);
}, [calendarMonth, calendarYear]);

const getDaysInMonth = (month, year) => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (month, year) => {
  return new Date(year, month, 1).getDay();
};

const generateCalendar = () => {
  const daysInMonth = getDaysInMonth(calendarMonth, calendarYear);
  const firstDay = getFirstDayOfMonth(calendarMonth, calendarYear);
  const calendar = [];

  for (let i = 0; i < firstDay; i++) {
    calendar.push(null);
  }

  for (let i = 1; i <= daysInMonth; i++) {
    calendar.push(i);
  }

  while (calendar.length < 42) {
    calendar.push(null);
  }

  return calendar;
};

const hasEvents = (day) => {
  if (!day) return false;
  const dateKey = `${calendarYear}-${calendarMonth + 1}-${day}`;
  return !!dateEventsMap[dateKey];
};

const handleDateSelect = (day) => {
  if (!day) return;

  const newSelectedDate = new Date(calendarYear, calendarMonth, day);
  setSelectedDate(newSelectedDate);

  const formattedDate = `${newSelectedDate.getFullYear()}-${String(
    newSelectedDate.getMonth() + 1
  ).padStart(2, "0")}-${String(newSelectedDate.getDate()).padStart(2, "0")}`;

  window.location.search = `?date=${formattedDate}`;
};

const navigateCalendarMonth = (direction) => {
  if (direction === "prev") {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear(calendarYear - 1);
    } else {
      setCalendarMonth(calendarMonth - 1);
    }
  } else {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear(calendarYear + 1);
    } else {
      setCalendarMonth(calendarMonth + 1);
    }
  }
};

const jumpToThisMonth = () => {
  const now = new Date();
  setCalendarMonth(now.getMonth());
  setCalendarYear(now.getFullYear());
};

const jumpToToday = () => {
  const now = new Date();
  setSelectedDate(now);
  setCalendarMonth(now.getMonth());
  setCalendarYear(now.getFullYear());

  const formattedDate = `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  window.location.search = `?date=${formattedDate}`;
};

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// --- Calculator tabs/state ---
const [calculatorTab, setCalculatorTab] = useState("between");
const [includeEndDate, setIncludeEndDate] = useState(false);
const [startBetween, setStartBetween] = useState("");
const [endBetween, setEndBetween] = useState("");

const [baseDate, setBaseDate] = useState(() => {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(
    t.getDate()
  ).padStart(2, "0")}`;
});

const [sign, setSign] = useState(1);
const [deltaYears, setDeltaYears] = useState("");
const [deltaMonths, setDeltaMonths] = useState("");
const [deltaDays, setDeltaDays] = useState("");

// --- Calculator helpers ---
const toDateUTC = (yyyyMMdd) => {
  if (!yyyyMMdd) return null;
  const [y, m, d] = yyyyMMdd.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(Date.UTC(y, m - 1, d));
};

const formatMMDDYYYY = (dateObj) => {
  if (!dateObj) return "";
  const m = String(dateObj.getUTCMonth() + 1).padStart(2, "0");
  const d = String(dateObj.getUTCDate()).padStart(2, "0");
  const y = dateObj.getUTCFullYear();
  return `${m}/${d}/${y}`;
};

const todayISO = () => {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(
    t.getDate()
  ).padStart(2, "0")}`;
};

const lastDayOfMonthUTC = (year, monthIndex0) =>
  new Date(Date.UTC(year, monthIndex0 + 1, 0)).getUTCDate();

const addYearsUTC = (dateObj, yearsToAdd) => {
  const y = dateObj.getUTCFullYear();
  const m = dateObj.getUTCMonth();
  const d = dateObj.getUTCDate();
  const newY = y + yearsToAdd;
  const maxD = lastDayOfMonthUTC(newY, m);
  return new Date(Date.UTC(newY, m, Math.min(d, maxD)));
};

const addMonthsUTC = (dateObj, monthsToAdd) => {
  const y = dateObj.getUTCFullYear();
  const m = dateObj.getUTCMonth();
  const d = dateObj.getUTCDate();

  const total = m + monthsToAdd;
  const newY = y + Math.floor(total / 12);
  const newM = ((total % 12) + 12) % 12;

  const maxD = lastDayOfMonthUTC(newY, newM);
  return new Date(Date.UTC(newY, newM, Math.min(d, maxD)));
};

const addDaysUTC = (dateObj, daysToAdd) =>
  new Date(dateObj.getTime() + daysToAdd * 24 * 60 * 60 * 1000);

const diffDaysUTC = (a, b) => {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((b.getTime() - a.getTime()) / msPerDay);
};

const calcAddSubtract = () => {
  const base = toDateUTC(baseDate);
  if (!base) return null;

  const y = parseInt(deltaYears || "0", 10) * sign;
  const mo = parseInt(deltaMonths || "0", 10) * sign;
  const da = parseInt(deltaDays || "0", 10) * sign;

  if (Number.isNaN(y) || Number.isNaN(mo) || Number.isNaN(da)) return null;

  let out = addYearsUTC(base, y);
  out = addMonthsUTC(out, mo);
  out = addDaysUTC(out, da);

  return { base, out, totalDayShift: diffDaysUTC(base, out) };
};

const calcBetween = () => {
  const start = toDateUTC(startBetween);
  const end = toDateUTC(endBetween);
  if (!start || !end) return null;

  const isReversed = end.getTime() < start.getTime();
  const earlier = isReversed ? end : start;
  const later = isReversed ? start : end;

  const totalDaysExclusive = diffDaysUTC(earlier, later);
  const totalDays = totalDaysExclusive + (includeEndDate ? 1 : 0);
  const finalTotalDays = isReversed ? -totalDays : totalDays;

  let yCursor = new Date(earlier.getTime());
  let yOnlyYears = 0;
  while (addYearsUTC(yCursor, 1).getTime() <= later.getTime()) {
    yCursor = addYearsUTC(yCursor, 1);
    yOnlyYears += 1;
  }
  const yOnlyDays = diffDaysUTC(yCursor, later);

  let cursor = new Date(earlier.getTime());

  let years = 0;
  while (addYearsUTC(cursor, 1).getTime() <= later.getTime()) {
    cursor = addYearsUTC(cursor, 1);
    years += 1;
  }

  let months = 0;
  while (addMonthsUTC(cursor, 1).getTime() <= later.getTime()) {
    cursor = addMonthsUTC(cursor, 1);
    months += 1;
  }

  const days = diffDaysUTC(cursor, later);

  const finalYears = isReversed ? -years : years;
  const finalMonths = isReversed ? -months : months;
  const finalDays = isReversed ? -days : days;
  const totalMonths = years * 12 + months;
  const finalTotalMonths = isReversed ? -totalMonths : totalMonths;

  return {
    start,
    end,
    isReversed,
    earlier,
    later,
    totalDays: finalTotalDays,
    yOnly: {
      years: isReversed ? -yOnlyYears : yOnlyYears,
      days: isReversed ? -yOnlyDays : yOnlyDays,
    },
    ymd: { years: finalYears, months: finalMonths, days: finalDays },
    md: { months: finalTotalMonths, days: finalDays },
  };
};

const swapDates = () => {
  const temp = startBetween;
  setStartBetween(endBetween);
  setEndBetween(temp);
};

const addRes = calculatorTab === "add" ? calcAddSubtract() : null;
const betweenRes = calculatorTab === "between" ? calcBetween() : null;
  
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
          <h2 className="text-xl font-semibold text-[#8e3e3e] mb-3">
            Date Tools
          </h2>

          <div className="flex gap-2 mb-4 min-w-0">
            <button
              type="button"
              onClick={() => setTab("calendar")}
              className={`flex-1 min-w-0 rounded-full px-3 py-2 text-xs sm:text-sm border transition-colors whitespace-nowrap ${
                tab === "calendar"
                  ? "bg-[#8a9ac7] text-white border-[#8a9ac7]"
                  : "bg-white text-[#6b7db3] border-[#6b7db3] hover:bg-[#e6edf7]"
              }`}
            >
              Calendar
            </button>

            <button
              type="button"
              onClick={() => setTab("calculator")}
              className={`flex-1 min-w-0 rounded-full px-3 py-2 text-xs sm:text-sm border transition-colors whitespace-nowrap ${
                tab === "calculator"
                  ? "bg-[#8a9ac7] text-white border-[#8a9ac7]"
                  : "bg-white text-[#6b7db3] border-[#6b7db3] hover:bg-[#e6edf7]"
              }`}
            >
              Calculator
            </button>

            <button
              type="button"
              onClick={() => setTab("tn")}
              className={`flex-1 min-w-0 rounded-full px-3 py-2 text-xs sm:text-sm border transition-colors whitespace-nowrap ${
                tab === "tn"
                  ? "bg-[#8a9ac7] text-white border-[#8a9ac7]"
                  : "bg-white text-[#6b7db3] border-[#6b7db3] hover:bg-[#e6edf7]"
              }`}
            >
              TN Timeline
            </button>
          </div>

          <div className="mb-4">
            {tab === "calendar" && (
  <>
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

    <div className="grid grid-cols-7 gap-1 mb-2">
      {dayNames.map((day) => (
        <div
          key={day}
          className="text-center text-xs font-semibold text-[#6b7db3] py-1"
        >
          {day}
        </div>
      ))}
    </div>

    <div className="grid grid-cols-7 gap-1">
      {generateCalendar().map((day, index) => {
        const isEmpty = !day;
        let isSelected = false;

        if (!isEmpty) {
          isSelected =
            day === selectedDate.getDate() &&
            calendarMonth === selectedDate.getMonth() &&
            calendarYear === selectedDate.getFullYear();
        }

        const baseClasses =
          "relative h-8 rounded-lg text-sm font-medium transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center";

        const visibilityClasses = isEmpty ? "invisible" : "";
        const stateClasses = isSelected
          ? "bg-[#8e3e3e] text-white shadow-md scale-105"
          : "bg-white/80 text-[#8e3e3e] hover:bg-[#f8d7da]";
        const borderClasses = hasEvents(day)
          ? "border-2 border-[#e3b0b0]"
          : "border border-transparent";

        return (
          <button
            key={index}
            type="button"
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
        );
      })}
    </div>

    <div className="flex justify-center mt-4">
  <Button
    variant="secondary"
    onClick={onClose}
    className="rounded-full px-6 w-full max-w-xs"
  >
    Close
  </Button>
</div>
  </>
)}

            {tab === "calculator" && (
  <>
    <div className="flex gap-2 mb-4 min-w-0">
      <button
        type="button"
        onClick={() => setCalculatorTab("between")}
        className={`flex-1 min-w-0 rounded-full px-3 sm:px-4 py-2 text-xs sm:text-sm border transition-colors whitespace-nowrap ${
          calculatorTab === "between"
            ? "bg-[#8e3e3e] text-white border-[#8e3e3e]"
            : "bg-white text-[#6b7db3] border-[#6b7db3] hover:bg-[#e6edf7]"
        }`}
      >
        Days Between
      </button>

      <button
        type="button"
        onClick={() => setCalculatorTab("add")}
        className={`flex-1 min-w-0 rounded-full px-3 sm:px-4 py-2 text-xs sm:text-sm border transition-colors whitespace-nowrap ${
          calculatorTab === "add"
            ? "bg-[#8e3e3e] text-white border-[#8e3e3e]"
            : "bg-white text-[#6b7db3] border-[#6b7db3] hover:bg-[#e6edf7]"
        }`}
      >
        Add / Subtract
      </button>
    </div>

    {calculatorTab === "add" && (
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
                WebkitAppearance: "none",
                fontSize: "16px",
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
                setBaseDate("");
                setDeltaYears("");
                setDeltaMonths("");
                setDeltaDays("");
                setSign(1);
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

    {calculatorTab === "between" && (
      <>
        <div className="bg-[#e6edf7] rounded-2xl p-4 border border-[#d3dceb] mb-4 overflow-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="min-w-0">
              <label className="block text-xs font-semibold text-[#6b7db3] mb-1">
                Start date
              </label>
              <input
                type="date"
                className="block w-full min-w-0 max-w-full box-border appearance-none bg-white text-[#6b7db3] border border-[#6b7db3] rounded-full px-4 py-2 text-sm pr-10 min-h-[44px] min-w-[130px]"
                value={startBetween}
                onChange={(e) => setStartBetween(e.target.value)}
                style={{
                  WebkitAppearance: "none",
                  fontSize: "16px",
                }}
              />
            </div>

            <div className="min-w-0">
              <label className="block text-xs font-semibold text-[#6b7db3] mb-1">
                End date
              </label>
              <input
                type="date"
                className="block w-full min-w-0 max-w-full box-border appearance-none bg-white text-[#6b7db3] border border-[#6b7db3] rounded-full px-4 py-2 text-sm pr-10 min-h-[44px] min-w-[130px]"
                value={endBetween}
                onChange={(e) => setEndBetween(e.target.value)}
                style={{
                  WebkitAppearance: "none",
                  fontSize: "16px",
                }}
              />
            </div>
          </div>

          {startBetween && endBetween && (
            <div className="flex justify-center mt-3">
              <button
                type="button"
                onClick={swapDates}
                className="rounded-full border border-[#6b7db3] text-[#6b7db3] bg-white hover:bg-[#e6edf7] transition-colors h-10 w-10 flex items-center justify-center"
                title="Swap dates"
                aria-label="Swap dates"
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
                  <path d="m18 4 4 4-4 4" />
                  <path d="M2 8h20" />
                  <path d="m6 20-4-4 4-4" />
                  <path d="M22 16H2" />
                </svg>
              </button>
            </div>
          )}

          <label className="flex items-center gap-2 mt-3 text-sm text-[#6b7db3] select-none">
            <input
              type="checkbox"
              checked={includeEndDate}
              onChange={(e) => setIncludeEndDate(e.target.checked)}
              className="h-5 w-5 rounded border border-[#6b7db3] accent-[#8e3e3e]"
            />
            Include end date in calculation (1 day is added)
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
                setStartBetween("");
                setEndBetween("");
                setIncludeEndDate(false);
              }}
              className="rounded-full px-4 py-2 text-sm border border-[#b91c1c] text-[#b91c1c] bg-white hover:bg-[#ffe8e8] transition-colors"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#e3b0b0] p-4 mb-4">
          <div className="text-sm font-semibold text-[#8e3e3e] mb-2">Result</div>

          {betweenRes ? (
            <div className="space-y-3">
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

              <div className="border-t border-[#e3b0b0] my-2" />

              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-[#6b7db3]">Days</div>
                  <div
                    className={`font-semibold ${
                      betweenRes.totalDays < 0 ? "text-red-500" : "text-[#8e3e3e]"
                    }`}
                  >
                    {betweenRes.totalDays < 0 ? "-" : ""}
                    {Math.abs(betweenRes.totalDays).toLocaleString()} Days
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-[#6b7db3]">Weeks</div>
                  <div
                    className={`font-semibold ${
                      betweenRes.isReversed ? "text-red-500" : "text-[#8e3e3e]"
                    }`}
                  >
                    {betweenRes.isReversed ? "-" : ""}
                    {Math.floor(Math.abs(betweenRes.totalDays) / 7)} Weeks{" "}
                    {Math.abs(betweenRes.totalDays) % 7} Days
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-[#6b7db3]">Months</div>
                  <div
                    className={`font-semibold ${
                      betweenRes.isReversed ? "text-red-500" : "text-[#8e3e3e]"
                    }`}
                  >
                    {betweenRes.isReversed ? "-" : ""}
                    {Math.abs(betweenRes.md.months)} Months{" "}
                    {Math.abs(betweenRes.md.days)} Days
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-[#6b7db3]">Years</div>
                  <div
                    className={`font-semibold ${
                      betweenRes.isReversed ? "text-red-500" : "text-[#8e3e3e]"
                    }`}
                  >
                    {betweenRes.isReversed ? "-" : ""}
                    {Math.abs(betweenRes.yOnly.years)} Years{" "}
                    {Math.abs(betweenRes.yOnly.days)} Days
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-[#6b7db3]">Years & Months</div>
                  <div
                    className={`font-semibold ${
                      betweenRes.isReversed ? "text-red-500" : "text-[#8e3e3e]"
                    }`}
                  >
                    {betweenRes.isReversed ? "-" : ""}
                    {Math.abs(betweenRes.ymd.years)} Years{" "}
                    {Math.abs(betweenRes.ymd.months)} Months{" "}
                    {Math.abs(betweenRes.ymd.days)} Days
                  </div>
                </div>
              </div>

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

        <div className="flex justify-center mt-4">
          <Button
            variant="secondary"
            onClick={onClose}
            className="rounded-full px-6 w-full max-w-xs"
          >
            Close
          </Button>
        </div>
      </>
    )}
  </>
)}

            {tab === "tn" && (
  <>
    <div className="bg-[#eef0fb] rounded-2xl p-4 border border-[#d3dceb] mb-4">
  <div className="text-sm text-[#6b7db3] leading-relaxed text-center">
    Jump between the real date and the matching Taylor Nation timeline date.
  </div>
</div>

    <div className="bg-white rounded-2xl border border-[#e3b0b0] p-4 mb-4 text-center">
      {isTorontoMode ? (
        <>
          <div className="text-xs font-semibold uppercase tracking-wide text-[#6b7db3] mb-2">
            Currently Viewing
          </div>
          <div className="text-lg font-semibold text-[#8e3e3e] mb-3">
            TN Timeline Mode
          </div>
          <div className="text-sm text-[#6b7db3] mb-4">
  Real date:
  <span className="font-semibold text-[#8e3e3e]"> {matchingRealLabel}</span>
</div>

          <Button
            variant="secondary"
            onClick={() => {
              setCurrentYear(matchingRealDate.getFullYear());
              setCurrentMonth(matchingRealDate.getMonth() + 1);
              setCurrentDay(matchingRealDate.getDate());
              setIsTorontoMode(false);
              onClose();
            }}
            className="rounded-full px-6 w-full max-w-xs"
          >
            <ChevronLeft size={14} className="mr-1" />
            Return to Real Date
          </Button>
        </>
      ) : (
        <>
          <div className="text-xs font-semibold uppercase tracking-wide text-[#6b7db3] mb-2">
            Taylor Nation Timeline Date
          </div>
          <div className="text-lg font-semibold text-[#8e3e3e] mb-3">
            {torontoDate.toLocaleDateString("en-US", {
              month: "short",
              day: "2-digit",
              year: "numeric",
            })}
          </div>
          <div className="text-sm text-[#6b7db3] mb-4">
  Matching date for the currently selected day.
</div>

          <Button
            variant="secondary"
            onClick={() => {
              setCurrentYear(torontoDate.getFullYear());
              setCurrentMonth(torontoDate.getMonth() + 1);
              setCurrentDay(torontoDate.getDate());
              setIsTorontoMode(true);
              onClose();
            }}
            className="rounded-full px-6 w-full max-w-xs"
          >
            Switch to TN Timeline
          </Button>
        </>
      )}
    </div>

    <div className="flex justify-center mt-4">
  <button
    type="button"
    onClick={() => setShowTNExplanation((prev) => !prev)}
    className="inline-flex items-center text-sm text-[#b66b6b] underline decoration-dotted hover:text-[#8e3e3e]"
  >
    <HelpCircle size={14} className="mr-1" />
    {showTNExplanation ? "Hide explanation" : "What is this?"}
  </button>
</div>

    <div className="flex justify-center mt-4">
      <Button
        variant="secondary"
        onClick={onClose}
        className="rounded-full px-6 w-full max-w-xs"
      >
        Close
      </Button>
    </div>
  </>
)}
          </div>
        </div>
      </div>
    </>
  );
}