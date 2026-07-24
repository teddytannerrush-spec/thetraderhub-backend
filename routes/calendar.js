const express = require('express');
const https = require('https');
const router = express.Router();
const { generateTodaysMockEvents } = require('../data/calendarMockData');

// ForexFactory's weekly economic calendar, published as free JSON (no API key required).
const FEED_URL = 'https://nfs.faireconomy.media/ff_calendar_thisweek.json';

const CACHE_TTL_MS = 15 * 60 * 1000;      // live data is stable; refresh quarter-hourly
const FALLBACK_TTL_MS = 2 * 60 * 1000;    // transient failure; retry sooner than that
const RATE_LIMIT_TTL_MS = 20 * 60 * 1000; // the feed throttles hard, so back well off
const STALE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // serve last-known-good rather than mock

let cachedPayload = null;
let cacheExpiresAt = 0;
let lastGoodEvents = null;
let lastGoodAt = 0;

// ForexFactory impact labels -> the levels the frontend filters on
const IMPACT_MAP = {
  high: 'high',
  medium: 'medium',
  low: 'low',
  holiday: 'none'
};

/**
 * ForexFactory sends offset-aware ISO dates ("2026-07-19T18:45:00-04:00").
 * The frontend parses "YYYY-MM-DD HH:MM:SS" and appends "Z", so it needs UTC.
 */
function toUtcTimestamp(isoDate) {
  const parsed = new Date(isoDate);
  if (isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 19).replace('T', ' ');
}

/** Feed values arrive as strings like "250M" or "-0.6%"; empty strings become null. */
function cleanValue(value) {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed === '' ? null : trimmed;
}

/** Reshape feed entries into the schema economic-calendar.html already renders. */
function normalizeEvents(events) {
  return events
    .map(item => ({
      time: toUtcTimestamp(item.date),
      // The feed's "country" is really the currency code (USD, GBP, NZD...),
      // which is what the currency pills filter on.
      country: item.country,
      currency: item.country,
      impact: IMPACT_MAP[String(item.impact || '').toLowerCase()] || 'low',
      event: item.title,
      actual: cleanValue(item.actual),
      estimate: cleanValue(item.forecast),
      previous: cleanValue(item.previous),
      unit: ''
    }))
    .filter(event => event.time && event.event);
}

/** Mock events, clearly flagged so the UI can never present them as live data. */
function buildFallbackPayload(reason) {
  console.warn(`[Calendar] Serving sample data — ${reason}`);
  return {
    economicCalendar: generateTodaysMockEvents(),
    source: 'sample',
    live: false,
    notice: 'Sample data — the live economic calendar feed is unavailable.',
    fetchedAt: new Date().toISOString()
  };
}

function fetchCalendar() {
  return new Promise((resolve, reject) => {
    const request = https.get(
      FEED_URL,
      { headers: { 'User-Agent': 'TheTraderHub/1.0 (+https://thetraderhub.co.uk)' } },
      response => {
        if (response.statusCode !== 200) {
          response.resume();
          return reject(new Error(`feed returned HTTP ${response.statusCode}`));
        }

        let body = '';
        response.setEncoding('utf8');
        response.on('data', chunk => { body += chunk; });
        response.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            if (!Array.isArray(parsed) || parsed.length === 0) {
              return reject(new Error('feed returned no events'));
            }
            const events = normalizeEvents(parsed);
            if (events.length === 0) {
              return reject(new Error('no usable events after normalizing'));
            }
            resolve(events);
          } catch (err) {
            reject(new Error(`could not parse feed: ${err.message}`));
          }
        });
      }
    );

    request.on('error', err => reject(new Error(`network error: ${err.message}`)));
    request.setTimeout(10000, () => {
      request.destroy();
      reject(new Error('feed timed out after 10s'));
    });
  });
}

// -----------------------------------------------------
// GET /api/economic-calendar
// -----------------------------------------------------
router.get('/', async (req, res) => {
  if (cachedPayload && Date.now() < cacheExpiresAt) {
    return res.json(cachedPayload);
  }

  try {
    const events = await fetchCalendar();
    lastGoodEvents = events;
    lastGoodAt = Date.now();
    cachedPayload = {
      economicCalendar: events,
      source: 'forexfactory',
      live: true,
      fetchedAt: new Date(lastGoodAt).toISOString()
    };
    cacheExpiresAt = Date.now() + CACHE_TTL_MS;
    console.log(`[Calendar] Fetched ${events.length} live events.`);
  } catch (err) {
    // Real events that are a few hours old beat invented ones, so prefer
    // last-known-good and only drop to mock once it is genuinely stale.
    if (lastGoodEvents && Date.now() - lastGoodAt < STALE_MAX_AGE_MS) {
      console.warn(`[Calendar] Serving last-known-good data — ${err.message}`);
      cachedPayload = {
        economicCalendar: lastGoodEvents,
        source: 'forexfactory',
        live: true,
        stale: true,
        fetchedAt: new Date(lastGoodAt).toISOString()
      };
    } else {
      cachedPayload = buildFallbackPayload(err.message);
    }
    cacheExpiresAt = Date.now() + (/HTTP 429/.test(err.message) ? RATE_LIMIT_TTL_MS : FALLBACK_TTL_MS);
  }

  return res.json(cachedPayload);
});

module.exports = router;
