"use client";

import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import "./post_detail_body.css";
import AdSlot from "./adslot";

// Image URL helper
const isLikelyImage = (url) => {
  if (!url) return false;
  const lower = url.toLowerCase();
  return (
    /\.(jpg|jpeg|png|webp|gif)$/i.test(lower) ||
    lower.includes("preview.redd.it") ||
    lower.includes("hips.hearstapps.com") ||
    lower.includes("resize=") ||
    lower.includes("crop=smart") ||
    lower.includes("imgur.com/") ||
    lower.includes("media.tumblr.com") ||
    lower.includes("imageproxy") ||
    lower.includes("twimg.com/media/")
  );
};

// Simple helper to detect Getty URLs
const isGettyUrl = (url) => {
  if (!url) return false;
  const lower = url.toLowerCase();
  return lower.includes("gettyimages.com");
};

// Detect Facebook URLs
const isFacebookUrl = (url) => {
  if (!url) return false;
  const lower = url.toLowerCase();
  return (
    lower.includes("facebook.com") ||
    lower.includes("fb.watch") ||
    lower.includes("fb.com")
  );
};

// Detect Pinterest URLs
const isPinterestUrl = (url) => {
  if (!url) return false;
  const lower = url.toLowerCase();
  return (
    lower.includes("pinterest.com/pin/") ||
    lower.includes("pin.it/")
  );
};

// Extract Pinterest pin ID
const getPinterestPinId = (url) => {
  if (!url) return null;

  const match = url.match(/pinterest\.com\/pin\/(\d+)/i);
  return match ? match[1] : null;
};
// Format DATE field as "Nov-07-2025" (force UTC so it doesn't shift by timezone)
const formatEventDate = (isoDate) => {
  if (!isoDate) return "";
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return "";

  const month = d.toLocaleString("en-US", {
    month: "short",
    timeZone: "UTC",
  });
  const day = String(d.getUTCDate()).padStart(2, "0");
  const year = d.getUTCFullYear();

  return `${month}-${day}-${year}`;
};

// Normalize Instagram URLs so embed.js is happy
const normalizeInstagramUrl = (raw) => {
  if (!raw) return "";

  // Remove query params
  const clean = raw.trim().split("?")[0];

  // Try to extract shortcode + type
  // Matches ALL of these:
  // - instagram.com/p/SHORT/
  // - instagram.com/reel/SHORT/
  // - instagram.com/tv/SHORT/
  // - instagram.com/user/p/SHORT/
  const match = clean.match(
    /instagram\.com\/(?:[^/]+\/)?(p|reel|tv)\/([^/?#]+)/i
  );

  if (!match) return ""; // bad URL

  const type = match[1].toLowerCase();      // p | reel | tv
  const shortcode = match[2];               // CP-xHUvn_Ve

  // Canonical embed URL
  return `https://www.instagram.com/${type}/${shortcode}/`;
};

// Helper to extract domain from URL for favicon
const getDomainFromUrl = (url) => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return 'website';
  }
};

// Helper to get favicon
const getFaviconUrl = (domain) => {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
};

const getFallbackTitleFromUrl = (url, domain) => {
  try {
    const pathname = new URL(url).pathname;
    const parts = pathname.split("/").filter(Boolean);
    const slug = parts[parts.length - 1] || "";

    const cleaned = slug
  .replace(/\.\w+$/, "")
  .replace(/[-_]+\d+(?:[-_]\d+)*$/, "")
  .replace(/[-_]+/g, " ")
  .replace(/\b\w/g, (c) => c.toUpperCase())
  .trim();

    if (cleaned && cleaned.length > 3) {
      return cleaned;
    }
  } catch {}

  return (
    domain.split(".")[0].charAt(0).toUpperCase() +
    domain.split(".")[0].slice(1) +
    " Article"
  );
};

