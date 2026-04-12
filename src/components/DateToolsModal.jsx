import { useEffect, useState } from "react";
import { Button } from "./ui/Button";

export default function DateToolsModal({ onClose }) {
  const [tab, setTab] = useState("calendar");
  const today = new Date();
const [calendarMonth, setCalendarMonth] = useState(today.getMonth());
const [calendarYear, setCalendarYear] = useState(today.getFullYear());
const [selectedDate, setSelectedDate] = useState(today);
const [dateEventsMap, setDateEventsMap] = useState({});

  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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

const handleDateSelect = (day) => {
  if (!day) return;

  const selectedDate = new Date(calendarYear, calendarMonth, day);
  const formattedDate = `${selectedDate.getFullYear()}-${String(
    selectedDate.getMonth() + 1
  ).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;

  window.location.search = `?date=${formattedDate}`;
};
  
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

          <div className="bg-[#eef0fb] border border-[#c5cae9] rounded-2xl p-4 mb-4">
            {tab === "calendar" && (
  <div>
    <div className="flex gap-2 mb-4">
      <Button
        variant="outline"
        size="sm"
        onClick={jumpToThisMonth}
        className="flex-1 text-xs py-1 h-auto"
      >
        This Month
      </Button>
    </div>

    <div className="flex items-center justify-between mb-2">
      <button
        type="button"
        onClick={() => navigateCalendarMonth("prev")}
        className="p-2 rounded-full hover:bg-[#f8d7da] transition-colors"
      >
        ‹
      </button>

      <div className="text-lg font-semibold text-[#8e3e3e]">
        {monthNames[calendarMonth]} {calendarYear}
      </div>

      <button
        type="button"
        onClick={() => navigateCalendarMonth("next")}
        className="p-2 rounded-full hover:bg-[#f8d7da] transition-colors"
      >
        ›
      </button>
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

        return (
          <button
            key={index}
            type="button"
            onClick={() => handleDateSelect(day)}
            disabled={isEmpty}
            className={`relative h-8 rounded-lg text-sm font-medium flex items-center justify-center transition-all ${
              isEmpty
                ? "invisible"
                : "bg-white/80 text-[#8e3e3e] hover:bg-[#f8d7da] border border-transparent"
            }`}
          >
            {!isEmpty && <span>{day}</span>}
          </button>
        );
      })}
    </div>
  </div>
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