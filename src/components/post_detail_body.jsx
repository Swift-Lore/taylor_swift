// post_detail_body.jsx

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import AdComponent from "./ad_component";
import Microlink from "@microlink/react";
import "./post_detail_body.css";

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

// Format DATE field as "Nov-07-2025" (force UTC so it doesn’t shift by timezone)
const formatEventDate = (isoDate) => {
  if (!isoDate) return "";
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return "";

  // Force UTC interpretation
  const month = d.toLocaleString("en-US", {
    month: "short",
    timeZone: "UTC",
  }); // "Nov"
  const day = String(d.getUTCDate()).padStart(2, "0"); // "07"
  const year = d.getUTCFullYear();                     // 2025

  return `${month}-${day}-${year}`;
};

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
    const imageLinks = rawUrls.filter((url) => isLikelyImage(url));
    const otherLinks = rawUrls.filter((url) => !isLikelyImage(url));

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
    navigate("/timeline");
  };

  const formatNotes = (notes) => {
    if (!notes) return null;
    return notes.split("\n\n").map((paragraph, index) => (
      <p key={index} className="mb-2">
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
  }, [isModalOpen, selectedImageIndex, event?.IMAGE]);

  // Social media embeds script loading
  useEffect(() => {
    if (!event) return;

    const loadInstagramScript = () => {
      if (!document.getElementById("instagram-embed-script")) {
        const script = document.createElement("script");
        script.id = "instagram-embed-script";
        script.src = "//www.instagram.com/embed.js";
        script.async = true;
        document.body.appendChild(script);
      } else if (window.instgrm) {
        window.instgrm.Embeds.process();
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

    if (event.INSTAGRAM) loadInstagramScript();
    if (event.TWITTER) loadTwitterScript();

    if (event["GETTY EMBED"] && !document.getElementById("getty-embed-script")) {
      const script = document.createElement("script");
      script.id = "getty-embed-script";
      script.src = "//www.gettyimages.com/showcase/embed.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, [event]);

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

  return (
  <div className="bg-[#e6edf7] py-8 md:py-12">
    {/* Ad Placement */}
    {/* Sponsored ad block above Notes */}
    <div className="w-full max-w-4xl mx-auto px-4 mb-6 mt-8">
      <div className="relative rounded-2xl border border-[#f8dada] bg-gradient-to-b from-[#fff8f8] to-[#fdeeee] shadow-sm px-4 py-6 min-h-[110px] flex items-center justify-center">
        <span className="absolute top-2 left-4 text-[10px] uppercase tracking-[0.12em] text-[#9ca3af]">
          Sponsored
        </span>

        {process.env.NODE_ENV === "production" ? (
          <AdComponent />
        ) : (
          <div className="text-[#9ca3af] text-sm italic">
            Advertisement space — supporting Swift Lore 💫
          </div>
        )}
      </div>
    </div>

    {/* Compact repeat of title + date for clean screenshots */}
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
    </section>

      {/* NOTES + SOURCES */}
      {(hasNotes || hasSources) && (
        <section className="max-w-4xl mx-auto px-4 mb-10">
          {/* Notes inline, like your old layout */}
          {hasNotes && (
            <div className="text-sm md:text-base text-[#111827] leading-relaxed mb-6">
              <span className="font-semibold">Notes: </span>
              {formatNotes(event.NOTES)}
            </div>
          )}

          {/* Sources, but without big labels/frames */}
          {hasSources && (
            <div className="space-y-6">
              {/* Direct image links */}
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

              {/* Non-image links (Microlink) */}
              {nonImageLinks.length > 0 && (
                <div className="microlink-grid">
                  {nonImageLinks.map((url, index) => (
                    <div key={`link-${index}`} className="microlink-card">
                      <div id={`microlink-wrapper-${index}`}>
                        <Microlink
                          url={url}
                          size="large"
                          media="image"
                          onError={() => {
                            const fallback = document.getElementById(
                              `fallback-${index}`
                            );
                            if (fallback) fallback.style.display = "flex";
                          }}
                          fallback={{
                            image: `https://logo.clearbit.com/${
                              new URL(url).hostname
                            }`,
                            title: url
                              .split("/")
                              .slice(-1)[0]
                              .replace(/[-_]/g, " "),
                            description: new URL(url)
                              .hostname.replace("www.", ""),
                          }}
                        />
                      </div>

                      {/* Fallback card */}
                      <div
                        id={`fallback-${index}`}
                        style={{ display: "none" }}
                        className="fallback-card flex items-center p-3 border border-gray-200 rounded-lg bg-white"
                      >
                        <img
                          src={`https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(
                            url
                          )}`}
                          alt=""
                          className="w-8 h-8 mr-3"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-red-400 truncate">
                            {url
                              .split("/")
                              .slice(-1)[0]
                              .replace(/[-_]/g, " ")}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {new URL(url).hostname.replace("www.", "")}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
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
            className="getty-embed w-full max-w-4xl"
            dangerouslySetInnerHTML={{ __html: event["GETTY EMBED"] }}
          />
        </section>
      )}

      {/* YouTube */}
      {hasVideos && (
        <section className="max-w-4xl mx-auto px-4 mb-10">
          <div className="flex flex-col items-center gap-6 mt-2">
            {event.YOUTUBE?.split(",").map((url, index) => {
              const videoId = getYouTubeVideoId(url.trim());
              return videoId ? (
                <div key={index} className="w-full max-w-4xl">
                  <iframe
                    src={`https://www.youtube.com/embed/${videoId}`}
                    title={`YouTube Video ${index + 1}`}
                    className="w-full aspect-video rounded-xl"
                    frameBorder="0"
                    allowFullScreen
                  ></iframe>
                </div>
              ) : null;
            })}
          </div>
        </section>
      )}

      {/* Instagram */}
      {event.INSTAGRAM && (
        <section className="max-w-4xl mx-auto px-4 mb-10">
          <div className="flex flex-wrap justify-center gap-4 mt-2">
            {event.INSTAGRAM.split(" || ").map((rawUrl, index) => {
              const url = rawUrl.trim().split("?")[0];
              return url ? (
                <div key={index} className="instagram-container max-w-sm">
                  <blockquote
                    className="instagram-media"
                    data-instgrm-permalink={url}
                    data-instgrm-version="14"
                    style={{
                      background: "#FFF",
                      borderRadius: "3px",
                      border: "1px solid #dbdbdb",
                      boxShadow: "none",
                      margin: "0",
                      minWidth: "326px",
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
        <section className="max-w-4xl mx-auto px-4 mb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2 w-full">
            {event.TWITTER.split(/ \|\| |\s+/).map((url, index) => {
              const cleanUrl = url.trim().replace("x.com", "twitter.com");
              const isValid = /^https:\/\/twitter\.com\/[^/]+\/status\/\d+/.test(
                cleanUrl
              );
              return isValid ? (
                <div key={index} className="twitter-container w-full">
                  <blockquote className="twitter-tweet" data-lang="en">
                    <a href={cleanUrl}>{cleanUrl}</a>
                  </blockquote>
                </div>
              ) : null;
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
