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
const [loading, setLoading] = useState(true);
const domain = getDomainFromUrl(url);
const previewCacheKey = `linkPreview:${url}`;

  useEffect(() => {
    let isMounted = true;

    const fetchPreview = async () => {
  if (!isMounted) return;

  const cached = sessionStorage.getItem(previewCacheKey);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      setPreviewData(parsed);
      setLoading(false);
      return;
    } catch {}
  }

  try {
    setLoading(true);

        // ================== STRATEGY 1: Microlink API (Primary) ==================
        // Microlink provides the most reliable previews with screenshot capability
        // Get a free API key from https://microlink.io/
        const MICROLINK_API_KEY = import.meta.env.VITE_MICROLINK_API_KEY || '';
        const microlinkUrl =
  `https://api.microlink.io/?url=${encodeURIComponent(url)}` +
  `&wait=1500` +
  `&screenshot=true` +
  `&video=false&audio=false&iframe=false` +
  `&palette=true&theme=light` +
  (MICROLINK_API_KEY ? `&api_key=${MICROLINK_API_KEY}` : "");

        const microlinkResponse = await fetch(microlinkUrl, {
          headers: {
            'Accept': 'application/json',
          },
          signal: AbortSignal.timeout(8000) // 8 second timeout
        });

        if (microlinkResponse.ok) {
          const microlinkData = await microlinkResponse.json();
          
          if (isMounted && microlinkData.data) {
            const data = microlinkData.data;
            
            // Process and clean the data
            const isLogoish = (u) => {
  const s = String(u || "").toLowerCase();
  return (
    s.includes("logo") ||
    s.includes("icon") ||
    s.includes("favicon") ||
    s.includes("apple-touch-icon")
  );
};

let imageUrl = data.image?.url || data.screenshot?.url || data.logo?.url;

// If the chosen image looks like a logo, try screenshot instead
if (isLogoish(imageUrl) && data.screenshot?.url) {
  imageUrl = data.screenshot.url;
}
            
            // Ensure image URL is absolute
            if (imageUrl && imageUrl.startsWith('//')) {
              imageUrl = 'https:' + imageUrl;
            } else if (imageUrl && imageUrl.startsWith('/')) {
              imageUrl = `https://${domain}${imageUrl}`;
            }

            setPreviewData({
              title: data.title || 
                     domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1) + ' Article',
              description: data.description ? 
                          (data.description.length > 150 ? data.description.substring(0, 147) + '...' : data.description) : '',
              image: imageUrl || getFaviconUrl(domain),
              domain: data.publisher || domain,
              url: data.url || url,
              author: data.author || '',
              date: data.date || ''
            });
            return;
          }
        }
        
        // ================== STRATEGY 2: LinkPreview API (Fallback) ==================
        // Alternative free API that works well
        const linkPreviewUrl = `https://api.linkpreview.net/?key=${import.meta.env.VITE_LINKPREVIEW_API_KEY || '5b576'}&q=${encodeURIComponent(url)}`;
        
        const linkPreviewResponse = await fetch(linkPreviewUrl, {
          signal: AbortSignal.timeout(5000)
        });

        if (linkPreviewResponse.ok) {
          const linkPreviewData = await linkPreviewResponse.json();
          
          if (isMounted && linkPreviewData) {
            setPreviewData({
              title: linkPreviewData.title || 
                     domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1) + ' Article',
              description: linkPreviewData.description ? 
                          (linkPreviewData.description.length > 150 ? linkPreviewData.description.substring(0, 147) + '...' : linkPreviewData.description) : '',
              image: linkPreviewData.image || getFaviconUrl(domain),
              domain: linkPreviewData.url ? getDomainFromUrl(linkPreviewData.url) : domain,
              url: linkPreviewData.url || url
            });
            return;
          }
        }

        // ================== STRATEGY 3: Direct Open Graph Fetch with CORS Proxy ==================
        // For sites that don't work with APIs
        const corsProxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
        
        try {
          const response = await fetch(corsProxyUrl, {
            signal: AbortSignal.timeout(6000)
          });
          
          if (response.ok) {
            const html = await response.text();
            
            // Parse Open Graph and meta tags
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            const ogTitle = doc.querySelector('meta[property="og:title"]')?.content;
            const ogDescription = doc.querySelector('meta[property="og:description"]')?.content;
            const ogImage = doc.querySelector('meta[property="og:image"]')?.content;
            const ogSiteName = doc.querySelector('meta[property="og:site_name"]')?.content;
            
            const metaTitle = doc.querySelector('title')?.textContent;
            const metaDescription = doc.querySelector('meta[name="description"]')?.content;
            const metaImage = doc.querySelector('link[rel="image_src"]')?.href;
            
            // Process image URL to ensure it's absolute
            let finalImage = ogImage || metaImage;
            if (finalImage) {
              if (finalImage.startsWith('//')) {
                finalImage = 'https:' + finalImage;
              } else if (finalImage.startsWith('/')) {
                finalImage = `https://${domain}${finalImage}`;
              }
            }
            
            // Build final title
            let finalTitle = ogTitle || metaTitle;
            if (!finalTitle || finalTitle.trim() === '') {
              finalTitle = domain.split('.')[0].charAt(0).toUpperCase() + 
                          domain.split('.')[0].slice(1) + ' Article';
            }
            
            // Build final description
            let finalDescription = ogDescription || metaDescription || '';
            if (finalDescription.length > 150) {
              finalDescription = finalDescription.substring(0, 147) + '...';
            }
            
            if (isMounted) {
              setPreviewData({
                title: finalTitle,
                description: finalDescription,
                image: finalImage || getFaviconUrl(domain),
                domain: ogSiteName || domain,
                url: url
              });
              return;
            }
          }
        } catch (proxyError) {
          console.log('CORS proxy failed for:', domain, proxyError);
        }

        // ================== STRATEGY 4: Final generic fallback ==================
