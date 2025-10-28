const CryptoJS = require('crypto-js');

// Use environment variable for encryption key or generate a default one
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production';

/**
 * Encrypt sensitive data
 * @param {string} data - Data to encrypt
 * @returns {string} Encrypted data
 */
function encrypt(data) {
  return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
}

/**
 * Decrypt encrypted data
 * @param {string} encryptedData - Encrypted data
 * @returns {string} Decrypted data
 */
function decrypt(encryptedData) {
  const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}

module.exports = { encrypt, decrypt };
