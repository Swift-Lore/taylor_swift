import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import axios from "axios"

const formatDate = (dateString) => {
  if (!dateString) return ""
  const date = new Date(dateString)
  const options = { month: "short", day: "2-digit", year: "numeric", timeZone: "UTC" }
  return date.toLocaleDateString("en-US", options)
}

const EventCard = ({ record }) => {
  const handleClick = (e) => {
    const sel = window.getSelection()
    if (sel && sel.toString().length > 0) {
      e.preventDefault()
    }
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
            <span
              key={i}
              className="bg-[#c5cae9] text-[#3d3d6b] text-[10px] px-1.5 py-0.5 rounded-full"
            >
              {kw}
            </span>
          ))}
        </div>
      )}
    </Link>
  )
}

export default function RecentEvents() {
  const [recent, setRecent] = useState([])
  const [upcoming, setUpcoming] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEvents = async () => {
      const today = new Date().toISOString().split("T")[0]

      try {
        const [recentRes, upcomingRes] = await Promise.all([
          axios.get(
            "https://api.airtable.com/v0/appVhtDyx0VKlGbhy/Taylor%20Swift%20Master%20Tracker",
            {
              headers: {
                Authorization: `Bearer ${import.meta.env.VITE_AIRTABLE_API_KEY}`,
              },
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
              headers: {
                Authorization: `Bearer ${import.meta.env.VITE_AIRTABLE_API_KEY}`,
              },
              params: {
                filterByFormula: `IS_AFTER({DATE}, '${today}')`,
                sort: [{ field: "DATE", direction: "asc" }],
                pageSize: 10,
                fields: ["DATE", "EVENT", "KEYWORDS"],
              },
            }
          ),
        ])

        setRecent(recentRes.data.records || [])
        setUpcoming(upcomingRes.data.records || [])
      } catch (error) {
        console.error("Error fetching recent/upcoming events:", error)
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

  return (
    <div className="w-full lg:w-[340px] shrink-0 flex flex-col gap-4 px-2 lg:px-0 mt-4 lg:mt-0">
      {/* Recently */}
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

      {/* Upcoming */}
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
    </div>
  )
}