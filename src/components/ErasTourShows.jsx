import { useEffect, useState, useRef } from "react";
import Select from "react-select";
import AdSlot from "./adslot";

const SERVER_EVENTS_ENDPOINT = import.meta.env.VITE_EVENTS_ENDPOINT || "";

// Direct Airtable fallback (same base/table as Timeline)
const AIRTABLE_URL =
  "https://api.airtable.com/v0/appVhtDyx0VKlGbhy/Taylor%20Swift%20Master%20Tracker";

// Outfits table URL
const AIRTABLE_OUTFITS_URL =
  "https://api.airtable.com/v0/appVhtDyx0VKlGbhy/ERAS%20TOUR%20OUTFITS";

// Normalize any record shape into a flat "show" object
function normalizeShow(raw) {
  const fields = raw.fields || raw;

  return {
    id: raw.id,
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

function normalizeOutfit(raw) {
  const fields = raw.fields || raw;
  const embed = fields["GETTY EMBED"] || "";

  // Extract the Getty URL from the <a href="...">
  const match = embed.match(/href=["']([^"']+)["']/i);
  const gettyUrl = match ? match[1] : "";

  return {
    id: raw.id,
    name: fields["Outfit Name"],
    eraSection: fields["Outfit Era Section"] || "",
    gettyUrl,          // NEW
    gettyHtml: embed,  // Keep original
    timesWorn: fields["TIMES WORN"] || 0,
    showIds: fields["SHOW DATES"] || [],
  };
}

// Prettier date display
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

// Getty embed helper – parses the embed HTML and runs the scripts
function GettyEmbed({ html }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !html) return;

    // Clear old embed
    container.innerHTML = "";

    // Parse the HTML string
    const temp = document.createElement("div");
    temp.innerHTML = html;

    Array.from(temp.childNodes).forEach((node) => {
      if (node.tagName === "SCRIPT") {
        // Recreate <script> so it actually executes
        const script = document.createElement("script");

        // Copy attributes (including src)
        Array.from(node.attributes || []).forEach((attr) => {
          if (attr.name === "src") {
            const src = attr.value.startsWith("//")
              ? window.location.protocol + attr.value
              : attr.value;
            script.src = src;
          } else {
            script.setAttribute(attr.name, attr.value);
          }
        });

        // Inline JS content
        if (!script.src) {
          script.text = node.text || node.textContent || "";
        }

        container.appendChild(script);
      } else {
        // Normal nodes (<a>, text, etc.)
        container.appendChild(node);
      }
    });
  }, [html]);

  if (!html) return null;

  return <div ref={containerRef} className="w-full h-full" />;
}

