const fs = require('fs');

function loadEnv() {
  try {
    if (fs.existsSync('.env')) {
      const content = fs.readFileSync('.env', 'utf8');
      content.split(/\?\
/).forEach((line) => {
        if (!line || line.trim().startsWith('#')) return;
        const idx = line.indexOf('=');
        if (idx > 0) {
          const key = line.substring(0, idx).trim();
          const raw = line.substring(idx + 1).trim();
          if (key) {
            const val = raw.replace(/^['\"]|['\"]$/g, '');
            if (!process.env[key]) process.env[key] = val;
          }
        }
      });
    }
  } catch (e) {
    console.error('Failed to load .env:', e);
  }
}

module.exports = { loadEnv };
