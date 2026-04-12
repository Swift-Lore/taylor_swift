export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'No URL' });

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=604800, stale-while-revalidate=86400');

  // Hardcoded fallbacks for sites that block scrapers
  const hardcoded = {
    'justjared.com': {
      title: 'Just Jared',
      description: 'Celebrity news and gossip.',
      image: 'https://www.justjared.com/wp-content/uploads/2020/05/jj-logo.jpg',
    },
  };

  try {
    const domain = new URL(url).hostname.replace('www.', '');

    // Check hardcoded first
    const hardcodedKey = Object.keys(hardcoded).find(k => domain.includes(k));
    if (hardcodedKey) {
      const fallback = hardcoded[hardcodedKey];
      // Still try to get the real title from the URL slug
      const slug = new URL(url).pathname.split('/').filter(Boolean).pop() || '';
      const titleFromSlug = slug
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase())
        .trim();
      return res.status(200).json({
        title: titleFromSlug || fallback.title,
        description: fallback.description,
        image: fallback.image,
        domain: hardcodedKey,
      });
    }

    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' },
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
    const domain = new URL(url).hostname.replace('www.', '');
    return res.status(200).json({ title: '', description: '', image: null, domain });
  }
}