const express = require('express');
const router = express.Router();
const store = require('../utils/store');

/**
 * Broker linking is PAUSED.
 *
 * This route used to accept a broker password, encrypt it and keep it, and then
 * return canned sample trades without ever contacting a broker. Collecting a real
 * credential for nothing is a liability, and showing sample trades as "verified"
 * is misleading, so both are switched off here until linking is rebuilt in a way
 * that never needs a password.
 *
 * The response shapes are unchanged so the current frontend keeps working.
 */
const PAUSED = 'Broker linking is paused. We no longer accept or store broker passwords.';

// Drop anything an older version of this server may have been holding in memory.
store.connectedBrokers = [];
store.syncedTrades = [];

/** POST /api/broker/connect — refuses. The request body is never read or logged. */
router.post('/connect', (req, res) => {
  res.status(410).json({ error: PAUSED });
});

/** GET /api/broker/trades — there are no broker trades while linking is paused. */
router.get('/trades', (req, res) => {
  res.json({ success: true, trades: [] });
});

/** POST /api/broker/sync — nothing to sync. */
router.post('/sync', (req, res) => {
  res.json({ success: true, message: PAUSED, trades: [] });
});

/** POST /api/broker/disconnect — always succeeds; there is nothing stored to remove. */
router.post('/disconnect', (req, res) => {
  res.json({ success: true, message: 'Broker account disconnected. No credentials are stored.' });
});

module.exports = router;
