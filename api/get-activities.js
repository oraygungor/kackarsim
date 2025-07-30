import fetch from 'node-fetch';
import cookie from 'cookie';

export default async function handler(req, res) {
  const cookies = cookie.parse(req.headers.cookie || '');
  const token = cookies.strava_token;

  if (!token) {
    return res.status(401).json({ message: 'Yetkilendirme Gerekli' });
  }

  // Frontend'den gelen oturum kontrolü isteğini hızlıca yanıtla
  if (req.query.check === 'true') {
    return res.status(200).json({ message: 'Oturum aktif' });
  }

  try {
    // Sadece son 200 aktiviteyi çekerek zaman aşımını önle
    const perPage = 200; 
    const activitiesResponse = await fetch(`https://www.strava.com/api/v3/athlete/activities?per_page=${perPage}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!activitiesResponse.ok) {
      throw new Error(`Strava API aktivite listesi hatası: ${activitiesResponse.statusText}`);
    }

    const activities = await activitiesResponse.json();

    // Sadece bu aktivitelerin detay verilerini (stream) çek
    const activitiesWithStreams = await Promise.all(
      activities.map(async (activity) => {
        const streamResponse = await fetch(`https://www.strava.com/api/v3/activities/${activity.id}/streams?keys=time,latlng,altitude&key_by_type=true`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (streamResponse.ok) {
          activity.streams = await streamResponse.json();
        } else {
          activity.streams = {}; // Stream alınamazsa boş obje ata
        }
        return activity;
      })
    );

    res.status(200).json(activitiesWithStreams);

  } catch (error) {
    console.error('Aktivite çekme hatası:', error);
    res.status(500).json({ message: error.message });
  }
}