export default function ErasTourShows() {
  const [shows, setShows] = useState([]);
  const [selectedShowId, setSelectedShowId] = useState("");
  const [selectedShow, setSelectedShow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [outfits, setOutfits] = useState([]);
  const [loadingOutfits, setLoadingOutfits] = useState(true);

  // Scroll to top when page mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Load shows (serverless endpoint first, Airtable as local fallback)
  useEffect(() => {
    async function loadShows() {
      try {
        setLoading(true);
        setError("");

        let data;

        if (SERVER_EVENTS_ENDPOINT) {
          const res = await fetch(SERVER_EVENTS_ENDPOINT);

          if (!res.ok) {
            throw new Error(
              `Server shows fetch failed: ${res.status} ${res.statusText}`
            );
          }

          data = await res.json();
        } else {
          let allRecords = [];
          let offset = null;

          do {
            const filterFormula = encodeURIComponent(`NOT({Eras Show #} = '')`);

            let url = `${AIRTABLE_URL}?filterByFormula=${filterFormula}&sort[0][field]=DATE&sort[0][direction]=asc&pageSize=100`;

            if (offset) {
              url += `&offset=${offset}`;
            }

            const res = await fetch(url, {
              headers: {
                Authorization: `Bearer ${import.meta.env.VITE_AIRTABLE_API_KEY}`,
              },
            });

            if (!res.ok) {
              throw new Error(
                `Airtable shows fetch failed: ${res.status} ${res.statusText}`
              );
            }

            const responseData = await res.json();
            allRecords = allRecords.concat(responseData.records);
            offset = responseData.offset;
          } while (offset);

          data = { records: allRecords };
        }

        const rawArray = Array.isArray(data)
          ? data
          : Array.isArray(data.records)
          ? data.records
          : [];

        console.log("Raw Eras Tour shows:", rawArray.length, "records");

        const normalized = rawArray
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
        console.error("ErasTourShows loadShows error:", err);
        setError(
          `There was a problem loading Eras Tour shows. (${err.message})`
        );
      } finally {
        setLoading(false);
      }
    }

    loadShows();
  }, []);

  // Load outfits from the ERAS TOUR OUTFITS table
  useEffect(() => {
    async function loadOutfits() {
      try {
        setLoadingOutfits(true);

        let allRecords = [];
        let offset = null;

        do {
  // Use a specific view so Airtable returns outfits in that view's order
  let url = `${AIRTABLE_OUTFITS_URL}?view=Grid%20view&pageSize=100`;
  if (offset) url += `&offset=${offset}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${import.meta.env.VITE_AIRTABLE_API_KEY}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch outfits: ${res.status}`);
  }

  const json = await res.json();
  allRecords = allRecords.concat(json.records);
  offset = json.offset;
} while (offset);

        const normalized = allRecords.map((r) => normalizeOutfit(r));
        console.log("Loaded outfits:", normalized.length);
        setOutfits(normalized);
      } catch (err) {
        console.error("ErasTourShows loadOutfits error:", err);
      } finally {
        setLoadingOutfits(false);
      }
    }

    loadOutfits();
  }, []);

  // Options for react-select
  const showOptions = shows.map((show) => ({
    value: show.id,
    label: show.showDisplayName,
  }));

  // Dropdown handler
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

  // Outfits linked to the selected show
  const outfitsForSelectedShow = selectedShow
    ? outfits.filter(
        (o) => Array.isArray(o.showIds) && o.showIds.includes(selectedShow.id)
      )
    : [];

  return (
    <section className="max-w-5xl mx-auto px-4 py-10 min-h-[60vh]">
      {/* Loading / error state */}
      {loading && (
        <div className="mb-4 text-center text-sm text-[#6b7db3] italic">
          Loading Eras Tour shows…
        </div>
      )}
      {error && (
        <div className="mb-4 text-center text-sm text-red-700">{error}</div>
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

      {/* Show selector */}
      {!loading && !error && shows.length > 0 && (
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <label className="text-sm font-medium text-[#8e3e3e] md:w-40">
              Select a show:
            </label>
            <div className="w-full md:flex-1">
              <Select
                options={showOptions}
                value={
                  showOptions.find((o) => o.value === selectedShowId) || null
                }
                onChange={handleSelectChange}
                placeholder="Type to search (e.g., London, Paris, etc.)"
                isSearchable
              />
            </div>
          </div>
        </div>
      )}

      {/* Show detail card */}
      {!loading && selectedShow && (
        <div className="glass-soft card-soft rounded-xl bg-white/70 px-5 py-6 md:px-7 md:py-7 border border-[#f3d6d6] space-y-5">
          <div className="border-b border-[#f5e3e3] pb-4">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex-1">
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
                      <span className="font-semibold text-[#8e3e3e]">
                        Venue:
                      </span>{" "}
                      {selectedShow.venue}
                    </p>
                  )}
                </div>
              </div>

              {/* Full Details button */}
              <div className="flex-shrink-0">
                <button
                  onClick={() => {
                    const baseUrl = window.location.origin;
                    const url = `${baseUrl}/post_details?id=${selectedShow.id}`;
                    window.open(url, "_blank");
                  }}
                  className="inline-flex items-center bg-[#b66b6b] text-white hover:bg-[#a55e5e] rounded-full px-5 py-2 font-semibold text-sm shadow transition-transform hover:-translate-y-0.5 whitespace-nowrap"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                  Full Details
                </button>
              </div>
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
        </div>
      )}

                        {/* Inline ad */}
{import.meta.env.PROD && !loading && selectedShow && (
  <AdSlot
    variant="rectangle"
    maxWidthClass="max-w-5xl"
    className="my-6"
  />
)}

      {/* Outfits grid for this show */}
      {!loading &&
        selectedShow &&
        !loadingOutfits &&
        outfitsForSelectedShow.length > 0 && (
          <section className="mt-8">
            <h3 className="text-sm font-semibold tracking-wide uppercase text-[#8e3e3e] mb-3">
              Outfits worn at this show
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {outfitsForSelectedShow.map((outfit) => (
                <article
                  key={outfit.id}
                  className="bg-white/80 rounded-xl border border-[#f3d6d6] shadow-sm overflow-hidden flex flex-col"
                >
<div className="p-4 flex-1 flex items-center justify-center">
  {outfit.gettyHtml ? (
    <GettyEmbed html={outfit.gettyHtml} />
  ) : outfit.gettyUrl ? (
    <a
      href={outfit.gettyUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="text-xs text-[#6b7db3] underline hover:no-underline text-center"
    >
      View image on Getty Images
    </a>
  ) : (
    <span className="text-xs text-[#6b7db3] italic text-center">
      Getty image unavailable
    </span>
  )}
</div>

                  <div className="p-3 border-t border-[#f5e3e3]">
                    {outfit.eraSection && (
                      <div className="text-[11px] uppercase tracking-wide text-[#6b7db3] mb-1">
                        {outfit.eraSection}
                      </div>
                    )}
                    <div className="text-sm font-medium text-[#8e3e3e] leading-snug">
                      {outfit.name}
                    </div>
                    {typeof outfit.timesWorn === "number" &&
                      outfit.timesWorn > 1 && (
                        <div className="mt-1 text-xs text-[#6b7db3]">
                          Worn {outfit.timesWorn} times on tour
                        </div>
                      )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

      {/* If a show is selected but no outfits */}
      {!loading &&
        selectedShow &&
        !loadingOutfits &&
        outfitsForSelectedShow.length === 0 &&
        !error && (
          <p className="mt-6 text-sm text-[#6b7db3] italic">
            No outfits are linked to this show yet.
          </p>
        )}

      {/* If no show at all */}
      {!loading && !selectedShow && !error && (
        <p className="text-sm text-[#6b7db3] italic mt-4">
          No Eras Tour shows found.
        </p>
      )}
    </section>
  );
}
