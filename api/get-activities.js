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
    // --- YENİ EKLENEN KISIM: Zaman damgası (timestamp) hesaplama ---
    const twoMonthsAgo = new Date();
    // Tarihi tam olarak 2 ay geriye ayarla
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    // Strava API'si Unix zaman damgası (saniye cinsinden) bekler
    const afterTimestamp = Math.floor(twoMonthsAgo.getTime() / 1000);
    // --- BİTTİ ---

    // Güvenlik önlemi olarak hala sayfa başına 200 aktivite limiti koyuyoruz
    const perPage = 200; 

    // --- GÜNCELLENEN KISIM: URL'ye 'after' parametresi eklendi ---
    const apiUrl = `https://www.strava.com/api/v3/athlete/activities?after=${afterTimestamp}&per_page=${perPage}`;
    // --- BİTTİ ---
    
    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Strava API Error:', errorText);
      throw new Error(`Strava API hatası: ${response.statusText}`);
    }

    const activities = await response.json();
    res.status(200).json(activities);

  } catch (error) {
    console.error('Aktivite listesi çekme hatası:', error);
    res.status(500).json({ message: error.message });
  }
}
