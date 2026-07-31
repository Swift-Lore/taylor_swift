"use client";

/* ==================================================================== *
 *  SHARED LINK/EMBED SYSTEM                                             *
 *  Used by both WeddingPage.jsx and post_detail_body.jsx. Anything      *
 *  fixed here (a broken Instagram post, a garbled article title, a      *
 *  layout bug) is fixed on every page that imports it — no more         *
 *  manually copying fixes between two separate copies of this logic.    *
 * ==================================================================== */

import { useState, useEffect, useRef } from "react";

/* ------------------------------------------------------------------ */
/*  URL / domain helpers                                               */
/* ------------------------------------------------------------------ */

export const getDomainFromUrl = (url) => {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return "website";
  }
};

export const getFaviconUrl = (domain) =>
  `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

// Turns a URL slug into a readable title, filtering out anything that
// looks like an ID (pure numbers, or long letter+number hashes) rather
// than a real word — e.g. "1408092-full-text-of-the-release" becomes
// "Full Text Of The Release", and a slug that's ENTIRELY an ID (like a
// Huffpost hash "tk-n-6a4d953ce4b094d71e70f5a5") returns null so the
// caller can show a clean "View on Domain" card instead of garbage.
export const getFallbackTitleFromUrl = (url, domain) => {
  try {
    const pathname = new URL(url).pathname;
    const parts = pathname.split("/").filter(Boolean);
    const slug = (parts[parts.length - 1] || "").replace(/\.\w+$/, "");

    const tokens = slug.split(/[-_]+/).filter(Boolean);

    const isIdLikeToken = (t) => {
      if (/^\d+$/.test(t)) return true;
      if (t.length >= 6 && /\d/.test(t) && /[a-z]/i.test(t)) return true;
      return false;
    };

    const realWords = tokens.filter((t) => !isIdLikeToken(t));

    if (realWords.length < 3) return null;

    const cleaned = realWords
      .join(" ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim();

    if (cleaned.length < 10) return null;

    return cleaned;
  } catch {
    return null;
  }
};

export const isArchiveUrl = (url) => {
  if (!url) return false;
  const lower = url.toLowerCase();
  return (
    lower.includes("archive.today") ||
    lower.includes("archive.ph") ||
    lower.includes("archive.is")
  );
};

export const getOriginalFromArchiveUrl = (url) => {
  try {
    const match = url.match(/archive\.[a-z]+\/[^/]+\/(https?:\/\/.+)/i);
    return match ? match[1] : null;
  } catch {
    return null;
  }
};

export const isGettyUrl = (url) => {
  if (!url) return false;
  return url.toLowerCase().includes("gettyimages.com");
};

export const isFacebookUrl = (url) => {
  if (!url) return false;
  const lower = url.toLowerCase();
  return (
    lower.includes("facebook.com") ||
    lower.includes("fb.watch") ||
    lower.includes("fb.com")
  );
};

export const isPinterestUrl = (url) => {
  if (!url) return false;
  const lower = url.toLowerCase();
  return lower.includes("pinterest.com/pin/") || lower.includes("pin.it/");
};

export const getPinterestPinId = (url) => {
  if (!url) return null;
  const match = url.match(/pinterest\.com\/pin\/(\d+)/i);
  return match ? match[1] : null;
};

// Direct-image URL detection (includes common Reddit/Tumblr/Imgur
// CDN patterns, not just file extensions) — used to route a link
// straight into an image card instead of trying to scrape it as an
// article.
export const isLikelyImage = (url) => {
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

export const getYouTubeId = (url) => {
  if (!url) return null;
  let m = url.match(/youtu\.be\/([^?&]+)/);
  if (m) return m[1];
  m = url.match(/[?&]v=([^?&]+)/);
  if (m) return m[1];
  m = url.match(/shorts\/([^?&/]+)/);
  if (m) return m[1];
  m = url.match(/embed\/([^?&/]+)/);
  if (m) return m[1];
  return null;
};

// Strips tracking params (igsh=, utm_source=, etc.) and canonicalizes
// to Instagram's expected clean permalink format — some posts fail to
// embed with the tracking junk still attached even though most tolerate
// it fine.
export const normalizeInstagramUrl = (raw) => {
  if (!raw) return "";
  const clean = raw.trim().split("?")[0];
  const match = clean.match(
    /instagram\.com\/(?:[^/]+\/)?(p|reel|tv)\/([^/?#]+)/i
  );
  if (!match) return raw;
  const type = match[1].toLowerCase();
  const shortcode = match[2];
  return `https://www.instagram.com/${type}/${shortcode}/`;
};

