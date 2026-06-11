/**
 * calendarMockData.js
 * 
 * Generates realistic Finnhub-formatted economic calendar events
 * for the current day and the next day. Used as a fallback when
 * the live Finnhub API is unavailable or returns no data.
 */

function generateTodaysMockEvents() {
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const tomorrow = new Date(today.getTime() + 86400000);

  // Helper to create a UTC time string like "YYYY-MM-DD HH:mm:ss"
  const makeTime = (baseDate, hours, minutes) => {
    const d = new Date(baseDate.getTime());
    d.setUTCHours(hours, minutes, 0, 0);
    return d.toISOString().replace('T', ' ').substring(0, 19);
  };

  const events = [
    // === TODAY — Early Session (Asia/Pacific) ===
    { time: makeTime(today, 0, 30), country: 'AU', impact: 'medium', event: 'AIG Manufacturing Index', actual: 48.7, estimate: 49.0, previous: 47.3, unit: '' },
    { time: makeTime(today, 0, 50), country: 'JP', impact: 'low', event: 'Monetary Base (YoY)', actual: null, estimate: 1.4, previous: 1.2, unit: '%' },
    { time: makeTime(today, 1, 30), country: 'AU', impact: 'high', event: 'RBA Interest Rate Decision', actual: null, estimate: 4.35, previous: 4.35, unit: '%' },
    { time: makeTime(today, 1, 30), country: 'AU', impact: 'medium', event: 'RBA Rate Statement', actual: null, estimate: null, previous: null, unit: '' },
    { time: makeTime(today, 2, 0), country: 'NZ', impact: 'low', event: 'ANZ Commodity Prices (MoM)', actual: 0.8, estimate: null, previous: -0.4, unit: '%' },
    { time: makeTime(today, 3, 0), country: 'JP', impact: 'medium', event: 'Consumer Confidence Index', actual: null, estimate: 36.5, previous: 36.2, unit: '' },

    // === TODAY — London Session ===
    { time: makeTime(today, 7, 0), country: 'EU', impact: 'medium', event: 'Sentix Investor Confidence', actual: null, estimate: -7.0, previous: -7.3, unit: '' },
    { time: makeTime(today, 7, 45), country: 'EU', impact: 'low', event: 'French Trade Balance', actual: null, estimate: -7.4, previous: -7.6, unit: 'B' },
    { time: makeTime(today, 8, 0), country: 'GB', impact: 'high', event: 'GDP (MoM)', actual: null, estimate: 0.2, previous: 0.1, unit: '%' },
    { time: makeTime(today, 8, 0), country: 'GB', impact: 'medium', event: 'Manufacturing Production (MoM)', actual: null, estimate: 0.3, previous: -0.1, unit: '%' },
    { time: makeTime(today, 8, 0), country: 'GB', impact: 'medium', event: 'Industrial Production (MoM)', actual: null, estimate: 0.1, previous: 0.0, unit: '%' },
    { time: makeTime(today, 8, 0), country: 'GB', impact: 'low', event: 'Trade Balance', actual: null, estimate: -4.5, previous: -4.8, unit: 'B' },
    { time: makeTime(today, 9, 0), country: 'EU', impact: 'low', event: 'Italian Industrial Production (MoM)', actual: null, estimate: 0.5, previous: -0.2, unit: '%' },

    // === TODAY — New York Session ===
    { time: makeTime(today, 12, 30), country: 'US', impact: 'high', event: 'Nonfarm Payrolls', actual: 272, estimate: 185, previous: 165, unit: 'K' },
    { time: makeTime(today, 12, 30), country: 'US', impact: 'high', event: 'Unemployment Rate', actual: 4.0, estimate: 3.9, previous: 3.9, unit: '%' },
    { time: makeTime(today, 12, 30), country: 'US', impact: 'medium', event: 'Average Hourly Earnings (MoM)', actual: 0.4, estimate: 0.3, previous: 0.2, unit: '%' },
    { time: makeTime(today, 12, 30), country: 'US', impact: 'low', event: 'Average Hourly Earnings (YoY)', actual: null, estimate: 3.9, previous: 4.0, unit: '%' },
    { time: makeTime(today, 12, 30), country: 'CA', impact: 'high', event: 'Employment Change', actual: null, estimate: 25.0, previous: 90.4, unit: 'K' },
    { time: makeTime(today, 12, 30), country: 'CA', impact: 'medium', event: 'Unemployment Rate', actual: null, estimate: 6.2, previous: 6.1, unit: '%' },
    { time: makeTime(today, 14, 0), country: 'US', impact: 'medium', event: 'Wholesale Inventories (MoM)', actual: null, estimate: -0.4, previous: -0.4, unit: '%' },
    { time: makeTime(today, 14, 0), country: 'US', impact: 'medium', event: 'JOLTS Job Openings', actual: null, estimate: 8.34, previous: 8.49, unit: 'M' },
    { time: makeTime(today, 16, 0), country: 'US', impact: 'low', event: 'Consumer Credit (MoM)', actual: null, estimate: 10.0, previous: 6.27, unit: 'B' },

    // === TOMORROW ===
    { time: makeTime(tomorrow, 1, 30), country: 'AU', impact: 'medium', event: 'Westpac Consumer Sentiment', actual: null, estimate: null, previous: 82.4, unit: '' },
    { time: makeTime(tomorrow, 6, 0), country: 'JP', impact: 'high', event: 'BoJ Interest Rate Decision', actual: null, estimate: -0.10, previous: -0.10, unit: '%' },
    { time: makeTime(tomorrow, 8, 30), country: 'GB', impact: 'high', event: 'CPI (YoY)', actual: null, estimate: 2.1, previous: 2.3, unit: '%' },
    { time: makeTime(tomorrow, 9, 0), country: 'EU', impact: 'high', event: 'ECB Interest Rate Decision', actual: null, estimate: 4.25, previous: 4.50, unit: '%' },
    { time: makeTime(tomorrow, 12, 30), country: 'US', impact: 'high', event: 'Core CPI (MoM)', actual: null, estimate: 0.3, previous: 0.3, unit: '%' },
    { time: makeTime(tomorrow, 12, 30), country: 'US', impact: 'high', event: 'Initial Jobless Claims', actual: null, estimate: 225, previous: 229, unit: 'K' },
  ];

  return events;
}

module.exports = { generateTodaysMockEvents };
