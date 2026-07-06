"use client";

import { useState, useEffect, useMemo } from "react";
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
          width: "326px",
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
    );
  }

  if (platform === "twitter") {
    return (
      <blockquote className="twitter-tweet" data-theme="light">
        <a href={url} target="_blank" rel="noopener noreferrer">
          View post on X
        </a>
      </blockquote>
    );
  }

  if (platform === "youtube") {
    const videoId = getYouTubeId(url);
    if (videoId) {
      return (
        <div
          className="rounded-lg overflow-hidden shadow-sm border border-[#c5cae9]"
          style={{ width: "326px", aspectRatio: "16/9" }}
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
/*  Guest card                                                         */
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
          {f["SPECIAL ROLE / MOMENT"] && (
            <span className="bg-[#b66b6b] text-white text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap">
              {f["SPECIAL ROLE / MOMENT"]}
            </span>
          )}
        </div>
      </div>

      {f["NOTES"] && (
        <p className="text-sm text-[#6b7280] leading-relaxed">{f["NOTES"]}</p>
      )}

      {f["CAPTION(S)"] && (
        <p className="text-sm italic text-[#3d3d6b] leading-relaxed border-l-2 border-[#c5cae9] pl-3">
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
/*  Article / Video card                                               */
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
        <p className="text-sm text-[#6b7280] leading-relaxed">{f["NOTES"]}</p>
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
  const [activeGuestTypes, setActiveGuestTypes] = useState([]); // empty = all

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
      window.instgrm.Embeds.process();
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
  }, [records, activeTab, activeGuestTypes]);

  const guestRecords = useMemo(
    () => records.filter((r) => r.fields?.["GUEST TYPE"]),
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
    if (activeGuestTypes.length === 0) return guestRecords;
    return guestRecords.filter((r) =>
      activeGuestTypes.includes(r.fields["GUEST TYPE"])
    );
  }, [guestRecords, activeGuestTypes]);

  const toggleGuestType = (type) => {
    setActiveGuestTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  return (
    <div className="bg-[#e6edf7] py-8 md:py-12 min-h-screen">
      <div className="max-w-5xl mx-auto px-4">
        <h1 className="text-2xl md:text-3xl font-serif text-[#8e3e3e] text-center mb-6">
          T&amp;T&apos;s Wedding
        </h1>

        {/* Tab toggle */}
        <div className="flex justify-center gap-2 mb-8">
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

        {loading ? (
          <div className="flex flex-col gap-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-white/60 border border-[#c5cae9] rounded-2xl p-4 animate-pulse h-28"
              />
            ))}
          </div>
        ) : activeTab === "guests" ? (
          <>
            {/* Guest type filter chips */}
            <div className="flex flex-wrap gap-2 justify-center mb-6">
              <button
                onClick={() => setActiveGuestTypes([])}
                className={`text-xs font-medium px-3 py-1 rounded-full transition-colors ${
                  activeGuestTypes.length === 0
                    ? "bg-[#3d3d6b] text-white"
                    : "bg-white text-[#6b7db3] border border-[#c5cae9]"
                }`}
              >
                All ({guestRecords.length})
              </button>
              {GUEST_TYPES.map((type) => {
                const count = guestRecords.filter(
                  (r) => r.fields["GUEST TYPE"] === type
                ).length;
                if (count === 0) return null;
                return (
                  <button
                    key={type}
                    onClick={() => toggleGuestType(type)}
                    className={`text-xs font-medium px-3 py-1 rounded-full transition-colors whitespace-nowrap ${
                      activeGuestTypes.includes(type)
                        ? "bg-[#3d3d6b] text-white"
                        : "bg-white text-[#6b7db3] border border-[#c5cae9]"
                    }`}
                  >
                    {type} ({count})
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredGuests.length > 0 ? (
                filteredGuests.map((r) => <GuestCard key={r.id} record={r} />)
              ) : (
                <p className="col-span-2 text-center text-[#6b7280] italic">
                  No guests match that filter yet.
                </p>
              )}
            </div>
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
