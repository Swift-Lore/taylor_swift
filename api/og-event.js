export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.redirect('/');
  }

  // If real user (not a bot), redirect to the actual React app
  const userAgent = req.headers['user-agent'] || '';
  const acceptHeader = req.headers['accept'] || '';
  const isBot = /bot|crawler|spider|facebookexternalhit|twitterbot|linkedinbot|whatsapp|discordbot|slackbot|applebot|googlebot|cardyb|bsky|bluesky|preview|curl|python|node/i.test(userAgent);
  const wantsHtml = acceptHeader.includes('text/html');

  if (wantsHtml && !isBot) {
    res.setHeader('Location', `/post_details?id=${id}`);
    return res.status(302).end();
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
    const isBluesky = /cardyb|bsky|bluesky/i.test(userAgent);
    const image = isBluesky
      ? 'https://swift-lore.com/images/swift_lore.png'
      : 'https://swift-lore.com/images/star.png';
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
<meta name="twitter:card" content="summary" />
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
// updated
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).send(html);

  } catch (e) {
    return res.redirect(`/post_details?id=${id}`);
  }
}
