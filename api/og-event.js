export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.redirect('/');
  }

  try {
    const response = await fetch(
      `https://api.airtable.com/v0/appVhtDyx0VKlGbhy/Taylor%20Swift%20Master%20Tracker/${id}`,
      { headers: { Authorization: `Bearer ${process.env.VITE_AIRTABLE_API_KEY}` } }
    );
    const data = await response.json();
    const event = data.fields;

    const title = event?.EVENT || 'Taylor Swift Event';
    const date = event?.DATE
      ? new Date(event.DATE).toLocaleDateString('en-US', {
          month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC'
        })
      : '';
    const description = date ? `${date} · Taylor Swift career archive` : 'Taylor Swift career archive';
    const image = 'https://swift-lore.com/images/og-preview.png';
    const url = `https://swift-lore.com/post_details?id=${id}`;

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title} | Swift-Lore</title>
  <meta name="description" content="${description}" />
  <meta property="og:title" content="${title} | Swift-Lore" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:type" content="article" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title} | Swift-Lore" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${image}" />
  <meta http-equiv="refresh" content="0;url=${url}" />
  <script>window.location.href = "${url}";</script>
</head>
<body>
  <p>Redirecting...</p>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).send(html);

  } catch (e) {
    return res.redirect(`/post_details?id=${id}`);
  }
}