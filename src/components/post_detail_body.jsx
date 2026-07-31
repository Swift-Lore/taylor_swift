"use client";

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import "./post_detail_body.css";
import AdSlot from "./adslot";
import {
  isLikelyImage,
  isPinterestUrl,
  getPinterestPinId,
  getDomainFromUrl,
  getFaviconUrl,
  getYouTubeId,
  normalizeInstagramUrl,
  SourceLinkPreview,
  PinterestEmbed,
  InstagramEmbed,
  TwitterEmbed,
  YouTubeEmbed,
  TikTokEmbed,
} from "./LinkEmbeds";

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

  // Instagram/X script loading — Instagram/X embeds now use the shared
  // InstagramEmbed/TwitterEmbed components (lazy-loaded, self-healing),
  // but the underlying platform scripts still need to be present on
  // the page for those components to find and use.
  useEffect(() => {
    if (!event) return;

    if (event.INSTAGRAM && !document.getElementById("instagram-embed-script")) {
      const script = document.createElement("script");
      script.id = "instagram-embed-script";
      script.src = "//www.instagram.com/embed.js";
      script.async = true;
      document.body.appendChild(script);
    }

    if (event.TWITTER && !document.getElementById("twitter-embed-script")) {
      const script = document.createElement("script");
      script.id = "twitter-embed-script";
      script.src = "https://platform.twitter.com/widgets.js";
      script.async = true;
      document.body.appendChild(script);
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
 
  // TikTok embed script loading — needed globally since the shared
  // TikTokEmbed component drops blockquotes but doesn't load the
  // script itself (same reasoning as the Wedding page: TikTok's
  // script only processes blockquotes present when it executes, so
  // it has to be reloaded whenever new ones appear).
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
        <section className="max-w-6xl mx-auto px-4 mb-10">
          {hasNotes && (
            <div className="text-sm md:text-base text-[#111827] leading-relaxed mb-6 bg-white/70 rounded-xl p-4 border border-[#e3d5dd]">
              <span className="font-semibold">Notes: </span>
              {formatNotes(event.NOTES)}
            </div>
          )}

          {hasSources && (
            <div className="space-y-6">
              {sourceImages.length > 0 && (
                <div className="image-only-grid flex flex-wrap gap-6 justify-center mb-8">
                  {sourceImages.map((url, index) => {
                    const isPinterest = isPinterestUrl(url);
                    const pinId = getPinterestPinId(url);
                    const domain = getDomainFromUrl(url);

                    if (isPinterest && pinId) {
                      return (
                        <PinterestEmbed
                          key={`img-${index}`}
                          url={url}
                          width={420}
                          height={300}
                        />
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
                <div className="microlink-grid" style={{ justifyContent: "center" }}>
                  {nonImageLinks.map((url, index) => (
                    <SourceLinkPreview key={`link-${index}`} url={url} />
                  ))}
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
        const videoId = getYouTubeId(url);
        if (!videoId) return null;

        return (
          <YouTubeEmbed key={index} videoId={videoId} url={url} index={index} />
        );
      })}
    </div>
  </section>
)}


      {/* Instagram */}
      {event.INSTAGRAM && (
        <section className="w-full px-4 mb-10">
          <div className="flex flex-wrap gap-6 mt-2 max-w-6xl mx-auto items-start justify-start">
            {instagramUrls.map((url, index) => (
              <InstagramEmbed key={index} url={url} />
            ))}
          </div>
        </section>
      )}

                  {/* Twitter / X */}
      {event.TWITTER && (
  <section className="w-full px-4 mb-10">
    <div className="flex flex-wrap gap-6 mt-2 max-w-6xl mx-auto items-start justify-start">
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
              return (
                <div key={index} className="tiktok-wrapper">
                  <TikTokEmbed url={cleanUrl} />
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