function AroundThisTime({ eventDate, currentPostId }) {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [events, setEvents] = useState({ before: [], sameDay: [], after: [] })
  const [loading, setLoading] = useState(false)
  const [fetched, setFetched] = useState(false)

  const formatCardDate = (isoDate) => {
    if (!isoDate) return ""
    const d = new Date(isoDate)
    return d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric", timeZone: "UTC" })
  }

  const fetchEvents = async () => {
    if (fetched) return
    setLoading(true)
    try {
      const date = new Date(eventDate)
      const before = new Date(date)
      before.setUTCDate(before.getUTCDate() - 3)
      const after = new Date(date)
      after.setUTCDate(after.getUTCDate() + 3)
      const fmt = (d) => d.toISOString().split("T")[0]
      const res = await fetch(
        `https://api.airtable.com/v0/appVhtDyx0VKlGbhy/Taylor%20Swift%20Master%20Tracker?filterByFormula=AND(IS_AFTER({DATE},'${fmt(before)}'),IS_BEFORE({DATE},'${fmt(after)}'))&sort[0][field]=DATE&sort[0][direction]=asc&fields[]=DATE&fields[]=EVENT&fields[]=KEYWORDS`,
        { headers: { Authorization: `Bearer ${import.meta.env.VITE_AIRTABLE_API_KEY}` } }
      )
      const data = await res.json()
      const all = (data.records || []).filter(r => r.id !== currentPostId)
      const eventDateStr = fmt(date)
      const before3 = all.filter(r => r.fields?.DATE < eventDateStr).slice(-3)
      const sameDay = all.filter(r => r.fields?.DATE?.startsWith(eventDateStr)).slice(0, 3)
      const after3 = all.filter(r => r.fields?.DATE > eventDateStr).slice(0, 3)
      setEvents({ before: before3, sameDay, after: after3 })
      setFetched(true)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = () => {
    if (!isOpen && !fetched) fetchEvents()
    setIsOpen(prev => !prev)
  }

  const total = events.before.length + events.sameDay.length + events.after.length

  const EventCard = ({ record }) => {
    const handleClick = (e) => {
      const sel = window.getSelection()
      if (sel && sel.toString().length > 0) e.preventDefault()
    }
    return (
      <a
        href={`/post_details?id=${record.id}`}
        className="block w-full text-left bg-[#eef0fb] border border-[#c5cae9] rounded-xl p-3 hover:shadow-md hover:border-[#8a9ac7] transition-all duration-200"
        draggable={false}
        onDragStart={(e) => e.preventDefault()}
        onClick={handleClick}
      >
        <span className="inline-block bg-[#8a9ac7] text-white text-[10px] font-medium px-2 py-0.5 rounded-full mb-2">
          {formatCardDate(record.fields?.DATE)}
        </span>
        <p className="text-[#3d3d6b] font-medium text-xs leading-relaxed line-clamp-2">
          {record.fields?.EVENT || "Untitled Event"}
        </p>
        {record.fields?.KEYWORDS?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {record.fields.KEYWORDS.slice(0, 2).map((kw, i) => (
              <span key={i} className="bg-[#c5cae9] text-[#3d3d6b] text-[10px] px-1.5 py-0.5 rounded-full">{kw}</span>
            ))}
          </div>
        )}
      </a>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 mb-8">
      <button
        type="button"
        onClick={handleToggle}
        className="w-full flex items-center justify-between bg-white/70 border border-[#e3d5dd] rounded-xl px-4 py-3 hover:bg-white/90 transition-colors"
      >
        <span className="flex flex-col items-start">
          <span className="text-sm font-semibold text-[#8e3e3e] flex items-center gap-2">
            📅 Around This Time
            {fetched && total > 0 && (
              <span className="bg-[#8a9ac7] text-white text-[10px] px-2 py-0.5 rounded-full">{total}</span>
            )}
          </span>
          <span className="text-[10px] text-[#6b7db3] mt-0.5">
            {isOpen ? "Collapse" : "Expand to see other events around this time"}
          </span>
        </span>
        <span className="text-[#8e3e3e] text-sm">{isOpen ? "▲" : "▼"}</span>
      </button>

      {isOpen && (
        <div className="mt-3 bg-white/60 border border-[#c5cae9] rounded-xl p-4">
          {loading ? (
            <div className="flex justify-center py-4">
              <div className="w-6 h-6 border-2 border-[#8a9ac7] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : total === 0 ? (
            <p className="text-center text-sm text-[#6b7db3] py-2">No nearby events found.</p>
          ) : (
            <div className="space-y-4">
              {events.before.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-[#6b7db3] font-semibold mb-2">Before</p>
                  <div className="space-y-2">{events.before.map(r => <EventCard key={r.id} record={r} />)}</div>
                </div>
              )}
              {events.sameDay.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-[#6b7db3] font-semibold mb-2">Same Day</p>
                  <div className="space-y-2">{events.sameDay.map(r => <EventCard key={r.id} record={r} />)}</div>
                </div>
              )}
              {events.after.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-[#6b7db3] font-semibold mb-2">After</p>
                  <div className="space-y-2">{events.after.map(r => <EventCard key={r.id} record={r} />)}</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function LinkPreview({ url }) {
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const domain = getDomainFromUrl(url);

  useEffect(() => {
    let isMounted = true;
    setPreviewData(null);
    setLoading(true);

    const fetchPreview = async () => {
  if (!isMounted) return;

  try {
    const response = await fetch(`/api/og-preview?url=${encodeURIComponent(url)}`);
    if (!response.ok) throw new Error('Failed');

    const data = await response.json();

    if (isMounted) {
      setPreviewData({
        title: data.title || getFallbackTitleFromUrl(url, domain),
        description: data.description || '',
        image: data.image || getFaviconUrl(domain),
        domain: data.domain || domain,
        url: url,
        isSiteFallback: false,
      });
    }
  } catch (error) {
    if (isMounted) {
      setPreviewData({
        title: getFallbackTitleFromUrl(url, domain),
        image: getFaviconUrl(domain),
        domain: domain,
        url: url,
      });
    }
  } finally {
    if (isMounted) setLoading(false);
  }
};

    fetchPreview();
    return () => { isMounted = false; };
  }, [url, domain]);

  if (loading) {
    return (
      <div className="microlink-card block max-w-md mx-auto mb-4 rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm animate-pulse">
        <div className="h-40 bg-gray-200 animate-pulse"></div>
        <div className="p-4">
          <div className="h-4 bg-gray-200 rounded mb-2 w-3/4 animate-pulse"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
        </div>
      </div>
    );
  }

  const isFallbackFavicon = (imageUrl) => {
    if (!imageUrl) return true;
    const s = String(imageUrl).toLowerCase();
    return s.includes("google.com/s2/favicons");
  };

  const hasUsableImage =
    !!previewData?.image &&
    !isFallbackFavicon(previewData.image) &&
    !previewData?.isSiteFallback;

  if (!hasUsableImage) {
    return (
      <a
        href={previewData.url}
        target="_blank"
        rel="noopener noreferrer"
        className="microlink-card block w-full max-w-md mb-4 rounded-xl border border-gray-200 bg-[#fff8f8] p-4 shadow-sm hover:shadow-lg transition-all duration-300 hover:border-red-400 hover:-translate-y-1 group"
      >
        <div className="flex items-center gap-3">
          <img
            src={getFaviconUrl(domain)}
            alt={domain}
            className="w-10 h-10 rounded-lg border border-gray-200 shadow-sm flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-[#8e3e3e] transition-colors">
              {previewData.title}
            </h3>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-gray-500 truncate">{previewData.domain}</span>
              <span className="flex items-center gap-1 text-xs font-semibold text-[#8e3e3e]">Read article →</span>
            </div>
          </div>
        </div>
      </a>
    );
  }

  return (
    <a
      href={previewData.url}
      target="_blank"
      rel="noopener noreferrer"
      className="microlink-card block w-full max-w-md mb-4 rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:border-red-400 hover:-translate-y-1 group"
    >
      <div className="h-48 overflow-hidden bg-gray-100 relative">
        <img
          src={previewData.image}
          alt={previewData.title}
          className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            e.target.style.display = 'none';
            const parent = e.target.parentElement;
            if (parent.querySelector('.fallback-container')) return;
            const fallback = document.createElement('div');
            fallback.className = 'fallback-container w-full h-full flex flex-col items-center justify-center bg-gray-50';
            const favicon = document.createElement('img');
            favicon.src = getFaviconUrl(domain);
            favicon.className = 'w-12 h-12 mb-2 opacity-50';
            const domainText = document.createElement('span');
            domainText.className = 'text-xs text-gray-400';
            domainText.textContent = domain;
            fallback.appendChild(favicon);
            fallback.appendChild(domainText);
            parent.appendChild(fallback);
          }}
        />
      </div>
      <div className="p-5">
        <div className="flex items-start gap-4">
          <img src={getFaviconUrl(domain)} alt={domain} className="w-8 h-8 rounded border" />
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-[#8e3e3e] group-hover:to-red-500">
              {previewData.title}
            </h3>
            {previewData.description && (
              <p className="text-sm text-gray-500 mb-3 line-clamp-2 leading-relaxed">{previewData.description}</p>
            )}
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-xs text-gray-400">{previewData.domain}</span>
              <span className="text-xs font-semibold text-[#8e3e3e] group-hover:text-red-600 transition-colors">Read article →</span>
            </div>
          </div>
        </div>
      </div>
    </a>
  );
}

function InstagramFallbackCard({ url }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="microlink-card block w-full max-w-md mb-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-lg transition-all duration-300 hover:border-red-400 hover:-translate-y-1 group"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-[#f9ce67] via-[#e85a19] to-[#415dc3] flex items-center justify-center text-white shadow-sm flex-shrink-0">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-[#8e3e3e] transition-colors">
            View post on Instagram
          </h3>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-gray-500 truncate">instagram.com</span>
            <span className="flex items-center gap-1 text-xs font-semibold text-[#8e3e3e]">
              Open post →
            </span>
          </div>
        </div>
      </div>
    </a>
  );
}

function TwitterFallbackCard({ url }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="microlink-card block w-full max-w-md mb-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-lg transition-all duration-300 hover:border-red-400 hover:-translate-y-1 group"
    >
      <div className="flex items-center gap-3">
        <img
          src={getFaviconUrl("x.com")}
          alt="X"
          className="w-10 h-10 rounded-lg border border-gray-200 shadow-sm flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-[#8e3e3e] transition-colors">
            View post on X
          </h3>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-gray-500 truncate">x.com</span>
            <span className="flex items-center gap-1 text-xs font-semibold text-[#8e3e3e]">
              Open post
              <svg
                className="w-3 h-3 transform group-hover:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </a>
  );
}

function InstagramEmbed({ url }) {
  const [status, setStatus] = useState("loading");
  const containerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const checkOembed = async () => {
      try {
        const res = await fetch(`/api/ig-check?url=${encodeURIComponent(url)}`);
const data = await res.json();
console.log("IG check:", url, data);
if (!cancelled) {
  setStatus(data.valid ? "valid" : "failed");
}
      } catch {
        if (!cancelled) setStatus("failed");
      }
    };

    checkOembed();
    return () => { cancelled = true; };
  }, [url]);

  // Once confirmed valid, trigger Instagram embed processing
  useEffect(() => {
    if (status !== "valid") return;
    const timer = setTimeout(() => {
      if (window.instgrm?.Embeds) {
        window.instgrm.Embeds.process();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [status]);

  if (status === "loading") {
    return (
      <div className="instagram-container flex flex-col items-center" style={{ width: "326px" }}>
        <div className="w-full rounded-xl border border-gray-200 bg-white p-4 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (status === "failed") return <InstagramFallbackCard url={url} />;

  return (
    <div ref={containerRef} className="instagram-container flex flex-col items-center" style={{ width: "326px" }}>
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
          display: "block"
        }}
      >
        <div style={{ padding: "16px" }}>
          <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-500 text-sm font-medium">
            Loading Instagram post...
          </a>
        </div>
      </blockquote>
    </div>
  );
}

function TwitterEmbed({ url }) {
  const [failed, setFailed] = useState(false);
  const [checked, setChecked] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const cleanUrl = url.trim().replace("x.com", "twitter.com");
    const match = cleanUrl.match(/status\/(\d+)/);
    const tweetId = match ? match[1] : null;

    if (!tweetId) {
      setFailed(true);
      setChecked(true);
      return;
    }

    const checkIfEmbeddable = async () => {
      try {
        const oembedUrl = `https://publish.twitter.com/oembed?omit_script=true&url=${encodeURIComponent(cleanUrl)}`;
        const response = await fetch(oembedUrl);

        if (!response.ok) {
          if (!cancelled) {
            setFailed(true);
            setChecked(true);
          }
          return false;
        }

        if (!cancelled) {
          setChecked(true);
        }
        return true;
      } catch (error) {
        if (!cancelled) {
          setFailed(true);
          setChecked(true);
        }
        return false;
      }
    };

    const renderTweet = async () => {
      try {
        if (!window.twttr || !window.twttr.widgets || !containerRef.current) {
          if (!cancelled) {
            setFailed(true);
          }
          return;
        }

        containerRef.current.innerHTML = "";

        await window.twttr.widgets.createTweet(tweetId, containerRef.current, {
          align: "left",
          theme: "light",
          dnt: true,
          conversation: "none",
        });

        if (!cancelled && !containerRef.current.querySelector("iframe")) {
          setFailed(true);
        }
      } catch (err) {
        if (!cancelled) {
          setFailed(true);
        }
      }
    };

    const init = async () => {
      const embeddable = await checkIfEmbeddable();
      if (!embeddable || cancelled) return;

      let attempts = 0;

      const interval = setInterval(() => {
        attempts += 1;

        if (window.twttr && window.twttr.widgets) {
          clearInterval(interval);
          renderTweet();
        } else if (attempts > 30) {
          clearInterval(interval);
          if (!cancelled) {
            setFailed(true);
          }
        }
      }, 300);
    };

    init();

    return () => {
      cancelled = true;
    };
  }, [url]);

  if (failed) {
    return <TwitterFallbackCard url={url} />;
  }

  if (!checked) {
    return (
      <div
        className="microlink-card block w-full max-w-md mb-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm animate-pulse"
      >
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  return (
    <div
      className="twitter-container flex-shrink-0"
      style={{ width: "320px" }}
      ref={containerRef}
    />
  );
}

export default function PostDetailBody() {
  const navigate = useNavigate();
  const location = useLocation();

  // Parse query params manually using URLSearchParams
  const searchParams = new URLSearchParams(location.search);
  const postId = searchParams.get("id");

  // State variables
  const [event, setEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Source link state
  const [sourceImages, setSourceImages] = useState([]);
  const [nonImageLinks, setNonImageLinks] = useState([]);

  // Scroll to top on mount / id change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [postId]);

  // Fetch post data using the postId
  useEffect(() => {
    const fetchPostDetails = async () => {
      setLoading(true);
      try {
        if (!postId) {
          console.error("No post ID provided");
          setLoading(false);
          return;
        }

        const response = await fetch(
          `https://api.airtable.com/v0/appVhtDyx0VKlGbhy/Taylor%20Swift%20Master%20Tracker/${postId}`,
          {
            headers: {
              Authorization: `Bearer ${import.meta.env.VITE_AIRTABLE_API_KEY}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch post details");
        }

        const data = await response.json();
        setEvent(data.fields);
      } catch (error) {
        console.error("Error fetching post details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPostDetails();
  }, [postId]);

  // Populate sourceImages / nonImageLinks from event.SOURCES
  useEffect(() => {
  if (!event || !event.SOURCES) return;

  const rawUrls = event.SOURCES.split(" || ").map((url) => url.trim());

  const imageLinks = rawUrls.filter(
    (url) => isLikelyImage(url) || isPinterestUrl(url)
  );

  const otherLinks = rawUrls.filter(
    (url) => !isLikelyImage(url) && !isPinterestUrl(url)
  );

  setSourceImages(imageLinks);
  setNonImageLinks(otherLinks);
}, [event]);
  
  // Modal helpers
  const closeModal = () => setIsModalOpen(false);

  const prevImage = () => {
    if (!event?.IMAGE?.length) return;
    setSelectedImageIndex((prevIndex) =>
      prevIndex === 0 ? event.IMAGE.length - 1 : prevIndex - 1
    );
  };

  const nextImage = () => {
    if (!event?.IMAGE?.length) return;
    setSelectedImageIndex((prevIndex) =>
      prevIndex === event.IMAGE.length - 1 ? 0 : prevIndex + 1
    );
  };

  const handleBackToTimeline = () => {
    navigate("/posts");
  };

  const formatNotes = (notes) => {
    if (!notes) return null;
    return notes.split("\n\n").map((paragraph, index) => (
      <p key={index} className="mb-2 whitespace-pre-line">
        {paragraph}
      </p>
    ));
  };

  // Keyboard navigation for modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isModalOpen) {
        if (e.key === "ArrowLeft") prevImage();
        else if (e.key === "ArrowRight") nextImage();
        else if (e.key === "Escape") closeModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModalOpen, selectedImageIndex, event?.IMAGE]);

    // Social media embeds script loading (Instagram, Twitter)
  useEffect(() => {
    if (!event) return;

    const loadInstagramScript = () => {
      if (!document.getElementById("instagram-embed-script")) {
        const script = document.createElement("script");
        script.id = "instagram-embed-script";
        script.src = "//www.instagram.com/embed.js";
        script.async = true;
        document.body.appendChild(script);
      } else {
        if (window.instgrm) {
          window.instgrm.Embeds.process();
        } else {
          setTimeout(() => {
            if (window.instgrm) window.instgrm.Embeds.process();
          }, 1000);
        }
      }
    };

    const loadTwitterScript = () => {
      if (window.twttr && window.twttr.widgets) {
        window.twttr.widgets.load();
      } else if (!document.getElementById("twitter-embed-script")) {
        const script = document.createElement("script");
        script.id = "twitter-embed-script";
        script.src = "https://platform.twitter.com/widgets.js";
        script.async = true;
        script.onload = () => {
          if (window.twttr?.widgets) window.twttr.widgets.load();
        };
        document.body.appendChild(script);
      }
    };

    if (event.INSTAGRAM) {
      loadInstagramScript();
      setTimeout(loadInstagramScript, 500);
    }

    if (event.TWITTER) {
      loadTwitterScript();
    }
  }, [event]);
  
  // Getty embed: inject HTML and execute its scripts
useEffect(() => {
  const embedHtml = event?.["GETTY EMBED"];
  if (!embedHtml) return;

  const container = document.getElementById("getty-embed-container");
  if (!container) return;

  // Clear previous content
  container.innerHTML = '';

  // Create a temporary div to parse the HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = embedHtml;
  
  // Append all elements to the container
  while (tempDiv.firstChild) {
    container.appendChild(tempDiv.firstChild);
  }

  // Find and re-execute script tags
  const scripts = container.getElementsByTagName('script');
  const scriptsArray = Array.from(scripts);

  scriptsArray.forEach((oldScript) => {
    const newScript = document.createElement('script');
    
    // Copy all attributes
    Array.from(oldScript.attributes).forEach(attr => {
      newScript.setAttribute(attr.name, attr.value);
    });
    
    // Copy inner content for inline scripts
    if (oldScript.innerHTML) {
      newScript.innerHTML = oldScript.innerHTML;
    }
    
    // Remove the old script
    oldScript.parentNode.removeChild(oldScript);
    
    // Append the new script to body to execute it
    document.body.appendChild(newScript);
  });

  // If gie.widgets exists, call load
  if (window.gie && window.gie.widgets) {
    window.gie.widgets.load();
  }
}, [event?.["GETTY EMBED"]]);

// Facebook embed: inject iframe HTML
useEffect(() => {
  const embedHtml = event?.["FACEBOOK EMBED"];
  if (!embedHtml) return;

  const container = document.getElementById("facebook-embed-container");
  if (!container) return;

  container.innerHTML = embedHtml;
}, [event?.["FACEBOOK EMBED"]]);
  
  // Pinterest embed script
useEffect(() => {
  if (!document.getElementById("pinterest-script")) {
    const script = document.createElement("script");
    script.id = "pinterest-script";
    script.src = "https://assets.pinterest.com/js/pinit.js";
    script.async = true;
    document.body.appendChild(script);
  }
}, []);
 
  // TikTok embed script loading
  useEffect(() => {
    if (!event?.TIKTOK) return;

    const existing = document.getElementById("tiktok-embed-script");
    const timestamp = Date.now();

    const script = document.createElement("script");
    script.id = "tiktok-embed-script";
    script.src = `https://www.tiktok.com/embed.js?t=${timestamp}`;
    script.async = true;

    if (existing && existing.parentNode) {
      existing.parentNode.removeChild(existing);
    }

    document.body.appendChild(script);
  }, [event?.TIKTOK]);

  // Loading / missing state
  if (loading) {
    return (
      <div className="bg-[#e6edf7] py-8 md:py-12">
        <div className="max-w-4xl mx-auto py-8 bg-[#fef2f2] mb-6 text-center text-[#6b7280]">
          Loading post details...
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="bg-[#e6edf7] py-8 md:py-12">
        <div className="max-w-4xl mx-auto py-8 bg-[#fef2f2] mb-6 text-center text-[#6b7280]">
          No post details available.
          <button
            onClick={handleBackToTimeline}
            className="ml-2 text-red-400 underline"
          >
            Back to Timeline
          </button>
        </div>
      </div>
    );
  }

  // Derived flags
  const hasVideos = !!event.YOUTUBE;
  const hasNotes = !!event.NOTES && event.NOTES.trim() !== "";
  const hasSources = nonImageLinks.length > 0 || sourceImages.length > 0;
  const instagramUrls = event?.INSTAGRAM
  ? event.INSTAGRAM.split(" || ")
      .map((rawUrl) => normalizeInstagramUrl(rawUrl))
      .filter(Boolean)
  : [];

const twitterUrls = event?.TWITTER
  ? event.TWITTER.split(" || ")
      .map((url) => url.trim())
      .filter((trimmedUrl) => {
        const cleanUrl = trimmedUrl.replace("x.com", "twitter.com");
        return /^https:\/\/twitter\.com\/[^/]+\/status\/\d+/.test(cleanUrl);
      })
  : [];

const getEmbedJustifyClass = (count) => {
  return count >= 4 ? "justify-start" : "justify-center";
};
  // ---- MAIN RENDER ----
  return (
    <div className="bg-[#e6edf7] py-8 md:py-12">
      {/* Compact title/date block */}
      <section className="max-w-4xl mx-auto px-4 mt-2 mb-8 text-center">
  {event.EVENT && (
    <h2 className="text-xl md:text-2xl font-serif text-[#8e3e3e] leading-snug">
      {event.EVENT}
    </h2>
  )}
  {event.DATE && (
    <p className="mt-1 text-sm md:text-base text-[#6b7db3]">
      {formatEventDate(event.DATE)}
    </p>
  )}

  {event.KEYWORDS && event.KEYWORDS.length > 0 && (
    <div className="mt-4 flex flex-wrap justify-center gap-2">
      {event.KEYWORDS.map((tag, index) => (
        <button
          key={index}
          type="button"
          onClick={() => navigate(`/posts?keyword=${encodeURIComponent(tag)}`)}
          className="bg-[#8a9ac7] text-white font-medium text-xs md:text-sm px-3 py-1 rounded-full whitespace-nowrap shadow-sm hover:bg-[#6b7db3] transition-colors"
        >
          {tag}
        </button>
      ))}
    </div>
  )}

  {/* No Notes Fallback */}
  {!event.NOTES && (
          <p className="mt-3 text-sm md:text-base text-[#8e3e3e] font-medium italic leading-relaxed px-2">
            No additional notes are available for this event yet, but more
            context may be added later as Swift Lore expands its archive of
            Taylor Swift’s releases, performances, interviews, and cultural
            milestones.
          </p>
        )}
      </section>

      {/* NOTES + SOURCES */}
      {(hasNotes || hasSources) && (
        <section className="max-w-4xl mx-auto px-4 mb-10">
          {hasNotes && (
            <div className="text-sm md:text-base text-[#111827] leading-relaxed mb-6 bg-white/70 rounded-xl p-4 border border-[#e3d5dd]">
              <span className="font-semibold">Notes: </span>
              {formatNotes(event.NOTES)}
            </div>
          )}

          {hasSources && (
            <div className="space-y-6">
              {sourceImages.length > 0 && (
                <div className="image-only-grid flex flex-wrap gap-6 justify-start mb-8">
                  {sourceImages.map((url, index) => {
                    const isPinterest = isPinterestUrl(url);
                    const pinId = getPinterestPinId(url);
                    const domain = getDomainFromUrl(url);

                    if (isPinterest && pinId) {
                      return (
                        <div
                          key={`img-${index}`}
                          className="group relative bg-gray-100 rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg transition-all duration-300 hover:border-red-400"
                          style={{ width: "420px", height: "300px" }}
                        >
                          <iframe
                            src={`https://assets.pinterest.com/ext/embed.html?id=${pinId}`}
                            width="100%"
                            height="100%"
                            frameBorder="0"
                            scrolling="no"
                            style={{ border: "0", overflow: "hidden" }}
                          />
                        </div>
                      );
                    }

                    return (
                      <a
                        key={`img-${index}`}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative flex flex-col bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:border-red-400 hover:-translate-y-1"
                        style={{ width: "420px", height: "300px" }}
                        onClick={(e) => {
                          // Prevent link click if you want the modal to open instead
                          // e.preventDefault();
                          // setSelectedImageIndex(sourceImages.indexOf(url) + (event.IMAGE?.length || 0));
                          // setIsModalOpen(true);
                        }}
                      >
                        <div className="h-full w-full overflow-hidden bg-gray-50">
                          <img
                            src={url}
                            alt="Source Content"
                            className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-gray-100 p-2 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                           <div className="flex items-center gap-2">
                             <img src={getFaviconUrl(domain)} className="w-4 h-4" alt="icon" />
                             <span className="text-xs font-medium text-gray-600 truncate">{domain}</span>
                           </div>
                        </div>
                      </a>
                    );
                  })}
                </div>
              )}

              {nonImageLinks.length > 0 && (
                <div className="microlink-grid">
                  {nonImageLinks.map((url, index) => {
                    const isGetty = isGettyUrl(url);
const isFacebook = isFacebookUrl(url);

if (isGetty) {
                      // Clean, branded Getty card instead of Microlink
                      return (
                        <a
                          key={`link-${index}`}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="microlink-card block w-full max-w-md mb-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded bg-black flex items-center justify-center text-white text-xs font-semibold">
                              GETTY
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-[#8e3e3e] truncate">
                                View this photo on Getty Images
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                gettyimages.com
                              </p>
                            </div>
                          </div>
                        </a>
                      );
                    }

if (isFacebook) {
  return (
    <a
      key={`link-${index}`}
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="microlink-card block w-full max-w-md mb-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-center gap-3">
        <img
          src="https://www.facebook.com/images/fb_icon_325x325.png"
          alt="Facebook"
          className="w-10 h-10 rounded-lg"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#8e3e3e] truncate">
            View this post on Facebook
          </p>
          <p className="text-xs text-gray-500 truncate">
            facebook.com
          </p>
        </div>
      </div>
    </a>
  );
}
                  
      // Non-Getty links: use our custom LinkPreview component
                    return (
                      <LinkPreview key={`link-${index}`} url={url} />
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </section>
      )}

{/* Around This Time */}
      {event?.DATE && (
        <AroundThisTime eventDate={event.DATE} currentPostId={postId} />
      )}
      
      {/* AdSense: Post Detail (inline) */}
      {import.meta.env.PROD && !!event && (
        <div className="max-w-4xl mx-auto px-4 mb-8">
          <AdSlot 
            variant="leaderboard" 
            maxWidthClass="max-w-4xl" 
          />
        </div>
      )}
      
      {/* Main image */}
      {event.IMAGE && event.IMAGE.length > 0 && (
        <section className="max-w-4xl mx-auto px-4 mb-10">
          <img
            src={event.IMAGE[0].url}
            alt="Post Detail"
            className="w-full max-w-[600px] rounded-lg object-cover cursor-pointer shadow-sm"
            onClick={() => {
              setSelectedImageIndex(0);
              setIsModalOpen(true);
            }}
          />
        </section>
      )}

            {/* Getty */}
      {event["GETTY EMBED"] && (
        <section className="max-w-4xl mx-auto px-4 mb-10">
          <div
            id="getty-embed-container"
            className="getty-embed w-full max-w-4xl"
          />
        </section>
      )}

      {/* Facebook */}
{event["FACEBOOK EMBED"] && (
  <section className="max-w-4xl mx-auto px-4 mb-10">
    <div
      id="facebook-embed-container"
      className="facebook-embed w-full max-w-[500px]"
    />
  </section>
)}

      {/* YouTube */}
{hasVideos && (
  <section className="max-w-4xl mx-auto px-4 mb-10">
    <div
      className={`mt-2 ${
        event.YOUTUBE?.split(/,\s*|\s*\|\|\s*/).length > 1
          ? "grid grid-cols-1 md:grid-cols-2 gap-6"
          : "flex flex-col items-center gap-6"
      }`}
    >
      {event.YOUTUBE?.split(/,\s*|\s*\|\|\s*/).map((rawUrl, index) => {
        const url = rawUrl.trim();

        // 🔥 Robust YouTube ID extractor — works for ALL formats
        const getId = (input) => {
          if (!input) return null;

          // youtu.be short links
          let m = input.match(/youtu\.be\/([^?&]+)/);
          if (m) return m[1];

          // standard watch URL
          m = input.match(/[?&]v=([^?&]+)/);
          if (m) return m[1];

          // shorts
          m = input.match(/shorts\/([^?&/]+)/);
          if (m) return m[1];

          // embed
          m = input.match(/embed\/([^?&/]+)/);
          if (m) return m[1];

          return null;
        };

        const videoId = getId(url);
        if (!videoId) return null;

        return (
          <div key={index} className="w-full">
            <div className="relative" style={{ paddingBottom: "56.25%" }}>
              <iframe
                src={`https://www.youtube.com/embed/${videoId}`}
                title={`YouTube Video ${index + 1}`}
                className="absolute top-0 left-0 w-full h-full rounded-xl"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        );
      })}
    </div>
  </section>
)}


      {/* Instagram */}
{event.INSTAGRAM && (
  <section className="w-full px-4 mb-10">
    <div
      className={`flex flex-wrap gap-6 mt-2 max-w-[1400px] mx-auto items-start ${getEmbedJustifyClass(
        instagramUrls.length
      )}`}
    >
      {instagramUrls.map((url, index) => (
        <InstagramEmbed key={index} url={url} />
      ))}
    </div>
  </section>
)}

                  {/* Twitter / X */}
      {event.TWITTER && (
  <section className="w-full px-4 mb-10">
    <div
      className={`flex flex-wrap gap-6 mt-2 max-w-[1400px] mx-auto ${getEmbedJustifyClass(
        twitterUrls.length
      )}`}
    >
      {twitterUrls.map((url, index) => (
        <TwitterEmbed key={index} url={url} />
      ))}
    </div>
  </section>
)}

      {/* TikTok */}
      {event.TIKTOK && (
        <section className="max-w-6xl mx-auto px-4 mb-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center mt-2">
            {event.TIKTOK.split(" || ").map((raw, index) => {
              const cleanUrl = raw.trim();
              if (!cleanUrl) return null;

              const videoId =
                cleanUrl.split("/video/")[1]?.split("?")[0] ||
                cleanUrl.split("/t/")[1]?.split("/")[0];

              return (
                <div key={index} className="tiktok-wrapper">
                  <blockquote
                    className="tiktok-embed"
                    cite={cleanUrl}
                    data-video-id={videoId || undefined}
                  >
                    <a href={cleanUrl}></a>
                  </blockquote>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Image Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
          >
            <motion.div
              className="relative max-w-4xl max-h-[90vh] mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                const imageArrayLength = event.IMAGE?.length || 0;
                const totalImages = imageArrayLength + sourceImages.length;

                if (selectedImageIndex < imageArrayLength) {
                  return (
                    <img
                      src={event.IMAGE[selectedImageIndex].url}
                      alt="Full view"
                      className="max-w-full max-h-[80vh] object-contain rounded-lg"
                    />
                  );
                } else if (selectedImageIndex < totalImages) {
                  return (
                    <img
                      src={
                        sourceImages[selectedImageIndex - imageArrayLength]
                      }
                      alt="Full view"
                      className="max-w-full max-h-[80vh] object-contain rounded-lg"
                    />
                  );
                } else {
                  return (
                    <p className="text-white bg-black bg-opacity-50 p-4 rounded-lg">
                      No image to display.
                    </p>
                  );
                }
              })()}

              <button
                className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-red-400 text-white rounded-full"
                onClick={closeModal}
              >
                ✕
              </button>

              {(() => {
                const imageArrayLength = event.IMAGE?.length || 0;
                const totalImages = imageArrayLength + sourceImages.length;
                return totalImages > 1;
              })() && (
                <>
                  <button
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-red-400 text-white rounded-full opacity-70 hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      prevImage();
                    }}
                  >
                    ←
                  </button>
                  <button
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-red-400 text-white rounded-full opacity-70 hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      nextImage();
                    }}
                  >
                    →
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}