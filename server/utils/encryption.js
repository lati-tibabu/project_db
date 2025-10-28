const CryptoJS = require('crypto-js');

// Use environment variable for encryption key
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY) {
  console.warn('WARNING: ENCRYPTION_KEY not set in environment variables. Using default key for development only.');
  if (process.env.NODE_ENV === 'production') {
    throw new Error('ENCRYPTION_KEY must be set in production environment');
  }
}

const EFFECTIVE_KEY = ENCRYPTION_KEY || 'default-dev-key-not-for-production';

/**
 * Encrypt sensitive data (not for password hashing/authentication)
 * This is used for storing database credentials locally, not for user authentication.
 * @param {string} data - Data to encrypt
 * @returns {string} Encrypted data
 */
function encrypt(data) {
  return CryptoJS.AES.encrypt(data, EFFECTIVE_KEY).toString();
}

/**
 * Decrypt encrypted data
 * @param {string} encryptedData - Encrypted data
 * @returns {string} Decrypted data
 */
function decrypt(encryptedData) {
  const bytes = CryptoJS.AES.decrypt(encryptedData, EFFECTIVE_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}

module.exports = { encrypt, decrypt };
