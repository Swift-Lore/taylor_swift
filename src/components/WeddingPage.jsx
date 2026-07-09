"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";

/* ------------------------------------------------------------------ */
/*  CONFIG — update these two if your base/table ever changes          */
/* ------------------------------------------------------------------ */
const BASE_ID = "appVhtDyx0VKlGbhy";
const TABLE_NAME = "Wedding"; // matches the tab name shown in Airtable

const GUEST_TYPES = [
  "Actor",
  "Athlete",
  "Author",
  "Celebrity / Personality",
  "Chiefs Player",
  "Miscellaneous",
  "Music Artist",
  "NFL",
  "Studio Execs / Directors",
  "Talk Show Host",
  "Taylor's Backup Singer",
  "Taylor's Bandmate",
  "Taylor's Close Personal Friend",
  "Taylor's Dancer",
  "Taylor's Family",
  "Taylor's Professional Collaborator",
  "Travis' Close Personal Friend",
  "Travis' Family",
  "Travis' Friend(s)",
];

/* ------------------------------------------------------------------ */
/*  URL helpers — same detection pattern used on event pages           */
/* ------------------------------------------------------------------ */
const splitUrls = (raw) =>
  !raw
    ? []
    : raw
        .split(" || ")
        .map((u) => u.trim())
        .filter(Boolean);

const getPlatform = (url) => {
  const lower = url.toLowerCase();
  if (lower.includes("instagram.com")) return "instagram";
  if (
    (lower.includes("twitter.com") || lower.includes("x.com")) &&
    /\/status\/\d+/.test(lower)
  )
    return "twitter";
  if (lower.includes("youtube.com") || lower.includes("youtu.be"))
    return "youtube";
  if (lower.includes("tiktok.com")) return "tiktok";
  return "link";
};

const getYouTubeId = (url) => {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([\w-]{11})/
  );
  return match ? match[1] : null;
};

