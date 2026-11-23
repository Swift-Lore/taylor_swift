// Used by the existing crawler/social-preview rewrite in vercel.json.
// Regular visitors continue to receive the existing React app.
const SITE_URL = 'https://www.swift-lore.com';

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

function safeWebUrl(value) {
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');

  const errorPage = (status, title) => {
    res.setHeader('X-Robots-Tag', 'noindex');
    return res.status(status).send(`<!doctype html><html lang="en-US"><head><meta charset="utf-8"><title>${escapeHtml(title)} | Swift Lore</title></head><body><h1>${escapeHtml(title)}</h1><a href="${SITE_URL}/">Swift Lore home</a></body></html>`);
  };

  const id = req.query?.id;
  if (typeof id !== 'string' || !/^rec[a-zA-Z0-9]{14}$/.test(id)) {
    return errorPage(404, 'Event not found');
  }
  if (!process.env.AIRTABLE_API_KEY) {
    return errorPage(503, 'Event temporarily unavailable');
  }
 
  try {
    const response = await fetch(
      `https://api.airtable.com/v0/appVhtDyx0VKlGbhy/Taylor%20Swift%20Master%20Tracker/${id}`,
      {
        headers: { Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}` },
        signal: AbortSignal.timeout(10000),
      }
    );
    if (response.status === 404) return errorPage(404, 'Event not found');
    if (!response.ok) return errorPage(503, 'Event temporarily unavailable');

    const data = await response.json();
    if (!data.fields || !data.id) return errorPage(503, 'Event temporarily unavailable');
    const event = data.fields;
    const title = String(event.EVENT || 'Taylor Swift Event').trim();
    const notes = typeof event.NOTES === 'string' ? event.NOTES : '';
    const parsedDate = event.DATE ? new Date(event.DATE) : null;
    const date = parsedDate && !Number.isNaN(parsedDate.getTime())
      ? parsedDate.toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
      }) : '';
    const fullTitle = `${title}${date ? ` — ${date}` : ''} | Swift Lore`;
    const summary = [title, date, notes.replace(/\s+/g, ' ').trim()].filter(Boolean).join(' · ');
    const description = summary.length > 160 ? `${summary.slice(0, 157).trimEnd()}...` : summary;
    const canonical = `${SITE_URL}/post_details?id=${id}`;
    const image = safeWebUrl(event.IMAGE?.[0]?.url) || `${SITE_URL}/images/swift_lore.png`;
    const keywords = Array.isArray(event.KEYWORDS) ? event.KEYWORDS.join(', ') : '';
    const sources = typeof event.SOURCES === 'string'
      ? event.SOURCES.split(' || ').map((value) => safeWebUrl(value.trim())).filter(Boolean)
      : [];
    const sourceLinks = sources.map((url) => `<li><a href="${escapeHtml(url)}" rel="noopener noreferrer">${escapeHtml(url)}</a></li>`).join('\n');

    const html = `<!doctype html>
<html lang="en-US">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(fullTitle)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${escapeHtml(canonical)}">
  <meta property="og:site_name" content="Swift Lore">
  <meta property="og:title" content="${escapeHtml(fullTitle)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${escapeHtml(image)}">
  <meta property="og:url" content="${escapeHtml(canonical)}">
  <meta property="og:type" content="article">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(fullTitle)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(image)}">
</head>
<body>
  <header><a href="${SITE_URL}/">Swift Lore — Taylor Swift Career Timeline</a></header>
  <main>
    <article>
      <h1>${escapeHtml(title)}</h1>
      ${date ? `<p>${escapeHtml(date)}</p>` : ''}
      ${keywords ? `<p>${escapeHtml(keywords)}</p>` : ''}
      ${notes ? `<div style="white-space: pre-wrap">${escapeHtml(notes)}</div>` : ''}
      ${sources.length ? `<section><h2>Sources</h2><ul>${sourceLinks}</ul></section>` : ''}
    </article>
    <nav><a href="${SITE_URL}/posts">Explore the full timeline</a></nav>
  </main>
  <footer>Swift Lore is an independent fan-created archive.</footer>
</body>
</html>`;

    if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production') {
      res.setHeader('X-Robots-Tag', 'noindex');
    }
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=3600');
    return res.status(200).send(html);
  } catch {
    return errorPage(503, 'Event temporarily unavailable');
  }
}
