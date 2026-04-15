export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'No URL' });
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=3600');

  try {
    const token = process.env.VITE_FACEBOOK_APP_TOKEN;
    const apiRes = await fetch(
      `https://graph.facebook.com/v18.0/instagram_oembed?url=${encodeURIComponent(url)}&access_token=${token}`,
      { signal: AbortSignal.timeout(5000) }
    );
    const data = await apiRes.json();
    console.log("FB API response:", JSON.stringify(data));
    return res.status(200).json({ valid: apiRes.ok, debug: data });
  } catch (e) {
    return res.status(200).json({ valid: false, error: e.message });
  }
}