if (isMounted) {
  setPreviewData({
    title:
      domain.split(".")[0].charAt(0).toUpperCase() +
      domain.split(".")[0].slice(1) +
      " Article",
    description: "",
    image: getFaviconUrl(domain),
    domain: domain,
    url: url
  });
  return;
}

        // ================== STRATEGY 5: Ultimate Fallback ==================
        if (isMounted) {
          setPreviewData({
            title: domain.split('.')[0].charAt(0).toUpperCase() + 
                  domain.split('.')[0].slice(1) + ' Article',
            description: '',
            image: getFaviconUrl(domain),
            domain: domain,
            url: url
          });
        }

      } catch (error) {
        console.log('Link preview error for', url, error);
        
        if (isMounted) {
          setPreviewData({
            title: domain.split('.')[0].charAt(0).toUpperCase() + 
                  domain.split('.')[0].slice(1) + ' Article',
            description: '',
            image: getFaviconUrl(domain),
            domain: domain,
            url: url
          });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchPreview();

    return () => {
      isMounted = false;
    };
  }, [url, domain]);

  if (loading) {
    return (
      <div className="microlink-card block max-w-md mx-auto mb-4 rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm animate-pulse">
        <div className="h-40 bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse"></div>
        <div className="p-4">
          <div className="h-4 bg-gray-200 rounded mb-2 w-3/4 animate-pulse"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
          <div className="flex items-center mt-3">
            <div className="w-6 h-6 bg-gray-200 rounded-full mr-2 animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-1/3 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <a
      href={previewData.url}
      target="_blank"
      rel="noopener noreferrer"
      className="microlink-card block max-w-md mx-auto mb-4 rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:border-red-400 hover:-translate-y-1 group"
    >
      {/* Thumbnail image with gradient overlay */}
      <div className="h-48 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-60 z-10"></div>
        <img
          src={previewData.image}
          alt={previewData.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
          onError={(e) => {
            // If image fails to load, replace with favicon in a nice container
            e.target.style.display = 'none';
            const parent = e.target.parentElement;
            
            // Create a nice fallback container
            const fallback = document.createElement('div');
            fallback.className = 'w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#8e3e3e]/10 to-red-100';
            
            const favicon = document.createElement('img');
            favicon.src = getFaviconUrl(domain);
            favicon.className = 'w-12 h-12 mb-3 opacity-70';
            favicon.alt = 'Website favicon';
            
            const domainText = document.createElement('span');
            domainText.className = 'text-sm text-gray-500 font-medium';
            domainText.textContent = domain.replace('www.', '');
            
            fallback.appendChild(favicon);
            fallback.appendChild(domainText);
            parent.appendChild(fallback);
          }}
        />
        
        {/* Hover gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#8e3e3e]/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20"></div>
      </div>
      
      {/* Content area */}
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Favicon badge */}
          <div className="flex-shrink-0">
            <div className="relative">
              <img
                src={getFaviconUrl(domain)}
                alt={domain}
                className="w-8 h-8 rounded-lg border border-gray-200 shadow-sm"
              />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
            </div>
          </div>
          
          {/* Text content */}
          <div className="flex-1 min-w-0">
            {/* Title with gradient text on hover */}
            <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-[#8e3e3e] group-hover:to-red-500 transition-all duration-300">
              {previewData.title}
            </h3>
            
            {/* Description */}
            {previewData.description && (
              <p className="text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed">
                {previewData.description}
              </p>
            )}
            
            {/* Metadata row */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500 truncate">
                  {previewData.domain}
                </span>
                {previewData.author && (
                  <>
                    <span className="text-gray-300">•</span>
                    <span className="text-xs text-gray-400 truncate">
                      {previewData.author}
                    </span>
                  </>
                )}
              </div>
              
              {/* CTA button */}
              <span className="flex items-center gap-1 text-xs font-semibold text-[#8e3e3e] group-hover:text-red-600 transition-colors">
                Read article
                <svg className="w-3 h-3 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </span>
            </div>
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
  <div className="flex flex-wrap justify-start gap-6 mt-2 max-w-[1400px] mx-auto">
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
  <div className="flex flex-wrap justify-start gap-6 mt-2 max-w-[1400px] mx-auto">
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
