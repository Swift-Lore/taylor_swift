export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'No URL provided' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=3600');

  try {
    const token = process.env.FACEBOOK_APP_TOKEN;

    if (!token) {
      return res.status(500).json({ error: 'Missing FACEBOOK_APP_TOKEN' });
    }

    const apiUrl =
      `https://graph.facebook.com/v25.0/instagram_oembed` +
      `?url=${encodeURIComponent(url)}` +
      `&access_token=${encodeURIComponent(token)}`;

    const apiRes = await fetch(apiUrl, {
      signal: AbortSignal.timeout(8000),
      headers: {
        Accept: 'application/json',
      },
    });

    const data = await apiRes.json();

    console.log('FB API response:', JSON.stringify(data));

    if (!apiRes.ok) {
      return res.status(apiRes.status).json({
        valid: false,
        status: apiRes.status,
        debug: data,
      });
    }

    return res.status(200).json({
      valid: true,
      debug: data,
    });
  } catch (e) {
    return res.status(500).json({
      valid: false,
      error: e.message,
    });
  }
}