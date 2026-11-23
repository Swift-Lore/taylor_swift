import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SITE_URL = "https://www.swift-lore.com";
const DEFAULT_IMAGE = `${SITE_URL}/images/swift_lore.png`;
const HOME_TITLE = "Swift Lore: Taylor Swift's Complete Career Timeline";
const HOME_DESCRIPTION = "Explore Taylor Swift's career through thousands of dated events, notes, sources, and connections across all eras.";

const PAGES = {
  "/": [HOME_TITLE, HOME_DESCRIPTION],
  "/posts": ["Full Taylor Swift Timeline Archive | Swift Lore", "Browse Taylor Swift's career timeline. Search events and filter by dates, keywords, albums, tours, and appearances."],
  "/eras-tour-shows": ["Taylor Swift Eras Tour Shows and Outfits | Swift Lore", "Explore Taylor Swift's Eras Tour shows, dates, venues, surprise songs, and outfits."],
  "/wedding": ["Taylor Swift and Travis Kelce Wedding Archive | Swift Lore", "Explore Swift Lore's Taylor Swift and Travis Kelce wedding archive, including guest information, notes, and sources."],
  "/about": ["About Swift Lore | Taylor Swift Career Archive", "Learn about Swift Lore, an independent fan-created Taylor Swift career archive, and find contact information."],
  "/privacy_policy": ["Privacy Policy | Swift Lore", "Read Swift Lore's privacy policy and information about how the site handles visitor data."],
  "/cookie-policy": ["Cookie Policy | Swift Lore", "Read about cookies used by Swift Lore, including analytics, advertising, and visitor choices."],
};

function updateMeta(attribute, key, value) {
  const matches = [...document.head.querySelectorAll(`meta[${attribute}="${key}"]`)];
  const tag = matches.shift() || document.createElement("meta");
  tag.setAttribute(attribute, key);
  tag.setAttribute("content", value);
  if (!tag.parentNode) document.head.appendChild(tag);
  matches.forEach((duplicate) => duplicate.remove());
}

export function applyPageMetadata({ title, description, canonical, image = DEFAULT_IMAGE, type = "website" }) {
  document.title = title;
  updateMeta("name", "description", description);
  const links = [...document.head.querySelectorAll('link[rel="canonical"]')];
  const canonicalTag = links.shift() || document.createElement("link");
  canonicalTag.setAttribute("rel", "canonical");
  canonicalTag.setAttribute("href", canonical);
  if (!canonicalTag.parentNode) document.head.appendChild(canonicalTag);
  links.forEach((duplicate) => duplicate.remove());

  for (const [key, value] of Object.entries({
    "og:site_name": "Swift Lore", "og:title": title,
    "og:description": description, "og:url": canonical,
    "og:image": image, "og:type": type,
  })) updateMeta("property", key, value);

  for (const [key, value] of Object.entries({
    "twitter:card": "summary_large_image", "twitter:title": title,
    "twitter:description": description, "twitter:image": image,
  })) updateMeta("name", key, value);
}

export function getRouteMetadata(pathname, search) {
  let path = pathname.replace(/\/+$/, "") || "/";
  if (path === "/timeline") path = "/";
  if (path === "/cookie_policy") path = "/cookie-policy";
  const params = new URLSearchParams(search);

  if (path === "/post_details") {
    const id = params.get("id");
    return {
      title: "Taylor Swift Event | Swift Lore",
      description: "Explore this Taylor Swift event with dated notes and source links in the Swift Lore career archive.",
      canonical: `${SITE_URL}/post_details${id && /^rec[a-zA-Z0-9]{14}$/.test(id) ? `?id=${id}` : ""}`,
      type: "article",
    };
  }

  const [title, description] = PAGES[path] || ["Swift Lore | Taylor Swift Career Archive", HOME_DESCRIPTION];
  return { title, description, canonical: SITE_URL + path };
}

export function setEventMetadata(event, id) {
  const title = String(event.EVENT || "Taylor Swift Event").trim();
  const notes = typeof event.NOTES === "string" ? event.NOTES : "";
  const parsedDate = event.DATE ? new Date(event.DATE) : null;
  const date = parsedDate && !Number.isNaN(parsedDate.getTime())
    ? parsedDate.toLocaleDateString("en-US", {
      month: "long", day: "numeric", year: "numeric", timeZone: "UTC",
    }) : "";
  const summary = [title, date, notes.replace(/\s+/g, " ").trim()].filter(Boolean).join(" · ");
  const description = summary.length > 160 ? `${summary.slice(0, 157).trimEnd()}...` : summary;
  let image = DEFAULT_IMAGE;
  try {
    const candidate = new URL(event.IMAGE?.[0]?.url);
    if (["https:", "http:"].includes(candidate.protocol)) image = candidate.href;
  } catch { /* Use the site's default image when no valid image is available. */ }

  applyPageMetadata({
    title: `${title}${date ? ` — ${date}` : ""} | Swift Lore`,
    description,
    canonical: `${SITE_URL}/post_details?id=${encodeURIComponent(id)}`,
    image,
    type: "article",
  });
}

export function usePageMetadata() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    applyPageMetadata(getRouteMetadata(pathname, search));
  }, [pathname, search]);
}
