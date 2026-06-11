const crypto = require('crypto');
const path = require('path');
const dotenv = require('dotenv');

// Ensure env is loaded from the server root
dotenv.config({ path: path.join(__dirname, '../../.env') });

const ALGORITHM = 'aes-256-gcm';
const KEY_HEX = process.env.ENCRYPTION_KEY;

if (!KEY_HEX || KEY_HEX.length !== 64) {
  throw new Error('Invalid or missing ENCRYPTION_KEY in .env. Must be a 32-byte hex string (64 characters).');
}

const ENCRYPTION_KEY = Buffer.from(KEY_HEX, 'hex');

/**
 * Encrypts cleartext using AES-256-GCM.
 * Returns a colon-separated string: ivHex:tagHex:ciphertextHex
 */
function encryptToken(text) {
  if (!text) return null;
  
  const iv = crypto.randomBytes(12); // GCM standard IV length is 12 bytes
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  
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
  
  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  decipher.setAuthTag(tag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

module.exports = {
  encryptToken,
  decryptToken
};
