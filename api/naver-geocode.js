export default async function handler(req, res) {
  const query = req.query.query || '';
  if (!query) {
    return res.status(400).json({ error: 'query parameter is required' });
  }

  const clientId = process.env.VITE_NAVER_MAP_CLIENT_ID;
  const clientSecret = process.env.VITE_NAVER_MAP_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: 'Naver API credentials not configured' });
  }

  const url = `https://maps.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodeURIComponent(query)}`;

  try {
    const response = await fetch(url, {
      headers: {
        'X-NCP-APIGW-API-KEY-ID': clientId,
        'X-NCP-APIGW-API-KEY': clientSecret,
      },
    });

    if (!response.ok) {
      const body = await response.text();
      return res.status(response.status).json({ error: body });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
