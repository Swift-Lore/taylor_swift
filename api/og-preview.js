export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'No URL' });

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=604800, stale-while-revalidate=86400');

  try {
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

    const domain = new URL(url).hostname.replace('www.', '');

    return res.status(200).json({ title, description, image, domain });
  } catch (e) {
    const domain = new URL(url).hostname.replace('www.', '');
    return res.status(200).json({ title: '', description: '', image: null, domain });
  }
}