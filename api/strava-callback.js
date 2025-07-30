
export default function handler(req, res) {
  const clientId = process.env.STRAVA_CLIENT_ID;
  const redirectUri = `https://kackarsim.vercel.app/api/strava-callback`; // Sitenizin adını kontrol edin
  
  const scope = 'read,activity:read_all,profile:read_all';
  
  const authUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;
  
  res.redirect(302, authUrl);
}
