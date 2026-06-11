const cron = require('node-cron');
const store = require('../utils/store');
const cryptoUtils = require('../utils/crypto');
const aggregator = require('../services/aggregator');
const normalizer = require('../middleware/normalizer');

/**
 * Initializes and schedules the background syncing cron job.
 */
function startSyncJob() {
  // Cron syntax: Run every 2 minutes to make it easily observable during testing
  cron.schedule('*/2 * * * *', async () => {
    console.log(`[Background Sync] Triggering scheduled execution at ${new Date().toISOString()}`);
    await performSync();
  });
  console.log('[Background Sync] Cron scheduler registered (runs every 2 minutes).');
}

/**
 * Iterates over all linked brokers, decrypts keys, fetches execution logs, and normalizes them.
 */
async function performSync() {
  if (store.connectedBrokers.length === 0) {
    console.log('[Background Sync] No connected broker accounts found. Sync skipped.');
    return;
  }

  for (const conn of store.connectedBrokers) {
    try {
      console.log(`[Background Sync] Retrieving history for ${conn.brokerName} (ID: ${conn.accountId})...`);
      
      // Decrypt credentials securely on-the-fly
      const decryptedKey = cryptoUtils.decryptToken(conn.encryptedToken);
      
      // Fetch raw telemetry logs
      const rawTrades = await aggregator.fetchBrokerTrades(conn.brokerName, decryptedKey);
      
      let newTradesAdded = 0;
      
      // Normalize and cache
      for (const raw of rawTrades) {
        const normalized = normalizer.normalizeTrade(raw, conn.brokerName);
        if (normalized) {
          // Check for existing records to prevent duplicates
          const exists = store.syncedTrades.some(t => t.id === normalized.id);
          if (!exists) {
            store.syncedTrades.push(normalized);
            newTradesAdded++;
          }
        }
      }
      
      console.log(`[Background Sync] Completed ${conn.brokerName} sync. Added ${newTradesAdded} new verified trades.`);
    } catch (err) {
      console.error(`[Background Sync] Error executing sync for ${conn.brokerName}:`, err.message);
    }
  }
}

module.exports = {
  startSyncJob,
  performSync
};
