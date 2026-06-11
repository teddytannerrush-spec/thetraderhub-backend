const crypto = require('crypto');

// Simulated execution records per broker platform
const mockBrokerFeeds = {
  OANDA: [
    { id: "oa-101", instrument: "XAU_USD", units: "10", price: "2032.50", time: new Date(Date.now() - 2 * 3600 * 1000).toISOString() },
    { id: "oa-102", instrument: "EUR_USD", units: "-50000", price: "1.0880", time: new Date(Date.now() - 24 * 3600 * 1000).toISOString() }
  ],
  Coinbase: [
    { trade_id: "cb-901", product_id: "BTC-USD", side: "BUY", price: "43250.00", created_at: new Date(Date.now() - 8 * 3600 * 1000).toISOString() },
    { trade_id: "cb-902", product_id: "ETH-USD", side: "BUY", price: "2340.00", created_at: new Date(Date.now() - 10 * 3600 * 1000).toISOString() }
  ],
  Robinhood: [
    { id: "rh-301", symbol: "SOL", side: "buy", price: "142.50", created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString() }
  ],
  "MetaTrader 5": [
    { id: "mt5-401", instrument: "GBP_JPY", units: "-20", price: "192.45", time: new Date(Date.now() - 24 * 3600 * 1000).toISOString() },
    { id: "mt5-402", instrument: "MATIC_USD", units: "5000", price: "0.745", time: new Date(Date.now() - 48 * 3600 * 1000).toISOString() }
  ],
  "MetaTrader 4": [
    { id: "mt4-401", instrument: "XAU_USD", units: "15", price: "2032.50", time: new Date(Date.now() - 2 * 3600 * 1000).toISOString() }
  ],
  StarTrader: [
    { id: "st-701", asset: "EUR/USD", direction: "SHORT", entry: 1.0850, time: new Date(Date.now() - 3 * 3600 * 1000).toISOString(), status: "Active" },
    { id: "st-702", asset: "BTC/USDT", direction: "LONG", entry: 64200.00, time: new Date(Date.now() - 12 * 3600 * 1000).toISOString(), status: "Active" }
  ],
  Vantage: [
    { id: "vt-801", asset: "XAU/USD", direction: "LONG", entry: 2350.00, time: new Date(Date.now() - 4 * 3600 * 1000).toISOString(), status: "Active" },
    { id: "vt-802", asset: "GBP/JPY", direction: "SHORT", entry: 198.50, time: new Date(Date.now() - 18 * 3600 * 1000).toISOString(), status: "Active" }
  ]
};

/**
 * Simulates connecting to SnapTrade or Plaid to fetch trade logs from a specific broker.
 * Requires a decrypted token or key (for credential verification sanity).
 */
async function fetchBrokerTrades(brokerName, decryptedKey) {
  // Simulate network latency for API communication
  await new Promise(resolve => setTimeout(resolve, 600));
  
  if (!decryptedKey) {
    throw new Error("Unauthorized: Decrypted API key/token required to fetch telemetry.");
  }

  // Find matching broker feed (case-insensitive check)
  const brokerKey = Object.keys(mockBrokerFeeds).find(
    k => k.toLowerCase() === brokerName.toLowerCase()
  );
  
  if (brokerKey && mockBrokerFeeds[brokerKey]) {
    return mockBrokerFeeds[brokerKey];
  }
  
  // Custom fallback generator for other brokers or paper trading
  return [
    {
      id: `paper-${crypto.randomBytes(3).toString('hex')}`,
      asset: "BTC/USDT",
      direction: "LONG",
      entry: 43500.00,
      time: new Date().toISOString(),
      status: "Active"
    }
  ];
}

module.exports = {
  fetchBrokerTrades
};
