import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import axios from "axios"

const formatDate = (dateString) => {
  if (!dateString) return ""
  const date = new Date(dateString)
  const options = { month: "short", day: "2-digit", year: "numeric", timeZone: "UTC" }
  return date.toLocaleDateString("en-US", options)
}

const getDaysSince = (dateString) => {
  if (!dateString) return null
  const [year, month, day] = dateString.split("T")[0].split("-").map(Number)
  const eventDate = new Date(year, month - 1, day)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.floor((today - eventDate) / (1000 * 60 * 60 * 24))
  return diff
}

const EventCard = ({ record }) => {
  const handleClick = (e) => {
    const sel = window.getSelection()
    if (sel && sel.toString().length > 0) e.preventDefault()
  }
  const handleCopy = (e) => {
    const selection = window.getSelection()
    if (!selection) return
    const text = selection.toString()
    if (!text) return
    e.preventDefault()
    e.clipboardData.setData("text/plain", text)
  }
  return (
    <Link
      to={`/post_details?id=${record.id}`}
      className="block bg-[#eef0fb] border border-[#c5cae9] rounded-xl p-3 hover:shadow-md hover:border-[#8a9ac7] transition-all duration-200"
      draggable={false}
      onDragStart={(e) => e.preventDefault()}
      onClick={handleClick}
      onCopy={handleCopy}
    >
      <div className="flex items-start gap-2">
        <span className="shrink-0 bg-[#8a9ac7] text-white text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap">
          {formatDate(record.fields?.DATE)}
        </span>
      </div>
      <h3 className="text-[#3d3d6b] font-medium text-xs mt-2 line-clamp-2 leading-relaxed">
        {record.fields?.EVENT || "Untitled Event"}
      </h3>
      {record.fields?.KEYWORDS?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {record.fields.KEYWORDS.slice(0, 3).map((kw, i) => (
            <span key={i} className="bg-[#c5cae9] text-[#3d3d6b] text-[10px] px-1.5 py-0.5 rounded-full">
              {kw}
            </span>
          ))}
        </div>
      )}
    </Link>
  )
}

const TRACKER_LABELS = {
  "LAST SEEN": "Last Seen",
  "LAST OFFICIAL APPEARANCE": "Last Official Appearance",
  "LAST SOCIAL MEDIA POST": "Last Social Media Post",
  "LAST MUSIC RELEASE": "Last Music Release",
  "LAST INTERVIEW": "Last Interview",
  "LAST LIVE PERFORMANCE": "Last Live Performance",
  "LAST MEREDITH SIGHTING": "Last Meredith Sighting",
  "LAST OLIVIA SIGHTING": "Last Olivia Sighting",
  "LAST BENJAMIN BUTTON SIGHTING": "Last Benjamin Button Sighting",
}

const TRACKER_KEYS = Object.keys(TRACKER_LABELS)

