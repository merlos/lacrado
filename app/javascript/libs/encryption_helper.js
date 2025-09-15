/**
 * EncryptionHelper
 * Provides methods for encrypting and decrypting messages using AES-256-GCM
 * with keys derived from passwords using PBKDF2.
 * Also includes a method to generate random strings.
 * 
 * Note: This implementation uses the Web Crypto API and is intended for modern browsers.
 *       It does not support Node.js or older browsers without the Web Crypto API.
 */

export default class EncryptionHelper {

  /**
   * Generate a random string of specified length
   * @param {number} length - Length of the random string (default: 16)
   * @returns {string} Random string
   */
  static generateRandomString(length = 16) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_';
    let result = '';
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    
    for (let i = 0; i < length; i++) {
      result += chars[array[i] % chars.length];
    }
    return result;
  }

  /**
   * Encrypt a message using AES-256-GCM
   * @param {string} message - Message to encrypt
   * @param {string} password1 - Primary password
   * @param {string} password2 - Optional secondary password
   * @returns {Promise<string>} Base64 encoded encrypted data
   */
  static async encryptor(message, password1, password2 = null) {
    // Generate random salt and IV
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Derive key from passwords
    const key = await this.deriveKey(password1, password2, salt);
    
    // Encrypt the message
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      data
    );
    
    // Combine salt + iv + encrypted data (which includes ciphertext + tag)
    const encryptedArray = new Uint8Array(encryptedData);
    const combined = new Uint8Array(salt.length + iv.length + encryptedArray.length);
    combined.set(salt, 0);
    combined.set(iv, 16);
    combined.set(encryptedArray, 28);
    
    // Return base64 encoded result
    return btoa(String.fromCharCode(...combined));
  }

  /**
   * Decrypt a message using AES-256-GCM
   * @param {string} encryptedMessage - Base64 encoded encrypted data
   * @param {string} password1 - Primary password
   * @param {string} password2 - Optional secondary password
   * @returns {Promise<string>} Decrypted message
   */
  static async decryptor(encryptedMessage, password1, password2 = null) {
    // Decode base64
    const encryptedData = new Uint8Array(
      atob(encryptedMessage).split('').map(char => char.charCodeAt(0))
    );
    
    // Extract components
    const salt = encryptedData.slice(0, 16);
    const iv = encryptedData.slice(16, 28);
    const encryptedWithTag = encryptedData.slice(28); // This includes both ciphertext and tag
    
    // Derive key from passwords
    const key = await this.deriveKey(password1, password2, salt);
    
    try {
      // Decrypt the data
      const decryptedData = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        key,
        encryptedWithTag
      );
      
      // Convert back to string
      const decoder = new TextDecoder();
      return decoder.decode(decryptedData);
    } catch (error) {
      throw new Error('Decryption failed: Invalid password or corrupted data');
    }
  }

  /**
   * Derive encryption key from passwords using PBKDF2
   * @param {string} password1 - Primary password
   * @param {string} password2 - Optional secondary password
   * @param {Uint8Array} salt - Salt for key derivation
   * @returns {Promise<CryptoKey>} Derived encryption key
   */
  static async deriveKey(password1, password2, salt) {
    const combinedPassword = password1 + (password2 || '');
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(combinedPassword);
    
    // Import the password as a key
    const baseKey = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );
    
    // Derive the actual encryption key
    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      baseKey,
      {
        name: 'AES-GCM',
        length: 256
      },
      false,
      ['encrypt', 'decrypt']
    );
  }
}

/*
// Example usage:
async function example() {
  try {
    const message = "Hello, World!";
    const password1 = "mySecretPassword";
    const password2 = "optionalSecondPassword";
    
    console.log("Original message:", message);
    
    // Encrypt
    const encrypted = await EncryptionHelper.encryptor(message, password1, password2);
    console.log("Encrypted:", encrypted);
    
    // Decrypt
    const decrypted = await EncryptionHelper.decryptor(encrypted, password1, password2);
    console.log("Decrypted:", decrypted);
    
    // Generate random string
    const randomStr = EncryptionHelper.generateRandomString(20);
    console.log("Random string:", randomStr);
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

// Uncomment to run the example
example();
*/