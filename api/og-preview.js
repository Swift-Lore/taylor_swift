export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'No URL' });
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=604800, stale-while-revalidate=86400');
  const domain = new URL(url).hostname.replace('www.', '');

  const titleFromSlug = () => {
  const slug = new URL(url).pathname.split('/').filter(Boolean).pop() || '';
  const cleaned = slug
    .replace(/\.\w+$/, '')
    .replace(/[-_]/g, ' ')
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
    ].some((phrase) => lower === phrase || lower.startsWith(phrase));
  };

  // A handful of sites' own og:title tags include a trailing internal
  // tracking/source ID (e.g. People.com: "...Source 7557276"). These
  // are real, correctly-scraped titles — just with junk appended — so
  // strip the known trailing pattern rather than discarding the title.
  const cleanTrailingIdJunk = (title) => {
    if (!title) return title;
    return title.replace(/\s+Source\s+\d{4,}\s*$/i, '').trim();
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
      if (mlData?.data?.image?.url) {
        return res.status(200).json({
          title: cleanTrailingIdJunk(
            !isBotChallengeTitle(mlTitle) ? mlTitle : null
          ) || titleFromSlug(),
          description: mlData.data.description || '',
          image: mlData.data.image.url,
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