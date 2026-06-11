const express = require('express');
const router = express.Router();
const store = require('../utils/store');
const cryptoUtils = require('../utils/crypto');
const syncJob = require('../jobs/sync');

/**
 * POST /api/broker/connect
 * Receives account credentials, encrypts them at rest, vaults them, and runs an initial sync.
 */
router.post('/connect', async (req, res) => {
  const { brokerName, accountId, password, accountType } = req.body;
  
  if (!brokerName || !accountId || !password || !accountType) {
    return res.status(400).json({ error: 'Missing connection fields (brokerName, accountId, password, accountType).' });
  }

  try {
    // Encrypt sensitive credential using AES-256-GCM
    const encryptedToken = cryptoUtils.encryptToken(password);
    
    // Check if broker connection already exists
    const existingIndex = store.connectedBrokers.findIndex(
      c => c.brokerName.toLowerCase() === brokerName.toLowerCase()
    );
    
    const newConnection = {
      brokerName,
      accountId,
      encryptedToken,
      accountType,
      linkedAt: new Date().toISOString()
    };
    
    if (existingIndex > -1) {
      store.connectedBrokers[existingIndex] = newConnection;
    } else {
      store.connectedBrokers.push(newConnection);
    }
    
    console.log(`[API Route] Connected ${brokerName} (ID: ${accountId}). Token encrypted successfully.`);
    
    // Instantly run sync in background so credentials are tested and trades cached immediately
    await syncJob.performSync();
    
    res.json({
      success: true,
      message: `${brokerName} linked and initial trade synchronization completed.`,
      connection: {
        brokerName,
        accountId,
        accountType,
        linkedAt: newConnection.linkedAt
      }
    });
  } catch (err) {
    console.error('[API Route] Error connecting broker:', err);
    res.status(500).json({ error: 'Server vault failed to encrypt credentials.' });
  }
});

/**
 * GET /api/broker/trades
 * Returns cached, normalized, and verified broker trades.
 */
router.get('/trades', (req, res) => {
  res.json({
    success: true,
    trades: store.syncedTrades
  });
});

/**
 * POST /api/broker/sync
 * Manually triggers a synchronization cycle across all connected accounts.
 */
router.post('/sync', async (req, res) => {
  try {
    await syncJob.performSync();
    res.json({
      success: true,
      message: 'Broker synchronization cycle executed successfully.',
      trades: store.syncedTrades
    });
  } catch (err) {
    console.error('[API Route] Manual sync error:', err);
    res.status(500).json({ error: 'Synchronization cycle execution failed.' });
  }
});

/**
 * POST /api/broker/disconnect
 * Removes connection from vault and purges associated cached trades.
 */
router.post('/disconnect', (req, res) => {
  const { brokerName } = req.body;
  if (!brokerName) {
    return res.status(400).json({ error: 'Missing brokerName parameter.' });
  }

  // Remove connection metadata
  store.connectedBrokers = store.connectedBrokers.filter(
    c => c.brokerName.toLowerCase() !== brokerName.toLowerCase()
  );
  
  // Purge trades
  const initialCount = store.syncedTrades.length;
  store.syncedTrades = store.syncedTrades.filter(
    t => t.broker.toLowerCase() !== brokerName.toLowerCase()
  );
  const purgedCount = initialCount - store.syncedTrades.length;
  
  console.log(`[API Route] Disconnected ${brokerName}. Purged ${purgedCount} trades.`);
  
  res.json({
    success: true,
    message: `${brokerName} account disconnected. Purged ${purgedCount} verified trade cache records.`
  });
});

module.exports = router;
