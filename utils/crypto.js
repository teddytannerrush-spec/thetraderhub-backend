const crypto = require('crypto');
const path = require('path');
const dotenv = require('dotenv');

// Ensure env is loaded from the server root
dotenv.config({ path: path.join(__dirname, '../.env') });

const ALGORITHM = 'aes-256-gcm';

/**
 * Resolves the vault key at call time rather than on import.
 *
 * Throwing during import took the whole server down — including routes that
 * have nothing to do with the broker vault — so a missing key now fails only
 * the operations that actually need it.
 */
function getEncryptionKey() {
  const keyHex = process.env.ENCRYPTION_KEY;

  if (!keyHex || keyHex.length !== 64 || !/^[0-9a-fA-F]+$/.test(keyHex)) {
    throw new Error('Invalid or missing ENCRYPTION_KEY. Must be a 32-byte hex string (64 characters).');
  }

  return Buffer.from(keyHex, 'hex');
}

/** True when broker credential vaulting is usable, for callers that want to check first. */
function isVaultConfigured() {
  try {
    getEncryptionKey();
    return true;
  } catch (err) {
    return false;
  }
}

if (!isVaultConfigured()) {
  console.warn('[Crypto] ENCRYPTION_KEY is not configured — broker linking is disabled until it is set.');
}

/**
 * Encrypts cleartext using AES-256-GCM.
 * Returns a colon-separated string: ivHex:tagHex:ciphertextHex
 */
function encryptToken(text) {
  if (!text) return null;
  
  const iv = crypto.randomBytes(12); // GCM standard IV length is 12 bytes
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts a colon-separated string (ivHex:tagHex:ciphertextHex) back to cleartext.
 */
function decryptToken(encryptedText) {
  if (!encryptedText) return null;
  
  const parts = encryptedText.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted token format. Expected iv:tag:ciphertext');
  }
  
  const iv = Buffer.from(parts[0], 'hex');
  const tag = Buffer.from(parts[1], 'hex');
  const encrypted = Buffer.from(parts[2], 'hex');
  
  const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
  decipher.setAuthTag(tag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

module.exports = {
  encryptToken,
  decryptToken,
  isVaultConfigured
};
