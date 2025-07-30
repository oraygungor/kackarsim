import fetch from 'node-fetch';
import cookie from 'cookie';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Sadece POST istekleri kabul edilir.' });
  }

  const cookies = cookie.parse(req.headers.cookie || '');
  const token = cookies.strava_token;

  if (!token) {
    return res.status(401).json({ message: 'Yetkilendirme Gerekli' });
  }

  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ message: 'Aktivite ID listesi gerekli.' });
  }

  try {
    const streamData = await Promise.all(
      ids.map(async (id) => {
        const streamResponse = await fetch(`https://www.strava.com/api/v3/activities/${id}/streams?keys=time,latlng,altitude&key_by_type=true`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (streamResponse.ok) {
          return await streamResponse.json();
        }
        return {}; // Stream alınamazsa boş obje döndür
      })
    );

    res.status(200).json(streamData);

  } catch (error) {
    console.error('Stream çekme hatası:', error);
    res.status(500).json({ message: error.message });
  }
}
