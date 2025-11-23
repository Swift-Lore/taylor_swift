import { useEffect, useState } from "react";
import Select from 'react-select'; // ADD THIS IMPORT

const SERVER_EVENTS_ENDPOINT = import.meta.env.VITE_EVENTS_ENDPOINT || "";

// Direct Airtable fallback (same base/table as Timeline)
const AIRTABLE_URL =
  "https://api.airtable.com/v0/appVhtDyx0VKlGbhy/Taylor%20Swift%20Master%20Tracker";

// Normalize any record shape into a flat "show" object
function normalizeShow(raw) {
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

  // (Scroll to top is fine but not required for the blank issue)
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    async function loadShows() {
      try {
        setLoading(true);
        setError("");

        let data;

        if (SERVER_EVENTS_ENDPOINT) {
          const res = await fetch(SERVER_EVENTS_ENDPOINT);
          if (!res.ok) {
            throw new Error(`Failed to fetch shows from server: ${res.status}`);
          }
          data = await res.json();
        } else {
          // Filter by "Eras Show #" not being blank
          const filterFormula = encodeURIComponent(
            `NOT({Eras Show #} = '')`
          );

          const res = await fetch(
            `${AIRTABLE_URL}?filterByFormula=${filterFormula}&sort[0][field]=DATE&sort[0][direction]=asc`,
            {
              headers: {
                Authorization: `Bearer ${import.meta.env.VITE_AIRTABLE_API_KEY}`,
              },
            }
          );

          if (!res.ok) {
            throw new Error(
              `Failed to fetch shows from Airtable: ${res.status}`
            );
          }
          data = await res.json();
        }

        const rawArray = Array.isArray(data)
          ? data
          : Array.isArray(data.records)
          ? data.records
          : [];

        console.log("Raw Eras Tour shows:", rawArray.length, "records");

        // No additional filtering needed since Airtable already filtered by "Eras Show #"
        const erasOnly = rawArray;

        const normalized = erasOnly
          .map((item) => normalizeShow(item))
          .sort((a, b) => {
            const da = new Date(a.date);
            const db = new Date(b.date);
            if (Number.isNaN(da.getTime()) || Number.isNaN(db.getTime()))
              return 0;
            return da - db;
          });

        console.log("Final normalized shows:", normalized);

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

  // REPLACE THE handleSelectChange FUNCTION WITH THIS:
  const handleSelectChange = (selectedOption) => {
    if (selectedOption) {
      setSelectedShowId(selectedOption.value);
      const found = shows.find((show) => show.id === selectedOption.value);
      setSelectedShow(found || null);
    } else {
      setSelectedShowId("");
      setSelectedShow(null);
    }
  };

  return (
    <section className="max-w-5xl mx-auto px-4 py-10 min-h-[60vh]">
      {/* Always-visible debug state at top */}
      {loading && (
        <div className="mb-4 text-center text-sm text-[#6b7db3] italic">
          Loading Eras Tour shows…
        </div>
      )}
      {error && (
        <div className="mb-4 text-center text-sm text-red-700">
          {error}
        </div>
      )}

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

      {/* REPLACE THE ENTIRE DROPDOWN SECTION WITH THIS IMPROVED VERSION: */}
{!loading && !error && shows.length > 0 && (
  <div className="mb-8">
    <div className="flex flex-col md:flex-row md:items-center gap-3">
      <label
        htmlFor="eras-show-select"
        className="text-sm font-medium text-[#8e3e3e] md:w-40"
      >
        Select a show:
      </label>
      <div className="w-full md:flex-1">
        <Select
          options={shows.map(show => ({
            value: show.id,
            label: show.showDisplayName,
            venue: show.venue || '',
            date: show.date || '',
            // Debug: log what we're searching
            searchTerm: (show.showDisplayName + ' ' + (show.venue || '') + ' ' + (show.date || '')).toLowerCase()
          }))}
          value={shows.find(s => s.id === selectedShowId) ? {
            value: selectedShowId,
            label: shows.find(s => s.id === selectedShowId).showDisplayName
          } : null}
          onChange={handleSelectChange}
          placeholder="Type to search (city, date, venue...)"
          isSearchable
          filterOption={(option, inputValue) => {
            if (!inputValue) return true;
            const matches = option.data.searchTerm.includes(inputValue.toLowerCase());
            console.log('Searching for:', inputValue.toLowerCase(), 'in:', option.data.searchTerm, 'Match:', matches);
            return matches;
          }}
          noOptionsMessage={({ inputValue }) => {
            console.log('No options for:', inputValue);
            console.log('Available shows:', shows.map(s => ({
              name: s.showDisplayName,
              venue: s.venue,
              date: s.date
            })));
            return inputValue ? `No shows found for "${inputValue}"` : "No shows available";
          }}
          styles={{
            control: (base) => ({
              ...base,
              border: '1px solid #ffcaca',
              borderRadius: '6px',
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              padding: '2px 8px',
              minHeight: '42px',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
              '&:hover': {
                borderColor: '#ffcaca'
              }
            }),
            menu: (base) => ({
              ...base,
              borderRadius: '6px',
              border: '1px solid #ffcaca',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              zIndex: 9999
            }),
            option: (base, state) => ({
              ...base,
              backgroundColor: state.isFocused ? '#fef2f2' : 'white',
              color: state.isFocused ? '#8e3e3e' : '#4b5563',
              fontSize: '14px',
              '&:active': {
                backgroundColor: '#fecaca'
              }
            }),
            placeholder: (base) => ({
              ...base,
              color: '#9ca3af',
              fontSize: '14px'
            }),
            input: (base) => ({
              ...base,
              color: '#4b5563',
              fontSize: '14px'
            })
          }}
          components={{
            DropdownIndicator: () => (
              <div className="pr-2 text-[#6b7db3]">🔍</div>
            ),
            IndicatorSeparator: () => null
          }}
        />
      </div>
    </div>
    {/* Add helper text */}
    <p className="text-xs text-[#6b7db3] mt-2 italic">
      Tip: Search by city (e.g., "London"), date (e.g., "May 2024"), or venue name
    </p>
    
    {/* Debug info - remove this after testing */}
    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs">
      <p className="font-semibold">Debug Info (first 3 shows):</p>
      {shows.slice(0, 3).map((show, index) => (
        <div key={index} className="mt-1">
          <p>Name: {show.showDisplayName}</p>
          <p>Venue: {show.venue}</p>
          <p>Date: {show.date}</p>
          <hr className="my-1" />
        </div>
      ))}
    </div>
  </div>
)}

      {/* Detail card (KEEP THIS SECTION EXACTLY AS IS) */}
      {!loading && selectedShow && (
        <div className="glass-soft card-soft rounded-xl bg-white/70 px-5 py-6 md:px-7 md:py-7 border border-[#f3d6d6] space-y-5">
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