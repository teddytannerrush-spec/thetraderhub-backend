// In-memory database mock for active broker linkages and trade cache
const backendStore = {
  connectedBrokers: [], // { brokerName, accountId, encryptedToken, accountType, linkedAt }
  syncedTrades: []      // Unified trade schema records
};

module.exports = backendStore;
