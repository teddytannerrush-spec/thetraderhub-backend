/**
 * Unified Trade Schema:
 * {
 *   id: string,              // standardized string std-[broker]-[id]
 *   broker: string,          // e.g. "Coinbase", "Robinhood", "OANDA"
 *   asset: string,           // normalized symbol, e.g. "BTC/USDT", "EUR/USD"
 *   direction: 'LONG'|'SHORT',
 *   entry: number,           // entry price
 *   time: string,            // ISO timestamp
 *   status: string           // "Active" | "Closed"
 * }
 */

function normalizeCoinbase(trade) {
  return {
    id: `std-coinbase-${trade.trade_id}`,
    broker: 'Coinbase',
    asset: trade.product_id.replace('-', '/'),
    direction: trade.side === 'BUY' ? 'LONG' : 'SHORT',
    entry: parseFloat(trade.price),
    time: trade.created_at,
    status: 'Active'
  };
}

function normalizeRobinhood(trade) {
  // Assume it's a crypto asset if symbol doesn't have slash, format nicely
  const asset = trade.symbol.includes('/') ? trade.symbol : `${trade.symbol}/USDT`;
  return {
    id: `std-robinhood-${trade.id}`,
    broker: 'Robinhood',
    asset: asset,
    direction: trade.side.toUpperCase() === 'BUY' ? 'LONG' : 'SHORT',
    entry: parseFloat(trade.average_buy_price || trade.price),
    time: trade.last_transaction_at || trade.created_at,
    status: 'Active'
  };
}

function normalizeOanda(trade) {
  const units = parseInt(trade.units || '0', 10);
  const direction = units >= 0 ? 'LONG' : 'SHORT';
  return {
    id: `std-oanda-${trade.id}`,
    broker: 'OANDA',
    asset: trade.instrument.replace('_', '/'),
    direction: direction,
    entry: parseFloat(trade.price),
    time: trade.time,
    status: 'Active'
  };
}

/**
 * Main normalization routing handler
 */
function normalizeTrade(trade, broker) {
  if (!trade) return null;
  const b = broker.toLowerCase();
  
  try {
    if (b.includes('coinbase')) return normalizeCoinbase(trade);
    if (b.includes('robinhood')) return normalizeRobinhood(trade);
    if (b.includes('oanda')) return normalizeOanda(trade);
    
    // Generic fallback for custom mock integrations
    return {
      id: trade.id || `std-${b}-${Date.now()}`,
      broker: broker,
      asset: trade.asset || trade.symbol || 'XAU/USD',
      direction: (trade.direction || trade.side || 'LONG').toUpperCase(),
      entry: parseFloat(trade.entry || trade.price || 0),
      time: trade.time || trade.created_at || new Date().toISOString(),
      status: trade.status || 'Active'
    };
  } catch (err) {
    console.error(`Failed to normalize trade for broker ${broker}:`, err);
    return null;
  }
}

module.exports = {
  normalizeTrade,
  normalizeCoinbase,
  normalizeRobinhood,
  normalizeOanda
};
