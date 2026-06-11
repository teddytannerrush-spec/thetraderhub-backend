const express = require('express');
const https = require('https');
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const { generateTodaysMockEvents } = require('../data/calendarMockData');

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY && process.env.FINNHUB_API_KEY !== 'your_finnhub_key_here'
  ? process.env.FINNHUB_API_KEY
  : 'd8hlko1r01qrn5ecqhegd8hlko1r01qrn5ecqhf0';

const CACHE_FILE = path.join(__dirname, '../data/economic_calendar.json');

/**
 * Fetches data from Finnhub and saves it to local cache file.
 */
function fetchAndCacheFinnhubData() {
  console.log('[Calendar Cache] Fetching fresh data from Finnhub...');
  
  const today = new Date();
  const twoWeeksOut = new Date(today.getTime() + 14 * 24 * 3600 * 1000);
  
  const formatDate = (d) => {
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const fromDate = formatDate(today);
  const toDate = formatDate(twoWeeksOut);

  const url = `https://finnhub.io/api/v1/calendar/economic?from=${fromDate}&to=${toDate}&token=${FINNHUB_API_KEY}`;
  
  https.get(url, (resp) => {
    let body = '';
    resp.on('data', chunk => body += chunk);
    resp.on('end', () => {
      try {
        const data = JSON.parse(body);
        const dir = path.dirname(CACHE_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        
        if (data && data.economicCalendar && data.economicCalendar.length > 0) {
          fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2), 'utf-8');
          console.log(`[Calendar Cache] Successfully saved ${data.economicCalendar.length} events to disk cache.`);
        } else {
          console.warn('[Calendar Cache] Received empty or invalid format from Finnhub. Using mock fallback.');
          const fallbackData = { economicCalendar: generateTodaysMockEvents() };
          fs.writeFileSync(CACHE_FILE, JSON.stringify(fallbackData, null, 2), 'utf-8');
          console.log(`[Calendar Cache] Successfully saved ${fallbackData.economicCalendar.length} mock events to disk cache.`);
        }
      } catch (parseErr) {
        console.error('[Calendar Cache] Failed to parse Finnhub JSON. Using mock fallback:', parseErr);
        const fallbackData = { economicCalendar: generateTodaysMockEvents() };
        const dir = path.dirname(CACHE_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(CACHE_FILE, JSON.stringify(fallbackData, null, 2), 'utf-8');
      }
    });
  }).on('error', (err) => {
    console.error('[Calendar Cache] Network error fetching Finnhub data. Using mock fallback:', err);
    const fallbackData = { economicCalendar: generateTodaysMockEvents() };
    const dir = path.dirname(CACHE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(CACHE_FILE, JSON.stringify(fallbackData, null, 2), 'utf-8');
  });
}

// -----------------------------------------------------
// GET /api/economic-calendar
// -----------------------------------------------------
router.get('/', (req, res) => {
  // If the cache file exists, serve it directly
  if (fs.existsSync(CACHE_FILE)) {
    try {
      const fileData = fs.readFileSync(CACHE_FILE, 'utf-8');
      const jsonData = JSON.parse(fileData);
      return res.json(jsonData);
    } catch (err) {
      console.error('[Calendar Cache] Error reading cache file:', err);
      return res.status(500).json({ error: 'Failed to read cache file' });
    }
  } else {
    // If no cache exists yet, fetch immediately in background and return empty 
    fetchAndCacheFinnhubData();
    return res.status(503).json({ error: 'Cache is warming up. Please try again shortly.' });
  }
});

// Run the initial fetch 3 seconds after server boots to prime the cache
setTimeout(() => {
  if (!fs.existsSync(CACHE_FILE)) {
    console.log('[Calendar Cache] Cache file missing. Priming cache...');
    fetchAndCacheFinnhubData();
  }
}, 3000);

// Schedule background fetch to run at minute 0 past every hour
cron.schedule('0 * * * *', () => {
  console.log('[Calendar Cache] ⏰ Hourly cron trigger — refreshing calendar data.');
  fetchAndCacheFinnhubData();
}, { timezone: 'UTC' });
console.log('[Calendar Cache] Hourly caching cron registered.');

module.exports = router;
