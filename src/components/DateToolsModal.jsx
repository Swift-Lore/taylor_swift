import { useEffect, useState } from "react";
import axios from "axios";
import { ChevronLeft, ChevronRight, Star, Zap, Clock } from "lucide-react";
import { Button } from "./ui/Button";

export default function DateToolsModal({ onClose }) {
  const [tab, setTab] = useState("calendar");
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

    <div className="flex gap-2 justify-center mt-4">
      <Button
        variant="secondary"
        onClick={onClose}
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
  </>
)}

            {tab === "calculator" && (
              <div className="text-sm text-[#3d3d6b]">
                Calculator tab placeholder
              </div>
            )}

            {tab === "tn" && (
              <div className="text-sm text-[#3d3d6b]">
                TN Timeline tab placeholder
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button
              variant="secondary"
              onClick={onClose}
              className="rounded-full px-4"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}