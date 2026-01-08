"use client";

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Microlink from "@microlink/react";
import "./post_detail_body.css";
import AdSlot from "./adslot";

// YouTube video ID extractor
const getYouTubeVideoId = (url) => {
  if (!url) return null;
  if (url.includes("shorts/")) {
    return url.split("shorts/")[1];
  } else if (url.includes("v=")) {
    return url.split("v=")[1].split("&")[0];
  }
  return null;
};

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

function LinkPreview({ url }) {
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const domain = getDomainFromUrl(url);

  useEffect(() => {
    const fetchPreview = async () => {
      setLoading(true);
      try {
        // Use a simple fetch
        const response = await fetch(url, {
          method: 'GET',
          mode: 'no-cors', // Use no-cors mode to avoid CORS issues
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
          }
        });
        
        setPreviewData({
          title: domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1),
          domain: domain,
          favicon: getFaviconUrl(domain)
        });
      } catch (err) {
        console.log('Using fallback for:', url);
        setError(true);
        setPreviewData({
          title: domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1),
          domain: domain,
          favicon: getFaviconUrl(domain)
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPreview();
  }, [url, domain]);

  if (loading) {
    return (
      <div className="microlink-card block max-w-md mx-auto mb-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-200"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  const displayTitle = previewData?.title || domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
  const displayDomain = previewData?.domain || domain;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="microlink-card block max-w-md mx-auto mb-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-all duration-200 hover:border-red-300 hover:-translate-y-0.5"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <img
            src={previewData?.favicon || getFaviconUrl(domain)}
            alt={`${displayTitle} favicon`}
            className="w-10 h-10 rounded-lg border border-gray-100"
            onError={(e) => {
              e.target.src = `https://www.google.com/s2/favicons?domain=google.com&sz=128`;
            }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-[#8e3e3e] mb-1 truncate">
            {displayTitle}
          </h3>
          <p className="text-xs text-gray-500 truncate">
            {displayDomain}
          </p>
          <div className="mt-2 flex items-center">
            <span className="text-xs text-red-400 font-medium">Read article →</span>
            <span className="ml-auto text-xs text-gray-400">
              {(() => {
                try {
                  const urlObj = new URL(url);
                  return urlObj.pathname.split('/').slice(-1)[0]
                    .replace(/[-_]/g, ' ')
                    .replace(/\.[^/.]+$/, '')
                    .substring(0, 20) + '...';
                } catch {
                  return 'View article';
                }
              })()}
            </span>
          </div>
        </div>
      </div>
    </a>
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
  const [microlinkErrors, setMicrolinkErrors] = useState({});

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
    const imageLinks = rawUrls.filter((url) => isLikelyImage(url));
    const otherLinks = rawUrls.filter((url) => !isLikelyImage(url));

    setSourceImages(imageLinks);
    setNonImageLinks(otherLinks);
  }, [event]);
useEffect(() => {
    setMicrolinkErrors({});
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

  // Social media embeds script loading (Instagram, Twitter, Getty)
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
    if (event.TWITTER) loadTwitterScript();
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
            <div className="text-sm md:text-base text-[#111827] leading-relaxed mb-6">
              <span className="font-semibold">Notes: </span>
              {formatNotes(event.NOTES)}
            </div>
          )}

          {hasSources && (
            <div className="space-y-6">
              {sourceImages.length > 0 && (
                <div className="image-only-grid flex flex-wrap gap-6 justify-start">
                  {sourceImages.map((url, index) => (
                    <a
                      key={`img-${index}`}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative flex items-center justify-center bg-gray-100 rounded-lg overflow-hidden border border-gray-200 hover:shadow-md transition-all"
                      style={{ width: "500px", height: "400px" }}
                    >
                      <img
                        src={url}
                        alt="Source"
                        className="max-w-full max-h-full object-contain cursor-pointer"
                        loading="lazy"
                      />
                      <span className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs p-1 opacity-0 group-hover:opacity-100 transition-opacity truncate text-center">
                        {(() => {
                          try {
                            return new URL(url).hostname.replace("www.", "");
                          } catch {
                            return "Source";
                          }
                        })()}
                      </span>
                    </a>
                  ))}
                </div>
              )}

              {nonImageLinks.length > 0 && (
                <div className="microlink-grid">
                  {nonImageLinks.map((url, index) => {
                    const isGetty = isGettyUrl(url);

                    if (isGetty) {
                      // Clean, branded Getty card instead of Microlink
                      return (
                        <a
                          key={`link-${index}`}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="microlink-card block max-w-md mx-auto mb-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
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
  <div className="flex flex-wrap justify-start gap-6 mt-2 max-w-4xl mx-auto">
            {event.INSTAGRAM.split(" || ").map((rawUrl, index) => {
              const url = normalizeInstagramUrl(rawUrl);
              return url ? (
                <div
                  key={index}
                  className="instagram-container flex-shrink-0"
                  style={{ width: "320px" }}
                >
                  <blockquote
                    className="instagram-media"
                    data-instgrm-permalink={url}
                    data-instgrm-version="14"
                    style={{
                      background: "#FFF",
                      borderRadius: "8px",
                      border: "1px solid #dbdbdb",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                      margin: "0",
                      width: "320px",
                      minWidth: "320px",
                      padding: "0",
                    }}
                  ></blockquote>
                </div>
              ) : null;
            })}
          </div>
        </section>
      )}

      {/* Twitter / X */}
      {event.TWITTER && (
        <section className="w-full px-4 mb-10">
  <div className="flex flex-wrap justify-start gap-6 mt-2 max-w-4xl mx-auto">
            {event.TWITTER.split(" || ").map((url, index) => {
              const cleanUrl = url.trim().replace("x.com", "twitter.com");
              const isValid =
                /^https:\/\/twitter\.com\/[^/]+\/status\/\d+/.test(cleanUrl);
              return isValid ? (
                <div
                  key={index}
                  className="twitter-container flex-shrink-0"
                  style={{ width: "320px" }}
                >
                  <blockquote className="twitter-tweet" data-lang="en">
                    <a href={cleanUrl}>{cleanUrl}</a>
                  </blockquote>
                </div>
              ) : null;
            })}
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
