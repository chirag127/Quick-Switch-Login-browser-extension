/**
 * Encryption utilities for sensitive session data
 */
const CryptoJS = require('crypto-js');

/**
 * Encrypt data using AES-256
 * @param {Object|string} data Data to encrypt
 * @param {string} userId User ID to use as part of the encryption key
 * @returns {string} Encrypted data
 */
const encrypt = (data, userId) => {
  // Convert data to string if it's an object
  const dataString = typeof data === 'object' ? JSON.stringify(data) : data;
  
  // Use a combination of the environment encryption key and user ID
  // This ensures each user's data is encrypted with a unique key
  const encryptionKey = `${process.env.ENCRYPTION_KEY || 'default_key'}_${userId}`;
  
  // Encrypt the data
  return CryptoJS.AES.encrypt(dataString, encryptionKey).toString();
};

/**
 * Decrypt data
 * @param {string} encryptedData Encrypted data
 * @param {string} userId User ID used in the encryption key
 * @returns {Object|string} Decrypted data
 */
const decrypt = (encryptedData, userId) => {
  // Use the same key combination as in encrypt
  const encryptionKey = `${process.env.ENCRYPTION_KEY || 'default_key'}_${userId}`;
  
  // Decrypt the data
  const bytes = CryptoJS.AES.decrypt(encryptedData, encryptionKey);
  const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
  
  // Try to parse as JSON, return as string if not valid JSON
  try {
    return JSON.parse(decryptedString);
  } catch (e) {
    return decryptedString;
  }
};

module.exports = {
  encrypt,
  decrypt
};
