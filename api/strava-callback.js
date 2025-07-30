// /api/strava-callback.js

import fetch from 'node-fetch';
import cookie from 'cookie';

export default async function handler(req, res) {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send('Kod bulunamadı');
  }

  try {
    const response = await fetch('https://www.strava.com/api/v3/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
      }),
    });

    const data = await response.json();

    if (data.errors) {
      throw new Error(JSON.stringify(data.errors));
    }

    // Token'ı güvenli bir cookie'ye set et
    res.setHeader('Set-Cookie', cookie.serialize('strava_token', data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      maxAge: data.expires_in, // saniye cinsinden
      sameSite: 'lax',
      path: '/',
    }));

    // Kullanıcıyı ana sayfaya yönlendir
    res.redirect(302, '/');

  } catch (error) {
    console.error('Strava token hatası:', error);
    res.status(500).send(`Strava kimlik doğrulama hatası: ${error.message}`);
  }
}
