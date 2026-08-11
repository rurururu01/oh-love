const https = require('https');

https.get('https://open.spotify.com/oembed?url=https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT', {
  headers: { 'User-Agent': 'Mozilla/5.0' }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(data));
});
