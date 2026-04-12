import { useEffect, useState } from "react";
import { Button } from "./ui/Button";

export default function DateToolsModal({ onClose }) {
  const [tab, setTab] = useState("calendar");
  const today = new Date();
const [calendarMonth, setCalendarMonth] = useState(today.getMonth());
const [calendarYear, setCalendarYear] = useState(today.getFullYear());

  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

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
              <div className="text-sm text-[#3d3d6b]">
                Calendar tab placeholder
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