export default function RecentEvents() {
  const [recent, setRecent] = useState([])
  const [upcoming, setUpcoming] = useState([])
  const [trackerData, setTrackerData] = useState({})
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("recent")

  useEffect(() => {
    const fetchEvents = async () => {
      const today = new Date().toISOString().split("T")[0]
      try {
        const trackerFetches = TRACKER_KEYS.map((key) =>
          axios.get(
            "https://api.airtable.com/v0/appVhtDyx0VKlGbhy/Taylor%20Swift%20Master%20Tracker",
            {
              headers: { Authorization: `Bearer ${import.meta.env.VITE_AIRTABLE_API_KEY}` },
              params: {
                filterByFormula: `AND({TRACKER} = '${key}', IS_BEFORE({DATE}, '${today}'))`,
                sort: [{ field: "DATE", direction: "desc" }],
                pageSize: 1,
                fields: ["DATE", "EVENT", "KEYWORDS", "TRACKER"],
              },
            }
          )
        )

        const [recentRes, upcomingRes, ...trackerResults] = await Promise.all([
          axios.get(
            "https://api.airtable.com/v0/appVhtDyx0VKlGbhy/Taylor%20Swift%20Master%20Tracker",
            {
              headers: { Authorization: `Bearer ${import.meta.env.VITE_AIRTABLE_API_KEY}` },
              params: {
                filterByFormula: `IS_BEFORE({DATE}, '${today}')`,
                sort: [{ field: "DATE", direction: "desc" }],
                pageSize: 4,
                fields: ["DATE", "EVENT", "KEYWORDS"],
              },
            }
          ),
          axios.get(
            "https://api.airtable.com/v0/appVhtDyx0VKlGbhy/Taylor%20Swift%20Master%20Tracker",
            {
              headers: { Authorization: `Bearer ${import.meta.env.VITE_AIRTABLE_API_KEY}` },
              params: {
                filterByFormula: `IS_AFTER({DATE}, '${today}')`,
                sort: [{ field: "DATE", direction: "asc" }],
                pageSize: 10,
                fields: ["DATE", "EVENT", "KEYWORDS"],
              },
            }
          ),
          ...trackerFetches,
        ])

        setRecent(recentRes.data.records || [])
        setUpcoming(upcomingRes.data.records || [])

        const trackerMap = {}
        TRACKER_KEYS.forEach((key, i) => {
          const record = trackerResults[i]?.data?.records?.[0]
          if (record) trackerMap[key] = record
        })
        setTrackerData(trackerMap)
      } catch (error) {
        console.error("Error fetching events:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  if (loading) {
    return (
      <div className="w-full lg:w-[340px] shrink-0 flex flex-col gap-4 px-2 lg:px-0">
        <div className="bg-[#eef0fb] border border-[#c5cae9] rounded-2xl p-4 animate-pulse h-48" />
        <div className="bg-[#eef0fb] border border-[#c5cae9] rounded-2xl p-4 animate-pulse h-32" />
      </div>
    )
  }

  const hasTrackerData = Object.keys(trackerData).length > 0

  return (
    <div className="w-full lg:w-[340px] shrink-0 flex flex-col gap-4 px-2 lg:px-0 mt-4 lg:mt-0">

      {/* Desktop tab toggle */}
      <div className="hidden lg:flex gap-2">
        <button
          onClick={() => setActiveTab("recent")}
          className={`flex-1 py-1.5 rounded-full text-xs font-medium transition-colors ${
            activeTab === "recent"
              ? "bg-[#8a9ac7] text-white"
              : "bg-white text-[#6b7db3] border border-[#c5cae9]"
          }`}
        >
          Recent
        </button>
        <button
          onClick={() => setActiveTab("dayssince")}
          className={`flex-1 py-1.5 rounded-full text-xs font-medium transition-colors ${
            activeTab === "dayssince"
              ? "bg-[#b66b6b] text-white"
              : "bg-white text-[#6b7db3] border border-[#c5cae9]"
          }`}
        >
          Days Since
        </button>
      </div>

      {/* Recent + Upcoming (desktop: tab controlled, mobile: always shown via timeline.jsx toggle) */}
      {(activeTab === "recent") && (
        <>
          {recent.length > 0 && (
            <div className="bg-white/60 border border-[#c5cae9] rounded-2xl p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-[#3d3d6b] mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#8a9ac7] inline-block" />
                Recently
              </h3>
              <div className="flex flex-col gap-2">
                {recent.map((record) => (
                  <EventCard key={record.id} record={record} />
                ))}
              </div>
            </div>
          )}

          {upcoming.length > 0 && (
            <div className="bg-white/60 border border-[#c5cae9] rounded-2xl p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-[#3d3d6b] mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#b66b6b] inline-block" />
                Upcoming
              </h3>
              <div className="flex flex-col gap-2">
                {upcoming.map((record) => (
                  <EventCard key={record.id} record={record} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Days Since (desktop: tab controlled) */}
      {(activeTab === "dayssince") && hasTrackerData && (
        <div className="bg-white/60 border border-[#c5cae9] rounded-2xl p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-[#3d3d6b] mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#b66b6b] inline-block" />
            Days Since...
          </h3>
          <div className="flex flex-col gap-3">
            {TRACKER_KEYS.map((key) => {
              const record = trackerData[key]
              if (!record) return null
              const days = getDaysSince(record.fields?.DATE)
              if (days === null) return null
              return (
                <Link
                  key={key}
                  to={`/post_details?id=${record.id}`}
                  className="block bg-[#eef0fb] border border-[#c5cae9] rounded-xl p-3 hover:shadow-md hover:border-[#8a9ac7] transition-all duration-200"
                  draggable={false}
                  onDragStart={(e) => e.preventDefault()}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-[#6b7db3] uppercase tracking-wide">
                      {TRACKER_LABELS[key]}
                    </span>
                    <span className="shrink-0 bg-[#b66b6b] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {days}d ago
                    </span>
                  </div>
                  <p className="text-[#3d3d6b] text-xs mt-1 line-clamp-1">
                    {record.fields?.EVENT || ""}
                  </p>
                  <p className="text-[#8a9ac7] text-[10px] mt-0.5">
                    {formatDate(record.fields?.DATE)}
                  </p>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Mobile: always show both sections (controlled by timeline.jsx tab) */}
      <div className="lg:hidden flex flex-col gap-4">
        {recent.length > 0 && (
          <div className="bg-white/60 border border-[#c5cae9] rounded-2xl p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-[#3d3d6b] mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#8a9ac7] inline-block" />
              Recently
            </h3>
            <div className="flex flex-col gap-2">
              {recent.map((record) => (
                <EventCard key={record.id} record={record} />
              ))}
            </div>
          </div>
        )}
        {upcoming.length > 0 && (
          <div className="bg-white/60 border border-[#c5cae9] rounded-2xl p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-[#3d3d6b] mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#b66b6b] inline-block" />
              Upcoming
            </h3>
            <div className="flex flex-col gap-2">
              {upcoming.map((record) => (
                <EventCard key={record.id} record={record} />
              ))}
            </div>
          </div>
        )}
        {hasTrackerData && (
          <div className="bg-white/60 border border-[#c5cae9] rounded-2xl p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-[#3d3d6b] mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#b66b6b] inline-block" />
              Days Since...
            </h3>
            <div className="flex flex-col gap-3">
              {TRACKER_KEYS.map((key) => {
                const record = trackerData[key]
                if (!record) return null
                const days = getDaysSince(record.fields?.DATE)
                if (days === null) return null
                return (
                  <Link
                    key={key}
                    to={`/post_details?id=${record.id}`}
                    className="block bg-[#eef0fb] border border-[#c5cae9] rounded-xl p-3 hover:shadow-md hover:border-[#8a9ac7] transition-all duration-200"
                    draggable={false}
                    onDragStart={(e) => e.preventDefault()}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-[#6b7db3] uppercase tracking-wide">
                        {TRACKER_LABELS[key]}
                      </span>
                      <span className="shrink-0 bg-[#b66b6b] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        {days}d ago
                      </span>
                    </div>
                    <p className="text-[#3d3d6b] text-xs mt-1 line-clamp-1">
                      {record.fields?.EVENT || ""}
                    </p>
                    <p className="text-[#8a9ac7] text-[10px] mt-0.5">
                      {formatDate(record.fields?.DATE)}
                    </p>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}