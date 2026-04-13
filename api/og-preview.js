export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'No URL' });
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=604800, stale-while-revalidate=86400');
  const domain = new URL(url).hostname.replace('www.', '');

  const titleFromSlug = () => {
    const slug = new URL(url).pathname.split('/').filter(Boolean).pop() || '';
    return slug
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase())
      .trim();
  };

  // Sites that block scrapers — try Microlink first, fall back to slug
const blockedDomains = ['justjared.com', 'justjaredjr.com', 'people.com'];
  const blockedMatch = blockedDomains.find(d => domain.includes(d));

  if (blockedMatch) {
    try {
      const mlRes = await fetch(
        `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=false&video=false`,
        { signal: AbortSignal.timeout(5000) }
      );
      const mlData = await mlRes.json();
      if (mlData?.data?.image?.url) {
        return res.status(200).json({
          title: mlData.data.title || titleFromSlug(),
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
    const title = getMeta('og:title') || html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() || '';
    const description = getMeta('og:description') || getMeta('description');
    let image = getMeta('og:image');
    if (image && image.startsWith('//')) image = 'https:' + image;
    return res.status(200).json({ title, description, image, domain });
  } catch (e) {
    return res.status(200).json({ title: titleFromSlug(), description: '', image: null, domain });
  }
}