/* ------------------------------------------------------------------ */
/*  Single link renderer — picks the right embed/card per platform     */
/* ------------------------------------------------------------------ */
const LinkPreview = ({ url }) => {
  const platform = getPlatform(url);

  if (platform === "instagram") {
    return (
      <div style={{ zoom: 0.65, width: "300px" }}>
        <blockquote
          className="instagram-media"
          data-instgrm-captioned
          data-instgrm-permalink={url}
          data-instgrm-version="14"
          style={{
            background: "#FFF",
            borderRadius: "8px",
            border: "1px solid #dbdbdb",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            margin: "0",
            width: "300px",
            minHeight: "500px",
            padding: "0",
          }}
        >
          <div style={{ padding: "16px" }}>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 text-sm font-medium"
            >
              View Instagram post
            </a>
          </div>
        </blockquote>
      </div>
    );
  }

  if (platform === "twitter") {
    return (
      <div style={{ width: "300px", minHeight: "300px" }}>
        <blockquote className="twitter-tweet" data-theme="light">
          <a href={url} target="_blank" rel="noopener noreferrer">
            View post on X
          </a>
        </blockquote>
      </div>
    );
  }

  if (platform === "youtube") {
    const videoId = getYouTubeId(url);
    if (videoId) {
      return (
        <div
          className="rounded-lg overflow-hidden shadow-sm border border-[#c5cae9]"
          style={{ width: "300px", aspectRatio: "16/9" }}
        >
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${videoId}`}
            title="YouTube video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }
  }

  if (platform === "tiktok") {
    return (
      <blockquote className="tiktok-embed" cite={url} data-video-id="">
        <a href={url} target="_blank" rel="noopener noreferrer">
          View on TikTok
        </a>
      </blockquote>
    );
  }

  // Generic article / fallback link
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-sm font-medium text-[#6b7db3] hover:text-[#3d3d6b] underline underline-offset-2"
    >
      Read full link →
    </a>
  );
};

/* ------------------------------------------------------------------ */
/*  Guest card — full details always visible (default view)            */
/*  Rendered inside a CSS grid with items-start so uneven card heights */
/*  don't stretch neighboring cards or leave blank gaps.               */
/* ------------------------------------------------------------------ */
const GuestCard = ({ record }) => {
  const f = record.fields || {};
  const urls = splitUrls(f["URLS"]);

  return (
    <div className="bg-white/70 border border-[#c5cae9] rounded-2xl p-4 shadow-sm flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <h3 className="text-[#3d3d6b] font-semibold text-base">
          {f["Name"] || "Unnamed Guest"}
        </h3>
        <div className="flex gap-1.5 flex-wrap justify-end">
          {f["GUEST TYPE"] && (
            <span className="bg-[#c5cae9] text-[#3d3d6b] text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap">
              {f["GUEST TYPE"]}
            </span>
          )}
        </div>
      </div>

      {f["SPECIAL ROLE / MOMENT"] && (
        <div className="bg-[#b66b6b]/10 border border-[#b66b6b]/30 rounded-lg px-3 py-2">
          <p className="text-[10px] font-semibold text-[#b66b6b] uppercase tracking-wide mb-0.5">
            Special Role
          </p>
          <p className="text-sm text-[#8e3e3e] leading-relaxed whitespace-pre-line">
            {f["SPECIAL ROLE / MOMENT"]}
          </p>
        </div>
      )}

      {f["NOTES"] && (
        <p className="text-sm text-[#6b7280] leading-relaxed whitespace-pre-line">{f["NOTES"]}</p>
      )}
      {f["CAPTION(S)"] && (
        <p className="text-sm italic text-[#3d3d6b] leading-relaxed border-l-2 border-[#c5cae9] pl-3 whitespace-pre-line">
          {f["CAPTION(S)"]}
        </p>
      )}

      {urls.length > 0 && (
        <div className="flex flex-wrap gap-4 mt-2">
          {urls.map((url, i) => (
            <LinkPreview key={i} url={url} />
          ))}
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Compact guest row — collapsed by default, expands on click.        */
/*  Alternate view for browsing the list quickly.                      */
/* ------------------------------------------------------------------ */
const GuestRow = ({ record }) => {
  const f = record.fields || {};
  const [open, setOpen] = useState(false);
  const urls = splitUrls(f["URLS"]);
  const hasDetails =
    !!f["NOTES"] || !!f["CAPTION(S)"] || !!f["SPECIAL ROLE / MOMENT"] || urls.length > 0;

  /* Expanding a row reveals new blockquotes that the page-level embed
     effect never saw (it only fires on filter/tab/search changes) —
     so tell Instagram/X to re-scan the page right when this opens. */
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      if (window.instgrm) window.instgrm.Embeds.process();
      if (window.twttr?.widgets) window.twttr.widgets.load();
    }, 100);
    return () => clearTimeout(timer);
  }, [open]);

  return (
    <div className="bg-white/70 border border-[#c5cae9] rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => hasDetails && setOpen((o) => !o)}
        className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left ${
          hasDetails ? "cursor-pointer hover:bg-[#f4f6fc]" : "cursor-default"
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <span className="text-[#3d3d6b] font-medium text-sm truncate">
            {f["Name"] || "Unnamed Guest"}
          </span>
          {f["GUEST TYPE"] && (
            <span className="bg-[#c5cae9] text-[#3d3d6b] text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap">
              {f["GUEST TYPE"]}
            </span>
          )}
          {f["SPECIAL ROLE / MOMENT"] && (
            <span className="bg-[#b66b6b] text-white text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap">
              Special Role
            </span>
          )}
        </div>
        {hasDetails && (
          <span
            className={`shrink-0 text-[#8a9ac7] text-xs transition-transform duration-150 ${
              open ? "rotate-180" : ""
            }`}
          >
            ▼
          </span>
        )}
      </button>

      {open && hasDetails && (
        <div className="px-4 pb-4 pt-1 border-t border-[#e6edf7] flex flex-col gap-2">
          {f["SPECIAL ROLE / MOMENT"] && (
            <div className="bg-[#b66b6b]/10 border border-[#b66b6b]/30 rounded-lg px-3 py-2">
              <p className="text-[10px] font-semibold text-[#b66b6b] uppercase tracking-wide mb-0.5">
                Special Role
              </p>
              <p className="text-sm text-[#8e3e3e] leading-relaxed whitespace-pre-line">
                {f["SPECIAL ROLE / MOMENT"]}
              </p>
            </div>
          )}
          {f["NOTES"] && (
            <p className="text-sm text-[#6b7280] leading-relaxed whitespace-pre-line">
              {f["NOTES"]}
            </p>
          )}
          {f["CAPTION(S)"] && (
            <p className="text-sm italic text-[#3d3d6b] leading-relaxed border-l-2 border-[#c5cae9] pl-3 whitespace-pre-line">
              {f["CAPTION(S)"]}
            </p>
          )}
          {urls.length > 0 && (
            <div className="flex flex-wrap gap-4 mt-1">
              {urls.map((url, i) => (
                <LinkPreview key={i} url={url} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Article / Video card (unchanged — these stay as cards)             */
/* ------------------------------------------------------------------ */
const CoverageCard = ({ record }) => {
  const f = record.fields || {};
  const urls = splitUrls(f["URLS"]);

  return (
    <div className="bg-white/70 border border-[#c5cae9] rounded-2xl p-4 shadow-sm flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <h3 className="text-[#3d3d6b] font-semibold text-base">
          {f["Name"] || "Untitled"}
        </h3>
        {f["URL TYPE"] && (
          <span className="bg-[#8a9ac7] text-white text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap">
            {f["URL TYPE"]}
          </span>
        )}
      </div>

      {f["NOTES"] && (
        <p className="text-sm text-[#6b7280] leading-relaxed whitespace-pre-line">{f["NOTES"]}</p>
      )}

      {urls.length > 0 && (
        <div className="flex flex-wrap gap-4 mt-2">
          {urls.map((url, i) => (
            <LinkPreview key={i} url={url} />
          ))}
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */
export default function WeddingPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("guests"); // "guests" | "details"
  const [viewMode, setViewMode] = useState("card"); // "card" | "compact" — card is default
  const [activeGuestTypes, setActiveGuestTypes] = useState([]); // empty = all
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef(null);

  /* Fetch ALL rows, paginating past Airtable's 100-record page limit */
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      let all = [];
      let offset = undefined;

      try {
        do {
          const res = await axios.get(
            `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(
              TABLE_NAME
            )}`,
            {
              headers: {
                Authorization: `Bearer ${import.meta.env.VITE_AIRTABLE_API_KEY}`,
              },
              params: offset ? { offset } : {},
            }
          );
          all = all.concat(res.data.records || []);
          offset = res.data.offset;
        } while (offset);

        setRecords(all);
      } catch (err) {
        console.error("Error fetching wedding records:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  /* Re-process embed scripts whenever the visible set changes */
  useEffect(() => {
    if (!document.getElementById("instagram-embed-script")) {
      const s = document.createElement("script");
      s.id = "instagram-embed-script";
      s.src = "//www.instagram.com/embed.js";
      s.async = true;
      document.body.appendChild(s);
    } else if (window.instgrm) {
      setTimeout(() => window.instgrm.Embeds.process(), 100);
    }

    if (!document.getElementById("twitter-embed-script")) {
      const s = document.createElement("script");
      s.id = "twitter-embed-script";
      s.src = "https://platform.twitter.com/widgets.js";
      s.async = true;
      s.onload = () => window.twttr?.widgets?.load();
      document.body.appendChild(s);
    } else if (window.twttr?.widgets) {
      window.twttr.widgets.load();
    }

    const timestamp = Date.now();
    const existingTikTok = document.getElementById("tiktok-embed-script");
    if (existingTikTok) existingTikTok.remove();
    const tiktokScript = document.createElement("script");
    tiktokScript.id = "tiktok-embed-script";
    tiktokScript.src = `https://www.tiktok.com/embed.js?t=${timestamp}`;
    tiktokScript.async = true;
    document.body.appendChild(tiktokScript);
  }, [records, activeTab, activeGuestTypes, searchQuery, viewMode]);

  /* Close the dropdown when clicking outside it */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowTypeDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const guestRecords = useMemo(
    () =>
      records
        .filter((r) => r.fields?.["GUEST TYPE"])
        .sort((a, b) => {
          const aHasUrls = splitUrls(a.fields["URLS"]).length > 0;
          const bHasUrls = splitUrls(b.fields["URLS"]).length > 0;

          // Guests with links float to the top as a group
          if (aHasUrls !== bHasUrls) return aHasUrls ? -1 : 1;

          // Within each group, sort alphabetically by name
          return (a.fields["Name"] || "").localeCompare(b.fields["Name"] || "");
        }),
    [records]
  );

  const coverageRecords = useMemo(
    () =>
      records.filter(
        (r) =>
          !r.fields?.["GUEST TYPE"] &&
          (r.fields?.["URL TYPE"] === "Article" ||
            r.fields?.["URL TYPE"] === "Video")
      ),
    [records]
  );

  const filteredGuests = useMemo(() => {
    let result = guestRecords;

    if (activeGuestTypes.length > 0) {
      result = result.filter((r) =>
        activeGuestTypes.includes(r.fields["GUEST TYPE"])
      );
    }

    if (searchQuery.trim()) {
      const searchWords = searchQuery.trim().toLowerCase().split(/\s+/);
      result = result.filter((r) => {
        const name = (r.fields["Name"] || "").toLowerCase();
        return searchWords.every((word) => name.includes(word));
      });
    }

    return result;
  }, [guestRecords, activeGuestTypes, searchQuery]);

  const toggleGuestType = (type) => {
    setActiveGuestTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const clearFilters = () => {
    setActiveGuestTypes([]);
    setSearchQuery("");
  };

  const hasActiveFilters = activeGuestTypes.length > 0 || searchQuery.trim();

  const guestTypeCounts = useMemo(() => {
    const counts = {};
    guestRecords.forEach((r) => {
      const t = r.fields["GUEST TYPE"];
      counts[t] = (counts[t] || 0) + 1;
    });
    return counts;
  }, [guestRecords]);

  return (
    <div className="bg-[#e6edf7] py-8 md:py-12 min-h-screen">
      <div className="max-w-5xl mx-auto px-4">
        <h1 className="text-2xl md:text-3xl font-serif text-[#8e3e3e] text-center mb-6">
          T&amp;T&apos;s Wedding
        </h1>

        {/* Tab toggle */}
        <div className="flex justify-center gap-2 mb-6">
          <button
            onClick={() => setActiveTab("guests")}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
              activeTab === "guests"
                ? "bg-[#8a9ac7] text-white"
                : "bg-white text-[#6b7db3] border border-[#c5cae9]"
            }`}
          >
            Guest List
          </button>
          <button
            onClick={() => setActiveTab("details")}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
              activeTab === "details"
                ? "bg-[#b66b6b] text-white"
                : "bg-white text-[#6b7db3] border border-[#c5cae9]"
            }`}
          >
            Wedding Details
          </button>
        </div>

        {/* Card / Compact view toggle — only relevant on Guest List */}
        {activeTab === "guests" && !loading && (
          <div className="flex justify-center gap-1.5 mb-6">
            <button
              onClick={() => setViewMode("card")}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                viewMode === "card"
                  ? "bg-[#3d3d6b] text-white"
                  : "bg-white text-[#6b7db3] border border-[#c5cae9]"
              }`}
            >
              Card View
            </button>
            <button
              onClick={() => setViewMode("compact")}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                viewMode === "compact"
                  ? "bg-[#3d3d6b] text-white"
                  : "bg-white text-[#6b7db3] border border-[#c5cae9]"
              }`}
            >
              Compact View
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col gap-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white/60 border border-[#c5cae9] rounded-lg p-4 animate-pulse h-12"
              />
            ))}
          </div>
        ) : activeTab === "guests" ? (
          <>
            {/* Search + guest type dropdown filter */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mb-6">
              <input
                type="text"
                placeholder="Search guest name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-56 rounded-full py-1.5 px-4 text-sm bg-white text-[#3d3d6b] border border-[#6b7db3] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#fbb1c3]"
              />

              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowTypeDropdown((s) => !s)}
                  className="flex items-center justify-between gap-2 bg-white text-[#6b7db3] border border-[#6b7db3] rounded-full px-4 py-1.5 text-sm min-w-[220px]"
                >
                  <span>
                    {activeGuestTypes.length > 0
                      ? `${activeGuestTypes.length} type${
                          activeGuestTypes.length > 1 ? "s" : ""
                        } selected`
                      : `Filter by guest type (${guestRecords.length})`}
                  </span>
                  <span className="ml-2">▼</span>
                </button>

                {showTypeDropdown && (
                  <div className="absolute left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 top-full mt-1 w-[90vw] sm:w-72 max-w-[90vw] bg-white border border-[#6b7db3] rounded-lg shadow-lg z-50 max-h-[60vh] overflow-y-auto">
                    <div className="p-2">
                      <button
                        className="w-full text-left px-3 py-2 text-sm hover:bg-[#e6edf7] rounded mb-1 font-medium text-[#3d3d6b]"
                        onClick={() => setActiveGuestTypes([])}
                      >
                        All Guests ({guestRecords.length})
                      </button>

                      <div className="max-h-[50vh] overflow-y-auto">
                        {GUEST_TYPES.filter((t) => guestTypeCounts[t]).map(
                          (type) => (
                            <div
                              key={type}
                              className="flex items-center px-3 py-2"
                            >
                              <input
                                type="checkbox"
                                id={`guest-type-${type}`}
                                checked={activeGuestTypes.includes(type)}
                                onChange={() => toggleGuestType(type)}
                                className="mr-2"
                              />
                              <label
                                htmlFor={`guest-type-${type}`}
                                className="text-sm cursor-pointer flex-1"
                              >
                                {type}
                              </label>
                              <span className="text-xs text-gray-400">
                                {guestTypeCounts[type]}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs font-medium px-3 py-1.5 rounded-full bg-[#8e3e3e] text-white hover:bg-[#7a3434] transition-colors whitespace-nowrap"
                >
                  Clear Filters ✕
                </button>
              )}
            </div>

            {/* Result count */}
            <p className="text-center text-xs text-[#6b7db3] mb-4">
              Showing {filteredGuests.length} of {guestRecords.length} guests
            </p>

            {/* Guest list — Card view (grid) or Compact view (stacked rows) */}
            {filteredGuests.length > 0 ? (
              viewMode === "card" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                  {filteredGuests.map((r) => (
                    <GuestCard key={r.id} record={r} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {filteredGuests.map((r) => (
                    <GuestRow key={r.id} record={r} />
                  ))}
                </div>
              )
            ) : (
              <p className="text-center text-[#6b7280] italic py-6">
                No guests match that search/filter yet.
              </p>
            )}
          </>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {coverageRecords.length > 0 ? (
              coverageRecords.map((r) => (
                <CoverageCard key={r.id} record={r} />
              ))
            ) : (
              <p className="col-span-2 text-center text-[#6b7280] italic">
                No articles or videos added yet.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
