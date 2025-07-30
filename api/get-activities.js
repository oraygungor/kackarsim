import fetch from 'node-fetch';
import cookie from 'cookie';

export default async function handler(req, res) {
  const cookies = cookie.parse(req.headers.cookie || '');
  const token = cookies.strava_token;

  if (!token) {
    return res.status(401).json({ message: 'Yetkilendirme Gerekli' });
  }

  // Quick check for login status
  if (req.query.check === 'true') {
    return res.status(200).json({ message: 'Oturum aktif' });
  }

  try {
    // Fetch only the last 100 activities to prevent timeouts. This is plenty for the model.
    const perPage = 100;
    const response = await fetch(`https://www.strava.com/api/v3/athlete/activities?per_page=${perPage}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Strava API Error:', errorData);
      throw new Error(`Strava API hatası: ${response.statusText}`);
    }

    const activities = await response.json();

    // The stream data will be requested from the frontend's Python code later if needed.
    // For now, just send the activities. This is much faster.
    res.status(200).json(activities);

  } catch (error) {
    console.error('Aktivite çekme hatası:', error);
    res.status(500).json({ message: error.message });
  }
}
