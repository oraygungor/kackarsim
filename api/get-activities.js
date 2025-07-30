import fetch from 'node-fetch';
import cookie from 'cookie';

export default async function handler(req, res) {
  const cookies = cookie.parse(req.headers.cookie || '');
  const token = cookies.strava_token;

  if (!token) {
    return res.status(401).json({ message: 'Yetkilendirme Gerekli' });
  }

  // Oturum kontrolü için
  if (req.query.check === 'true') {
    return res.status(200).json({ message: 'Oturum aktif' });
  }

  try {
    const perPage = 100; // Son 200 aktiviteyi çek
    const response = await fetch(`https://www.strava.com/api/v3/athlete/activities?per_page=${perPage}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Strava API hatası: ${response.statusText}`);
    }

    const activities = await response.json();
    res.status(200).json(activities); // Stream olmadan, sadece listeyi hızlıca gönder

  } catch (error) {
    console.error('Aktivite listesi çekme hatası:', error);
    res.status(500).json({ message: error.message });
  }
}
