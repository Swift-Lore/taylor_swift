"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import { LinkPreview, getPlatform } from "./LinkEmbeds";

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
/*  Wedding-specific: guests store multiple links in one URLS field,   */
/*  separated by " || " — this is local to how this table is shaped.  */
/* ------------------------------------------------------------------ */
const splitUrls = (raw) =>
  !raw
    ? []
    : raw
        .split(" || ")
        .map((u) => u.trim())
        .filter(Boolean);

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
/*  Wedding Details section — plain, page-level layout (matches the    */
/*  event pages' SOURCES section) instead of a nested card-in-card.    */
/*  Combines every row's links from this section into one flowing grid.*/
/* ------------------------------------------------------------------ */
const WeddingDetailsSection = ({
  title,
  records,
  emptyMessage,
  showTitle = true,
  titleClassName = "text-lg font-serif text-[#3d3d6b] mb-4 text-center",
}) => {
  const allUrls = records.flatMap((r) => splitUrls(r.fields?.["URLS"]));
  const notes = records.map((r) => r.fields?.["NOTES"]).filter(Boolean);

  // Embeds (Instagram/X/YouTube/TikTok) run much taller than article
  // preview cards. Flexbox stretches every item in a row to match the
  // tallest one, so keeping them in separate rows/groups stops a short
  // article card from ballooning to match a tall embed beside it.
  const embedPlatforms = new Set(["instagram", "twitter", "youtube", "tiktok"]);
  const embedUrls = allUrls.filter((u) => embedPlatforms.has(getPlatform(u)));
  const articleUrls = allUrls.filter((u) => !embedPlatforms.has(getPlatform(u)));

  return (
    <div>
      {showTitle && <h2 className={titleClassName}>{title}</h2>}

      {notes.length > 0 && (
        <div className="max-w-2xl mx-auto mb-6">
          {notes.map((note, i) => (
            <p
              key={i}
              className="text-sm text-[#6b7280] leading-relaxed whitespace-pre-line text-center mb-2"
            >
              {note}
            </p>
          ))}
        </div>
      )}

      {embedUrls.length > 0 && (
        <div className="max-w-[1400px] mx-auto mb-8">
          <div className="flex flex-wrap gap-6 justify-start items-start">
            {embedUrls.map((url, i) => (
              <LinkPreview key={`embed-${i}`} url={url} />
            ))}
          </div>
        </div>
      )}

      {articleUrls.length > 0 && (
        <div className="max-w-[1400px] mx-auto">
          <div className="flex flex-wrap gap-6 justify-start items-start">
            {articleUrls.map((url, i) => (
              <LinkPreview key={`article-${i}`} url={url} />
            ))}
          </div>
        </div>
      )}

      {allUrls.length === 0 && (
        <p className="text-center text-[#6b7280] italic">{emptyMessage}</p>
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
  // Tracks which tabs have ever been visited. Content only mounts the
  // first time a tab is opened, then stays mounted (just hidden/shown)
  // afterward — this avoids the "hidden panel never gets Instagram
  // embeds processed" problem entirely, since a panel is only ever
  // hidden AFTER its embeds already finished rendering, never before.
  const [visitedTabs, setVisitedTabs] = useState({ guests: true, details: false });

  const switchTab = (tab) => {
    setActiveTab(tab);
    setVisitedTabs((v) => (v[tab] ? v : { ...v, [tab]: true }));
  };
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

  /* Kick off Instagram/X script downloads the instant the page mounts —
     don't wait on the guest data fetch. This is what makes embeds on
     event pages feel instant: the script is already loaded and parsed
     by the time any blockquote exists in the DOM, instead of only
     starting to download after all 200+ guest records have arrived. */
  useEffect(() => {
    if (!document.getElementById("instagram-embed-script")) {
      const s = document.createElement("script");
      s.id = "instagram-embed-script";
      s.src = "//www.instagram.com/embed.js";
      s.async = true;
      document.body.appendChild(s);
    }

    if (!document.getElementById("twitter-embed-script")) {
      const s = document.createElement("script");
      s.id = "twitter-embed-script";
      s.src = "https://platform.twitter.com/widgets.js";
      s.async = true;
      document.body.appendChild(s);
    }
    // Note: TikTok's script is intentionally NOT loaded here — it only
    // seems to process blockquotes present at the moment it executes
    // (no reliable public "rescan" API like Instagram/X have), so it
    // needs to be reloaded whenever new TikTok blockquotes are added.
    // See the effect below.
  }, []);

  /* Re-process embeds whenever the visible set changes. Instagram/X
     just get told to rescan (scripts already loaded above). TikTok
     has to be fully reloaded each time to pick up new blockquotes —
     this does mean re-downloading it on every filter/search change,
     but that's the tradeoff needed for it to reliably work at all. */
  useEffect(() => {
    const process = () => {
      if (window.instgrm) window.instgrm.Embeds.process();
      if (window.twttr?.widgets) window.twttr.widgets.load();
    };
    process();
    const timer = setTimeout(process, 500);

    const timestamp = Date.now();
    const existingTikTok = document.getElementById("tiktok-embed-script");
    if (existingTikTok) existingTikTok.remove();
    const tiktokScript = document.createElement("script");
    tiktokScript.id = "tiktok-embed-script";
    tiktokScript.src = `https://www.tiktok.com/embed.js?t=${timestamp}`;
    tiktokScript.async = true;
    document.body.appendChild(tiktokScript);

    return () => clearTimeout(timer);
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

  // All non-guest Article/Video rows
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

  // Split coverage rows: the "couldn't attend" row gets its own section,
  // everything else is general Wedding Details. Normalized match (strips
  // punctuation/spacing/case) so curly vs straight apostrophes, extra
  // spaces, etc. can't silently break the split.
  const normalizeForMatch = (s) => (s || "").toLowerCase().replace(/[^a-z]/g, "");

  const uninvitedRecords = useMemo(
    () =>
      coverageRecords.filter((r) =>
        normalizeForMatch(r.fields?.["Name"]).includes("couldntattend")
      ),
    [coverageRecords]
  );

  const generalDetailRecords = useMemo(
    () =>
      coverageRecords.filter(
        (r) => !normalizeForMatch(r.fields?.["Name"]).includes("couldntattend")
      ),
    [coverageRecords]
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
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-2xl md:text-3xl font-serif text-[#8e3e3e] text-center mb-6">
          T&amp;T&apos;s Wedding
        </h1>

        {/* Tab toggle */}
        <div className="flex justify-center gap-2 mb-6">
          <button
            onClick={() => switchTab("guests")}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
              activeTab === "guests"
                ? "bg-[#8a9ac7] text-white"
                : "bg-white text-[#6b7db3] border border-[#c5cae9]"
            }`}
          >
            Guest List
          </button>
          <button
            onClick={() => switchTab("details")}
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
        ) : (
          <div>
            {/* Guest List is the default tab, so it's always mounted.
                Simple hidden toggle is safe here since it was already
                visible (and its embeds already processed) before any
                hiding ever happens. */}
            <div className={activeTab === "guests" ? "" : "hidden"}>
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
            </div>

            {/* Wedding Details only mounts the first time you actually
                open the tab — its first visit has a brief real loading
                moment (unavoidable network fetch), but it's only ever
                hidden AFTER that succeeds, so embeds never get skipped. */}
            {visitedTabs.details && (
              <div className={activeTab === "details" ? "" : "hidden"}>
                <div className="flex flex-col gap-10">
                  <WeddingDetailsSection
                    title="Wedding Details"
                    records={generalDetailRecords}
                    emptyMessage="No wedding details added yet."
                    showTitle={false}
                  />
                  <WeddingDetailsSection
                    title="Guests Who Couldn't Attend"
                    records={uninvitedRecords}
                    emptyMessage="Nothing added yet."
                    titleClassName="text-2xl md:text-3xl font-serif text-[#8e3e3e] mb-6 text-center"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
