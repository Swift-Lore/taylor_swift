import { useEffect, useState } from "react";
const SERVER_EVENTS_ENDPOINT = import.meta.env.VITE_EVENTS_ENDPOINT || "";

// Direct Airtable fallback (same base/table as Timeline)
const AIRTABLE_URL =
  "https://api.airtable.com/v0/appVhtDyx0VKlGbhy/Taylor%20Swift%20Master%20Tracker";

// Normalize any record shape into a flat "show" object
function normalizeShow(raw) {
  // Support Airtable-style { id, fields: {...} } OR flat objects
  const fields = raw.fields || raw;

  return {
    id: fields.ID ?? raw.id ?? fields.EVENT,
    event: fields.EVENT,
    date: fields.DATE,
    showDisplayName: fields["SHOW DISPLAY NAME"] || fields.EVENT,
    venue: fields.VENUE || "",
    surprise1: fields["Surprise Song 1"] || "",
    surprise2: fields["Surprise Song 2"] || "",
    notes: fields.NOTES || "",
    youtube: fields.YOUTUBE || "",
  };
}

// Optional: prettier date display
function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ErasTourShows() {
  const [shows, setShows] = useState([]);
  const [selectedShowId, setSelectedShowId] = useState("");
  const [selectedShow, setSelectedShow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);
 
  useEffect(() => {
    async function loadShows() {
      try {
        setLoading(true);
        setError("");

        let data;

        if (SERVER_EVENTS_ENDPOINT) {
          // Use your Netlify/server endpoint if configured
          const res = await fetch(SERVER_EVENTS_ENDPOINT);
          if (!res.ok) {
            throw new Error(`Failed to fetch shows from server: ${res.status}`);
          }
          data = await res.json();
        } else {
          // Fallback: query Airtable directly for Eras Tour shows
          const filterFormula = encodeURIComponent(
            `FIND("The Eras Tour:", {EVENT})`
          );

          const res = await fetch(
            `${AIRTABLE_URL}?filterByFormula=${filterFormula}`,
            {
              headers: {
                Authorization: `Bearer ${import.meta.env.VITE_AIRTABLE_API_KEY}`,
              },
            }
          );

          if (!res.ok) {
            throw new Error(`Failed to fetch shows from Airtable: ${res.status}`);
          }
          data = await res.json();
        }

        // Handle array or { records: [...] }
        const rawArray = Array.isArray(data)
          ? data
          : Array.isArray(data.records)
          ? data.records
          : [];

        // Flatten { id, fields } → { ...fields, id }
        const flattened = rawArray.map((item) =>
          item.fields ? { ...item.fields, id: item.id } : item
        );

        // Double-check "Eras Tour" filter on the client side
        const erasOnly = flattened.filter(
          (item) =>
            typeof item.EVENT === "string" &&
            item.EVENT.startsWith("The Eras Tour:")
        );

        const normalized = erasOnly
          .map((item) => normalizeShow(item))
          .sort((a, b) => {
            const da = new Date(a.date);
            const db = new Date(b.date);
            if (Number.isNaN(da.getTime()) || Number.isNaN(db.getTime())) return 0;
            return da - db;
          });

        setShows(normalized);

        if (normalized.length > 0) {
          const first = normalized[0];
          setSelectedShowId(first.id);
          setSelectedShow(first);
        } else {
          setSelectedShowId("");
          setSelectedShow(null);
        }
      } catch (err) {
        console.error(err);
        setError("There was a problem loading Eras Tour shows.");
      } finally {
        setLoading(false);
      }
    }

    loadShows();
  }, []);

  const handleSelectChange = (e) => {
    const value = e.target.value;
    setSelectedShowId(value);
    const found = shows.find((show) => String(show.id) === String(value));
    setSelectedShow(found || null);
  };

  return (
    <section className="max-w-5xl mx-auto px-4 py-10 fade-in">
      {/* Page Title */}
      <header className="mb-8 text-center">
        <h1 className="text-2xl md:text-3xl font-serif text-[#8e3e3e] mb-3">
          The Eras Tour — Show Explorer
        </h1>
        <p className="text-sm md:text-base text-[#6b7db3] max-w-2xl mx-auto">
          Choose a specific Eras Tour date to see its core details: venue, date,
          surprise songs, and notes. Outfit visuals and deeper linking can come
          next.
        </p>
      </header>

      {/* Dropdown + state */}
      <div className="mb-8">
        {loading && (
          <p className="text-sm text-[#6b7db3] italic">
            Loading Eras Tour shows…
          </p>
        )}

        {error && (
          <p className="text-sm text-red-700 mb-2">
            {error}
          </p>
        )}

        {!loading && !error && shows.length > 0 && (
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <label
              htmlFor="eras-show-select"
              className="text-sm font-medium text-[#8e3e3e] md:w-40"
            >
              Select a show:
            </label>
            <select
              id="eras-show-select"
              className="w-full md:flex-1 rounded-md border border-[#ffcaca] bg-white/80 px-3 py-2 text-sm text-[#4b5563] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#b91c1c]/40"
              value={selectedShowId || ""}
              onChange={handleSelectChange}
            >
              {shows.map((show) => (
                <option key={show.id} value={show.id}>
                  {show.showDisplayName}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Detail card */}
      {selectedShow && (
        <div className="glass-soft card-soft rounded-xl bg-white/70 px-5 py-6 md:px-7 md:py-7 border border-[#f3d6d6] space-y-5">
          {/* Show title & basics */}
          <div className="border-b border-[#f5e3e3] pb-4">
            <h2 className="text-xl md:text-2xl font-serif text-[#8e3e3e] mb-2 leading-snug">
              {selectedShow.showDisplayName}
            </h2>
            <div className="text-sm md:text-base text-[#6b7db3] space-y-1">
              {selectedShow.date && (
                <p>
                  <span className="font-semibold text-[#8e3e3e]">Date:</span>{" "}
                  {formatDate(selectedShow.date)}
                </p>
              )}
              {selectedShow.venue && (
                <p>
                  <span className="font-semibold text-[#8e3e3e]">Venue:</span>{" "}
                  {selectedShow.venue}
                </p>
              )}
            </div>
          </div>

          {/* Surprise songs */}
          {(selectedShow.surprise1 || selectedShow.surprise2) && (
            <div className="border-b border-[#f5e3e3] pb-4">
              <h3 className="text-sm font-semibold tracking-wide uppercase text-[#8e3e3e] mb-2">
                Surprise Songs
              </h3>
              <ul className="text-sm md:text-base text-[#4b5563] list-disc list-inside space-y-1">
                {selectedShow.surprise1 && (
                  <li>
                    <span className="font-medium text-[#8e3e3e]">Song 1:</span>{" "}
                    {selectedShow.surprise1}
                  </li>
                )}
                {selectedShow.surprise2 && (
                  <li>
                    <span className="font-medium text-[#8e3e3e]">Song 2:</span>{" "}
                    {selectedShow.surprise2}
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Notes */}
          {selectedShow.notes && (
            <div className="border-b border-[#f5e3e3] pb-4">
              <h3 className="text-sm font-semibold tracking-wide uppercase text-[#8e3e3e] mb-2">
                Notes
              </h3>
              <p className="text-sm md:text-base text-[#4b5563] whitespace-pre-line leading-relaxed">
                {selectedShow.notes}
              </p>
            </div>
          )}

          {/* YouTube link */}
          {selectedShow.youtube && (
            <div>
              <h3 className="text-sm font-semibold tracking-wide uppercase text-[#8e3e3e] mb-2">
                Video
              </h3>
              <a
                href={selectedShow.youtube}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center text-sm md:text-base text-[#b91c1c] underline hover:text-[#7f1515] transition-colors"
              >
                Watch on YouTube
              </a>
            </div>
          )}

          <div className="pt-2 text-xs text-[#9ca3af] italic">
            Outfits, gallery, and deeper show stats can plug in below this card
            next.
          </div>
        </div>
      )}

      {!loading && !selectedShow && !error && (
        <p className="text-sm text-[#6b7db3] italic mt-4">
          No Eras Tour shows found.
        </p>
      )}
    </section>
  );
}
