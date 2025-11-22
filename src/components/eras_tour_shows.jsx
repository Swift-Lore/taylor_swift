import { useEffect, useState } from "react";

// TODO: Replace this with your real endpoint or import
// For now, assume your Netlify function or JSON endpoint
// returns an array of objects with the same keys as your CSV:
// EVENT, DATE, VENUE, "SHOW DISPLAY NAME", "Surprise Song 1", "Surprise Song 2", NOTES, YOUTUBE, ID, etc.
const SHOWS_ENDPOINT = "/api/events"; // <-- update to your real URL

function normalizeShow(raw) {
  return {
    id: raw.ID ?? raw.id ?? raw.EVENT, // fallback if ID missing
    event: raw.EVENT,
    date: raw.DATE,
    showDisplayName: raw["SHOW DISPLAY NAME"] || raw.EVENT,
    venue: raw.VENUE || "",
    surprise1: raw["Surprise Song 1"] || "",
    surprise2: raw["Surprise Song 2"] || "",
    notes: raw.NOTES || "",
    youtube: raw.YOUTUBE || "",
  };
}

export default function ErasTourShows() {
  const [shows, setShows] = useState([]);
  const [selectedShowId, setSelectedShowId] = useState("");
  const [selectedShow, setSelectedShow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadShows() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(SHOWS_ENDPOINT);
        if (!res.ok) {
          throw new Error(`Failed to fetch shows: ${res.status}`);
        }

        const data = await res.json();

        // Filter down to Eras Tour shows only
        const erasOnly = (data || []).filter((item) =>
          typeof item.EVENT === "string" &&
          item.EVENT.startsWith("The Eras Tour:")
        );

        // Normalize shape
        const normalized = erasOnly
          .map(normalizeShow)
          .sort((a, b) => {
            // Sort by date ascending
            const da = new Date(a.date);
            const db = new Date(b.date);
            if (isNaN(da) || isNaN(db)) return 0;
            return da - db;
          });

        setShows(normalized);

        if (normalized.length > 0) {
          const first = normalized[0];
          setSelectedShowId(first.id);
          setSelectedShow(first);
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
          surprise songs, and notes. Outfit visuals and deeper linking can come next.
        </p>
      </header>

      {/* Dropdown + State */}
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

        {!loading && shows.length > 0 && (
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

      {/* Detail Card */}
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
                  {selectedShow.date}
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
                    <span className="font-medium text-[#8e3e3e]">
                      Song 1:
                    </span>{" "}
                    {selectedShow.surprise1}
                  </li>
                )}
                {selectedShow.surprise2 && (
                  <li>
                    <span className="font-medium text-[#8e3e3e]">
                      Song 2:
                    </span>{" "}
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

          {/* YouTube link (basic for now) */}
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

          {/* Placeholder for future outfits/media */}
          <div className="pt-2 text-xs text-[#9ca3af] italic">
            Outfits, gallery, and deeper show stats can plug in below this card next.
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
