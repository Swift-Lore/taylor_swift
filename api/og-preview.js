export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'No URL' });
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=604800, stale-while-revalidate=86400');
  const domain = new URL(url).hostname.replace('www.', '');

  const titleFromSlug = () => {
  const slug = new URL(url).pathname.split('/').filter(Boolean).pop() || '';
  const withoutExt = slug.replace(/\.\w+$/, '');

  // Split into tokens, then trim any trailing purely-numeric token (an
  // internal tracking ID) AND, if the token right before it is the bare
  // word "source" (People.com's convention: "...headline-source-1234567"),
  // drop that too — it's the same tracking-suffix artifact, not real
  // content. This only touches slug-derived text, never a real scraped
  // og:title, so it can't accidentally cut a genuine headline that
  // legitimately ends in the word "Source" as tabloid attribution.
  // A trailing token counts as an internal tracking ID if it's either
  // purely numeric ("7557276") OR a short letter-prefix + digits, a
  // common CMS pattern ("w212293", "a123456") — not just pure numbers.
  const isTrailingIdToken = (t) => /^\d+$/.test(t) || /^[a-z]{1,3}\d{3,}$/i.test(t);

  const tokens = withoutExt.split(/[-_]+/).filter(Boolean);
  while (tokens.length > 0 && isTrailingIdToken(tokens[tokens.length - 1])) {
    tokens.pop();
    if (tokens.length > 0 && tokens[tokens.length - 1].toLowerCase() === 'source') {
      tokens.pop();
    }
  }

  const cleaned = tokens
    .join(' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim();

  // If the slug had no dashes/underscores to split into real words,
  // and it's long, it's almost certainly a base64/encoded ID — not a title.
  const looksLikeGarbageId = !slug.includes('-') && !slug.includes('_') && slug.length > 20;

  if (looksLikeGarbageId || cleaned.length < 3) {
    const prettyDomain = domain
      .split('.')[0]
      .replace(/\b\w/g, c => c.toUpperCase());
    return `View on ${prettyDomain}`;
  }

  return cleaned;
};

  // Titles that mean the scraper got a bot-challenge/interstitial page
  // instead of the real article (Cloudflare "Verifying Device", etc.) —
  // treat these exactly like an empty title so the code below falls
  // through to the Microlink fallback instead of showing this junk.
  const isBotChallengeTitle = (title) => {
    if (!title) return false;
    const lower = title.toLowerCase().trim();
    return [
      'verifying device',
      'verifying you are human',
      'just a moment',
      'attention required',
      'access denied',
      'are you a human',
      'one more step',
      'please wait',
      'checking your browser',
      'akamai',
    ].some((phrase) => lower === phrase || lower.startsWith(phrase) || lower.includes(phrase));
  };

  // Microlink's own internal fallback, when IT also can't get a real
  // title, is to just return the raw URL path unprocessed (e.g.
  // "taylor-swift-pictured-wedding-travis-kelce-tour.html"). That's not
  // a real headline — treat it the same as a missing title so our own
  // clean slug-based title gets used instead.
  const looksLikeRawSlugTitle = (title) => {
    if (!title) return false;
    const hyphenCount = (title.match(/-/g) || []).length;
    return hyphenCount >= 3 && (/\.\w{2,4}$/.test(title.trim()) || !/\s/.test(title));
  };

  // A bot-block page's og:image is often hosted on the protection
  // vendor's own branded domain (e.g. akamai.com), not the site's real
  // image CDN — a simple, reasonably safe way to catch it.
  const looksLikeBotBlockImage = (imageUrl) => {
    if (!imageUrl) return false;
    return /akamai|cloudflare/i.test(imageUrl);
  };

  // A handful of sites' own og:title tags include a trailing internal
  // tracking/source ID (e.g. "...Headline Source 7557276"). This is
  // unambiguous junk — no real headline ends in "Source" followed by a
  // raw ID number — so it's safe to strip. A BARE trailing "Source"
  // with no digits is intentionally NOT touched here: that's a common,
  // legitimate tabloid headline ending ("...Despite Report: Source",
  // meaning "according to a source") and stripping it risked cutting
  // real headlines. The People.com case that looked like a bare
  // "Source" with no digits was actually our own slug-fallback (fixed
  // in titleFromSlug above), not a real scraped title missing its ID.
  const cleanTrailingIdJunk = (title) => {
    if (!title) return title;
    return title
      // Handles "...Title Source 7557276", "...Title Source: 7557276",
      // "...Title (Source 7557276)", "...Title - Source: 7557276", etc.
      .replace(/\s*[-–—(]?\s*Source:?\s*\d{4,}\)?\s*$/i, '')
      .trim();
  };

  // Sites that block scrapers — try Microlink first, fall back to slug
const blockedDomains = ['justjared.com', 'justjaredjr.com', 'people.com', 'thesun.co.uk', 'the-sun.com', 'nytimes.com', 'wsj.com', 'ft.com', 'washingtonpost.com', 'theatlantic.com', 'reutersconnect.com', 'tmz.com', 'dailymail.com', 'today.com', 'thenews.com.pk', 'apple.news', 'usmagazine.com', 'eonline.com', 'pagesix.com', 'etonline.com', 'entertainmenttonight.com'];
  // If URL is a direct image file, return it directly as the preview
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const pathname = new URL(url).pathname.toLowerCase();
  if (imageExtensions.some(ext => pathname.endsWith(ext))) {
    return res.status(200).json({
      title: titleFromSlug(),
      description: '',
      image: url,
      domain,
    });
  }
  // Tumblr — try oEmbed for better thumbnails
  if (domain.includes('tumblr.com')) {
    try {
      const oembedRes = await fetch(
        `https://www.tumblr.com/oembed/1.0?url=${encodeURIComponent(url)}`,
        { signal: AbortSignal.timeout(5000) }
      );
      const oembedData = await oembedRes.json();
      if (oembedData?.thumbnail_url) {
        return res.status(200).json({
          title: oembedData.title || 'Tumblr Post',
          description: '',
          image: oembedData.thumbnail_url,
          domain: 'tumblr.com',
        });
      }
    } catch (e) {}
  }
  const blockedMatch = blockedDomains.find(d => domain.includes(d));

  if (blockedMatch) {
    try {
      const mlRes = await fetch(
        `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=false&video=false`,
        { signal: AbortSignal.timeout(5000) }
      );
      const mlData = await mlRes.json();
      const mlTitle = mlData?.data?.title;
      const mlImage = mlData?.data?.image?.url;
      const titleIsUsable = mlTitle && !isBotChallengeTitle(mlTitle) && !looksLikeRawSlugTitle(mlTitle);
      const imageIsUsable = mlImage && !looksLikeBotBlockImage(mlImage);
      if (imageIsUsable) {
        return res.status(200).json({
          title: cleanTrailingIdJunk(titleIsUsable ? mlTitle : null) || titleFromSlug(),
          description: mlData.data.description || '',
          image: mlImage,
          domain: blockedMatch,
        });
      }
    } catch (e) {}

    return res.status(200).json({
      title: titleFromSlug(),
      description: '',
      image: null,
      domain: blockedMatch,
    });
  }

  // All other sites — scrape OG tags directly
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      signal: AbortSignal.timeout(5000),
    });
    const html = await response.text();
    const getMeta = (property) => {
      const match =
        html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i')) ||
        html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`, 'i'));
      return match?.[1]?.trim() || '';
    };
    const decodeEntities = (str) => str
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(code))
      .replace(/&apos;/g, "'")

    let title = decodeEntities(getMeta('og:title') || html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() || '');
    const description = decodeEntities(getMeta('og:description') || getMeta('description'));
    let image = getMeta('og:image');
    if (image && image.startsWith('//')) image = 'https:' + image;

    // A bot-challenge title (e.g. "Verifying Device") means we didn't
    // actually get the real page — treat it as if scraping failed.
    if (isBotChallengeTitle(title)) {
      title = '';
    }

    title = cleanTrailingIdJunk(title);

    // If direct scraping came back empty-handed on title AND image, this
    // domain is likely JS-rendered or scraper-blocked too — try Microlink
    // as a one-off fallback before giving up (covers sites not yet added
    // to blockedDomains above).
    if (!title && !image) {
      try {
        const mlRes = await fetch(
          `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=false&video=false`,
          { signal: AbortSignal.timeout(5000) }
        );
        const mlData = await mlRes.json();
        const mlTitle = cleanTrailingIdJunk(
          !isBotChallengeTitle(mlData?.data?.title) ? mlData?.data?.title : null
        );
        if (mlData?.data?.image?.url || mlTitle) {
          return res.status(200).json({
            title: mlTitle || titleFromSlug(),
            description: mlData.data.description || '',
            image: mlData.data.image?.url || null,
            domain,
          });
        }
      } catch (e) {}
    }

    return res.status(200).json({ title: title || titleFromSlug(), description, image, domain });
  } catch (e) {
    return res.status(200).json({ title: titleFromSlug(), description: '', image: null, domain });
  }
}