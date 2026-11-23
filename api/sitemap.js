export const config = { maxDuration: 60 };

const SITE_URL = 'https://www.swift-lore.com';
const CACHE_MS = 24 * 60 * 60 * 1000;
let cachedXml = null;
let cachedAt = 0;
let pending = null;

const escapeXml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;',
})[char]);

async function generateSitemap() {
  const token = process.env.AIRTABLE_API_KEY;
  if (!token) throw new Error('Missing server configuration');

  const urls = new Set(['/', '/posts', '/eras-tour-shows', '/wedding', '/about']
    .map((path) => SITE_URL + path));
  const seenOffsets = new Set();
  let offset;

  do {
    const url = new URL('https://api.airtable.com/v0/appVhtDyx0VKlGbhy/Taylor%20Swift%20Master%20Tracker');
    url.searchParams.set('pageSize', '100');
    url.searchParams.append('fields[]', 'EVENT');
    if (offset) url.searchParams.set('offset', offset);

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error('Unable to read events');
    const data = await response.json();
    if (!Array.isArray(data.records)) throw new Error('Invalid event response');

    for (const record of data.records) {
      if (/^rec[a-zA-Z0-9]{14}$/.test(record.id) &&
          typeof record.fields?.EVENT === 'string' && record.fields.EVENT.trim()) {
        urls.add(`${SITE_URL}/post_details?id=${record.id}`);
      }
    }
    if (urls.size > 50000) throw new Error('Sitemap must be split');

    offset = data.offset;
    if (offset) {
      if (typeof offset !== 'string' || seenOffsets.has(offset)) throw new Error('Invalid pagination');
      seenOffsets.add(offset);
      // Space requests to avoid sending a burst to Airtable.
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  } while (offset);

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...urls].map((url) => `  <url><loc>${escapeXml(url)}</loc></url>`).join('\n')}\n</urlset>\n`;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!['GET', 'HEAD'].includes(req.method)) {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).send('Method not allowed');
  }

  try {
    if (!cachedXml || Date.now() - cachedAt >= CACHE_MS) {
      if (!pending) {
        pending = generateSitemap().then((xml) => {
          cachedXml = xml;
          cachedAt = Date.now();
          return xml;
        }).finally(() => { pending = null; });
      }
      await pending;
    }
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=86400');
    return res.status(200).send(req.method === 'HEAD' ? '' : cachedXml);
  } catch {
    // Do not publish a partial sitemap or include secret upstream error details.
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Retry-After', '60');
    return res.status(503).send('Sitemap temporarily unavailable. Please try again later.');
  }
}