export const getInstagramShortcode = (url) => {
  const match = url.match(
    /instagram\.com\/(?:[^/]+\/)?(?:p|reel|tv)\/([^/?#]+)/i
  );
  return match ? match[1] : null;
};

// One canonical platform classifier for a generic list of URLs (used
// by pages like Wedding where many platforms mix in a single field).
export const getPlatform = (url) => {
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

/* ------------------------------------------------------------------ */
/*  Known-broken content — maintained by hand as specific posts/       *
 *  domains are confirmed broken. Central list so a fix here covers    *
 *  every page instead of needing separate copies kept in sync.        */
/* ------------------------------------------------------------------ */

export const KNOWN_BROKEN_PREVIEW_DOMAINS = ["reutersconnect.com"];

// Instagram shortcodes confirmed to never embed — either Instagram has
// no "Embed" option for the post (owner disabled it), or the post is
// from a genuinely broken/malformed link. Includes the wedding-page
// discoveries plus the original hardcoded "Travis Kelce post" IDs that
// used to live directly in post_detail_body.jsx.
export const KNOWN_BROKEN_INSTAGRAM_SHORTCODES = [
  "DaYVulmEVS-",
  "DaYbbcHR0_6",
  "Daf7Ox8lUK8",
  "DaYv34_GQ0muzqwM-XRGMMHuplb5YWc5FZXHBU0",
  "DaZHhfAFsGf",
  "DaYFg-4xWy7",
  "DaYC1vDIAHk",
  "Da4KnEBPXyA",
  "DaYn_46j60r",
  "DaWFolOjFD2",
  "DadvTjnj1_F",
  "DaYNeQhDj7C",
  "DaYTZ17RPmI",
  "Daak8VyFiP7",
  "Dac-kQiDgrw",
  "DaYHHblnJBN",
  "DaYUukgRlJS",
  "DaYGExuqtf_",
  "DaalpkslSDf7ZmfMs7Adl3nSIZBgh8zZ_HoXGI0",
  // Formerly the hardcoded "isTravisPost" list in post_detail_body.jsx
  "DMgXbQ0yWqW",
  "DP5R6pwEXdY",
  "DPwLCrtjfR3",
  "npJnb4ujGj",
  "DYQh2VaiJMj",
  "DYQreT-sKHH",
  "DYQBDNnCPDz",
  "DYa-wLaCA_-",
  "DYa9NUfM9h5",
  "DYY2w5stkw5",
  "DYZC91nswcc",
  "DYYTrAxCNtV",
  "DYYSe2XJTEg",
  "DYYhHB0stn_",
  "DYVkl8vx48D",
  "DYVxBVsjRR9",
  "DYVrCfuDI2r",
  "DYWHUV9tlLU",
];

// X/Twitter accounts currently suspended. Add a handle here (lowercase,
// no @) once confirmed, and the fallback card will show a note instead
// of silently failing like any other broken link.
export const SUSPENDED_X_ACCOUNTS = ["thetsupdates", "swifferupdates"];

export const getSuspendedAccountNote = (url) => {
  const match = url.match(/(?:twitter|x)\.com\/([^/]+)\/status\//i);
  const handle = match ? match[1].toLowerCase() : null;
  if (handle && SUSPENDED_X_ACCOUNTS.includes(handle)) {
    return `@${handle} is currently suspended — this post may return if the account is reinstated.`;
  }
  return null;
};

/* ------------------------------------------------------------------ */
/*  Small fallback cards                                               */
/* ------------------------------------------------------------------ */

export const ArchiveFallbackCard = ({ url, originalUrl }) => {
  const domain = originalUrl ? getDomainFromUrl(originalUrl) : null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="microlink-card block w-full max-w-md mb-2 rounded-xl border border-gray-200 bg-[#fff8f8] p-4 shadow-sm hover:shadow-lg transition-all duration-300 hover:border-[#b66b6b] hover:-translate-y-1 group"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-[#2c2c2c] flex items-center justify-center flex-shrink-0 text-white text-[9px] font-bold tracking-tight leading-tight text-center px-1">
          ARCH
          <br />
          IVE
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-1 group-hover:text-[#8e3e3e] transition-colors">
            {domain ? `Archived article from ${domain}` : "Archived Article"}
          </h3>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-gray-500 truncate">archive.today</span>
            <span className="text-xs font-semibold text-[#8e3e3e]">Read archive →</span>
          </div>
        </div>
      </div>
    </a>
  );
};

export const GettyCard = ({ url }) => (
  <a
    href={url}
    target="_blank"
    rel="noopener noreferrer"
    className="microlink-card block w-full max-w-md mb-2 rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
  >
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded bg-black flex items-center justify-center text-white text-xs font-semibold">
        GETTY
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#8e3e3e] truncate">
          View this photo on Getty Images
        </p>
        <p className="text-xs text-gray-500 truncate">gettyimages.com</p>
      </div>
    </div>
  </a>
);

export const FacebookCard = ({ url }) => (
  <a
    href={url}
    target="_blank"
    rel="noopener noreferrer"
    className="microlink-card block w-full max-w-md mb-2 rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
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
        <p className="text-xs text-gray-500 truncate">facebook.com</p>
      </div>
    </div>
  </a>
);

export const InstagramFallbackLink = ({ url }) => (
  <a
    href={url}
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm hover:shadow-lg transition-all duration-300 hover:border-[#b66b6b] hover:-translate-y-0.5 group"
    style={{ width: "326px" }}
  >
    <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-[#f9ce67] via-[#e85a19] to-[#415dc3] flex items-center justify-center text-white shadow-sm flex-shrink-0">
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    </div>
    <div className="min-w-0">
      <p className="text-sm font-semibold text-[#3d3d6b] group-hover:text-[#b66b6b] transition-colors">
        View Instagram post
      </p>
      <p className="text-xs text-gray-500 truncate">instagram.com</p>
    </div>
  </a>
);

export const TwitterFallbackCard = ({ url }) => {
  const suspendedNote = getSuspendedAccountNote(url);
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="microlink-card block w-full max-w-md mb-2 rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-lg transition-all duration-300 hover:border-[#b66b6b] hover:-translate-y-1 group"
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
      {suspendedNote && (
        <p className="text-xs text-gray-500 italic mt-2 pt-2 border-t border-gray-100">
          {suspendedNote}
        </p>
      )}
    </a>
  );
};

/* ------------------------------------------------------------------ */
/*  Article / generic-link preview card — fetches real OG title/image  */
/*  via /api/og-preview. Handles archive.today, known-broken domains,  */
/*  and garbled/ID-only titles gracefully with a clean fallback card.  */
/* ------------------------------------------------------------------ */

export const ArticlePreviewCard = ({ url }) => {
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(true);

  const isArchive = isArchiveUrl(url);
  const originalUrl = isArchive ? getOriginalFromArchiveUrl(url) : null;
  const fetchUrl = originalUrl || url;
  const domain = getDomainFromUrl(fetchUrl);
  const isKnownBroken = KNOWN_BROKEN_PREVIEW_DOMAINS.some((d) =>
    domain.includes(d)
  );

  useEffect(() => {
    let isMounted = true;
    setPreviewData(null);
    setLoading(true);

    if (isArchive && !originalUrl) {
      setLoading(false);
      return;
    }

    if (isKnownBroken) {
      setPreviewData({ title: null, image: null, domain });
      setLoading(false);
      return;
    }

    const fetchPreview = async () => {
      try {
        const response = await fetch(
          `/api/og-preview?url=${encodeURIComponent(fetchUrl)}`
        );
        if (!response.ok) throw new Error("Failed");
        const data = await response.json();
        if (isMounted) {
          setPreviewData({
            title: data.title || getFallbackTitleFromUrl(fetchUrl, domain),
            description: data.description || "",
            image: data.image || null,
            domain: data.domain || domain,
          });
        }
      } catch {
        if (isMounted) {
          setPreviewData({
            title: getFallbackTitleFromUrl(fetchUrl, domain),
            description: "",
            image: null,
            domain,
          });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchPreview();
    return () => {
      isMounted = false;
    };
  }, [url, fetchUrl, domain, isArchive, originalUrl, isKnownBroken]);

  if (isArchive && !originalUrl && !loading) {
    return <ArchiveFallbackCard url={url} originalUrl={originalUrl} />;
  }
  if (isArchive && !originalUrl) return null;

  if (loading) {
    return (
      <div className="microlink-card block w-full max-w-md mb-2 rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm animate-pulse">
        <div className="h-40 bg-gray-200" />
        <div className="p-4">
          <div className="h-4 bg-gray-200 rounded mb-2 w-3/4" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
    );
  }

  const hasImage = !!previewData?.image;
  const hasTitle = !!previewData?.title;

  if (!hasImage && !hasTitle) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="microlink-card flex items-center gap-3 w-full max-w-md mb-2 rounded-xl border border-gray-200 bg-[#fff8f8] p-4 shadow-sm hover:shadow-lg transition-all duration-300 hover:border-[#b66b6b] hover:-translate-y-1 group"
      >
        <img
          src={getFaviconUrl(previewData.domain)}
          alt={previewData.domain}
          className="w-10 h-10 rounded-lg border border-gray-200 shadow-sm flex-shrink-0"
        />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#3d3d6b] group-hover:text-[#b66b6b] transition-colors">
            View on {previewData.domain}
          </p>
          <p className="text-xs text-gray-500 truncate">{previewData.domain}</p>
        </div>
      </a>
    );
  }

  if (!hasImage) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="microlink-card block w-full max-w-md mb-2 rounded-xl border border-gray-200 bg-[#fff8f8] p-4 shadow-sm hover:shadow-lg transition-all duration-300 hover:border-[#b66b6b] hover:-translate-y-1 group"
      >
        <div className="flex items-center gap-3">
          <img
            src={getFaviconUrl(previewData.domain)}
            alt={previewData.domain}
            className="w-10 h-10 rounded-lg border border-gray-200 shadow-sm flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-[#8e3e3e] transition-colors">
              {previewData.title}
            </h3>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-gray-500 truncate">{previewData.domain}</span>
              <span className="text-xs font-semibold text-[#8e3e3e]">Read article →</span>
            </div>
          </div>
        </div>
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="microlink-card block w-full max-w-md mb-2 rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:border-[#b66b6b] hover:-translate-y-1 group"
    >
      <div className="h-40 overflow-hidden bg-gray-100">
        <img
          src={previewData.image}
          alt={previewData.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            e.target.style.display = "none";
          }}
        />
      </div>
      <div className="p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-[#8e3e3e] transition-colors">
          {previewData.title}
        </h3>
        {previewData.description && (
          <p className="text-xs text-gray-500 mb-2 line-clamp-2 leading-relaxed">
            {previewData.description}
          </p>
        )}
        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-xs text-gray-400">{previewData.domain}</span>
          <span className="text-xs font-semibold text-[#8e3e3e]">Read article →</span>
        </div>
      </div>
    </a>
  );
};

/* ------------------------------------------------------------------ */
/*  Pinterest embed (used inline wherever an image grid needs a live   */
/*  Pinterest pin instead of a static screenshot)                      */
/* ------------------------------------------------------------------ */

export const PinterestEmbed = ({ url, width = 420, height = 300 }) => {
  const pinId = getPinterestPinId(url);
  if (!pinId) return null;
  return (
    <div
      className="rounded-xl overflow-hidden border border-gray-200"
      style={{ width, height }}
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
};

/* ------------------------------------------------------------------ */
/*  TikTok — drop the blockquote and let TikTok's own embed.js (loaded */
/*  separately via <script src>, not fetch) find and render it. Only   */
/*  attaches data-video-id for real numeric /video/ IDs — short-link   */
/*  codes aren't valid video IDs and cause a guaranteed 400 loop if     */
/*  passed as one.                                                     */
/* ------------------------------------------------------------------ */

export const TikTokEmbed = ({ url }) => {
  const cleanUrl = url.trim().split("?")[0];
  const videoIdMatch = cleanUrl.match(/\/video\/(\d+)/);
  const videoId = videoIdMatch ? videoIdMatch[1] : null;

  return (
    <blockquote
      className="tiktok-embed"
      cite={cleanUrl}
      data-video-id={videoId || undefined}
      style={{ maxWidth: "300px", minWidth: "300px" }}
    >
      <a href={cleanUrl} target="_blank" rel="noopener noreferrer">
        View on TikTok
      </a>
    </blockquote>
  );
};

/* ------------------------------------------------------------------ */
/*  YouTube — checks embeddability via oEmbed first so a video with    */
/*  embedding disabled shows a clean "Watch on YouTube" card instead   */
/*  of a broken iframe.                                                 */
/* ------------------------------------------------------------------ */

export const YouTubeEmbed = ({ videoId, url, index = 0 }) => {
  const [status, setStatus] = useState("loading"); // loading | ok | failed

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch(
          `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
        );
        setStatus(res.ok ? "ok" : "failed");
      } catch {
        setStatus("failed");
      }
    };
    check();
  }, [videoId]);

  if (status === "loading") {
    return (
      <div
        className="w-full rounded-xl bg-gray-100 animate-pulse"
        style={{ paddingBottom: "56.25%", position: "relative" }}
      />
    );
  }

  if (status === "failed") {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-4 bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md hover:border-red-400 transition-all duration-200 group"
      >
        <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 group-hover:text-[#8e3e3e] transition-colors">
            Watch on YouTube
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            Embedding disabled by video owner
          </p>
        </div>
        <span className="text-xs font-semibold text-[#8e3e3e]">Watch →</span>
      </a>
    );
  }

  return (
    <div className="w-full">
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
};

/* ------------------------------------------------------------------ */
/*  X / Twitter — checks embeddability via oEmbed first, attempts a    */
/*  real embed via window.twttr, falls back to TwitterFallbackCard     */
/*  (with suspended-account note) if it can't.                         */
/* ------------------------------------------------------------------ */

export const TwitterEmbed = ({ url }) => {
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
        const oembedUrl = `https://publish.twitter.com/oembed?omit_script=true&url=${encodeURIComponent(
          cleanUrl
        )}`;
        const response = await fetch(oembedUrl);
        if (!response.ok) {
          if (!cancelled) {
            setFailed(true);
            setChecked(true);
          }
          return false;
        }
        if (!cancelled) setChecked(true);
        return true;
      } catch {
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
          if (!cancelled) setFailed(true);
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
      } catch {
        if (!cancelled) setFailed(true);
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
          if (!cancelled) setFailed(true);
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
      <div className="microlink-card block w-full max-w-md mb-2 rounded-xl border border-gray-200 bg-white p-4 shadow-sm animate-pulse">
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
};

/* ------------------------------------------------------------------ */
/*  Instagram — lazy-loads via IntersectionObserver (only starts       */
/*  loading once near-visible, which is what stops dozens of embeds    */
/*  competing for Instagram's script at once on a long list). Retries  */
/*  process() every 300ms for ~6s (fixes the race where Instagram's    */
/*  script hasn't finished initializing yet on first page load), then  */
/*  falls back to a clean link card if it never succeeds — covers      */
/*  private accounts, deleted posts, or any other silent failure.      */
/* ------------------------------------------------------------------ */

export const InstagramEmbed = ({ url }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const elRef = useRef(null);
  const embedUrl = normalizeInstagramUrl(url);
  const shortcode = getInstagramShortcode(url);
  const isKnownBroken =
    shortcode && KNOWN_BROKEN_INSTAGRAM_SHORTCODES.includes(shortcode);

  if (isKnownBroken) {
    return <InstagramFallbackLink url={url} />;
  }

  useEffect(() => {
    if (isVisible) return;
    const el = elRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { rootMargin: "400px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;
    setTimedOut(false);

    let attempts = 0;
    const maxAttempts = 20; // 20 * 300ms ≈ 6s
    const interval = setInterval(() => {
      attempts += 1;
      const hasIframe = elRef.current?.querySelector("iframe");
      if (hasIframe) {
        clearInterval(interval);
        return;
      }
      if (window.instgrm?.Embeds) {
        window.instgrm.Embeds.process();
      }
      if (attempts >= maxAttempts) {
        clearInterval(interval);
        setTimedOut(true);
      }
    }, 300);

    return () => clearInterval(interval);
  }, [isVisible, url]);

  if (!isVisible) {
    return (
      <div
        ref={elRef}
        style={{ width: "326px", minHeight: "200px" }}
        className="rounded-lg border border-dashed border-[#c5cae9] bg-white/40"
      />
    );
  }

  if (timedOut) {
    return <InstagramFallbackLink url={url} />;
  }

  return (
    <div
      ref={elRef}
      className="instagram-container flex flex-col items-center"
      style={{ width: "326px" }}
    >
      <blockquote
        className="instagram-media"
        data-instgrm-captioned
        data-instgrm-permalink={embedUrl}
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
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  SourceLinkPreview — for a "miscellaneous links" list where the     */
/*  platform isn't otherwise pre-separated (Getty/Facebook/archive/    */
/*  generic article). Used for post_detail_body.jsx's SOURCES links.   */
/* ------------------------------------------------------------------ */

export const SourceLinkPreview = ({ url }) => {
  if (isGettyUrl(url)) return <GettyCard url={url} />;
  if (isFacebookUrl(url)) return <FacebookCard url={url} />;
  return <ArticlePreviewCard url={url} />;
};

/* ------------------------------------------------------------------ */
/*  LinkPreview — full platform dispatcher for a generic list of URLs  */
/*  that mix every platform together (used by WeddingPage's per-guest  */
/*  URLS field). Checks image/Pinterest first so direct image links    */
/*  and Reddit/Tumblr previews render as images instead of being       */
/*  scraped as generic articles.                                       */
/* ------------------------------------------------------------------ */

export const LinkPreview = ({ url }) => {
  if (isPinterestUrl(url) && getPinterestPinId(url)) {
    return <PinterestEmbed url={url} />;
  }

  if (isLikelyImage(url)) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative flex flex-col bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:border-[#b66b6b] hover:-translate-y-1"
        style={{ width: "300px", height: "220px" }}
      >
        <div className="h-full w-full overflow-hidden bg-gray-50">
          <img
            src={url}
            alt="Source content"
            className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        </div>
      </a>
    );
  }

  const platform = getPlatform(url);

  if (platform === "instagram") return <InstagramEmbed url={url} />;
  if (platform === "twitter") return <TwitterEmbed url={url} />;

  if (platform === "youtube") {
    const videoId = getYouTubeId(url);
    if (videoId) {
      return (
        <div
          className="rounded-lg overflow-hidden shadow-sm border border-[#c5cae9]"
          style={{ width: "300px", aspectRatio: "16/9" }}
        >
          <YouTubeEmbed videoId={videoId} url={url} />
        </div>
      );
    }
  }

  if (platform === "tiktok") return <TikTokEmbed url={url} />;

  return <SourceLinkPreview url={url} />;
};
