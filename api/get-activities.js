// /api/get-activities.js

import fetch from 'node-fetch';
import cookie from 'cookie';

export default async function handler(req, res) {
  const cookies = cookie.parse(req.headers.cookie || '');
  const token = cookies.strava_token;

  if (!token) {
    return res.status(401).json({ message: 'Yetkilendirme Gerekli' });
  }
  
  // Sadece oturum kontrolü için hızlı bir istek
  if (req.query.check === 'true') {
      return res.status(200).json({ message: 'Oturum aktif' });
  }

  try {
    let page = 1;
    let allActivities = [];
    const perPage = 100; // Sayfa başına aktivite sayısı (max 200)

    while (true) {
      const response = await fetch(`https://www.strava.com/api/v3/athlete/activities?page=${page}&per_page=${perPage}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Strava API hatası: ${response.statusText}`);
      }

      const activities = await response.json();
      if (activities.length === 0) {
        break; // Daha fazla aktivite yoksa döngüden çık
      }
      
      // Her aktivite için stream verilerini çek
      const activitiesWithStreams = await Promise.all(activities.map(async (activity) => {
          const streamResponse = await fetch(`https://www.strava.com/api/v3/activities/${activity.id}/streams?keys=time,latlng,altitude&key_by_type=true`, {
              headers: { Authorization: `Bearer ${token}` }
          });
          activity.streams = await streamResponse.json();
          return activity;
      }));
      
      allActivities = allActivities.concat(activitiesWithStreams);
      page++;
    }

    res.status(200).json(allActivities);

  } catch (error) {
    console.error('Aktivite çekme hatası:', error);
    res.status(500).json({ message: error.message });
  }
}
