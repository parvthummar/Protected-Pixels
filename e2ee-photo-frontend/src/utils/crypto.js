/**
 * Cryptography Utilities for E2EE Photo Sharing
 * Uses Web Crypto API for secure client-side encryption
 * 
 * Key Components:
 * - PBKDF2 for password-based key derivation
 * - AES-256-GCM for authenticated encryption
 * - Secure random key generation
 */

// Configuration constants
const PBKDF2_ITERATIONS = 600000;  // 600k iterations for security
const PBKDF2_KEY_LENGTH = 256;     // 256-bit keys
const AES_KEY_LENGTH = 256;        // AES-256
const AES_IV_LENGTH = 12;          // 96 bits for GCM
const SALT_LENGTH = 16;            // 128 bits

/**
 * Convert ArrayBuffer to Base64 string
 */
function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

/**
 * Convert Base64 string to ArrayBuffer
 */
function base64ToArrayBuffer(base64) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

/**
 * Generate a cryptographically secure random key
 * @param {number} length - Length in bytes (default: 32 bytes = 256 bits)
 * @returns {string} Base64-encoded random key
 */
export function generateRandomKey(length = 32) {
    const randomBytes = crypto.getRandomValues(new Uint8Array(length));
    return arrayBufferToBase64(randomBytes);
}

/**
 * Generate a random salt for PBKDF2
 * @returns {Uint8Array} Random salt
 */
function generateSalt() {
    return crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
}

/**
 * Derive an encryption key from a password using PBKDF2
 * @param {string} password - User's password
 * @param {Uint8Array} salt - Salt for key derivation
 * @returns {Promise<CryptoKey>} Derived encryption key
 */
async function deriveKeyFromPassword(password, salt) {
    // Import password as key material
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);

    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
    );

    // Derive AES key using PBKDF2
    return await crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: PBKDF2_ITERATIONS,
            hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: PBKDF2_KEY_LENGTH },
        false,
        ['encrypt', 'decrypt']
    );
}

/**
 * Encrypt data using AES-256-GCM
 * @param {string} plaintext - Data to encrypt (Base64 or plain string)
 * @param {string} password - Password for encryption
 * @returns {Promise<string>} Encrypted data (Base64: salt + iv + ciphertext)
 */
export async function encryptWithPassword(plaintext, password) {
    try {
        // Generate random salt and IV
        const salt = generateSalt();
        const iv = crypto.getRandomValues(new Uint8Array(AES_IV_LENGTH));

        // Derive encryption key from password
        const key = await deriveKeyFromPassword(password, salt);

        // Convert plaintext to ArrayBuffer
        const encoder = new TextEncoder();
        const plaintextBuffer = encoder.encode(plaintext);

        // Encrypt using AES-GCM
        const ciphertext = await crypto.subtle.encrypt(
            {
                name: 'AES-GCM',
                iv: iv
            },
            key,
            plaintextBuffer
        );

        // Concatenate salt + iv + ciphertext
        const combined = new Uint8Array(salt.length + iv.length + ciphertext.byteLength);
        combined.set(salt, 0);
        combined.set(iv, salt.length);
        combined.set(new Uint8Array(ciphertext), salt.length + iv.length);

        // Return as Base64
        return arrayBufferToBase64(combined.buffer);
    } catch (error) {
        console.error('Encryption error:', error);
        throw new Error('Failed to encrypt data');
    }
}

/**
 * Decrypt data using AES-256-GCM
 * @param {string} encryptedData - Encrypted data (Base64: salt + iv + ciphertext)
 * @param {string} password - Password for decryption
 * @returns {Promise<string>} Decrypted plaintext
 */
export async function decryptWithPassword(encryptedData, password) {
    try {
        // Convert Base64 to ArrayBuffer
        const combined = new Uint8Array(base64ToArrayBuffer(encryptedData));

        // Extract salt, iv, and ciphertext
        const salt = combined.slice(0, SALT_LENGTH);
        const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + AES_IV_LENGTH);
        const ciphertext = combined.slice(SALT_LENGTH + AES_IV_LENGTH);

        // Derive decryption key from password
        const key = await deriveKeyFromPassword(password, salt);

        // Decrypt using AES-GCM
        const plaintextBuffer = await crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv: iv
            },
            key,
            ciphertext
        );

        // Convert ArrayBuffer to string
        const decoder = new TextDecoder();
        return decoder.decode(plaintextBuffer);
    } catch (error) {
        console.error('Decryption error:', error);
        throw new Error('Failed to decrypt data. Wrong password?');
    }
}

/**
 * Generate master key and verification key for new user
 * @returns {Object} { masterKey, verificationKey } (both Base64)
 */
export function generateUserKeys() {
    return {
        masterKey: generateRandomKey(32),      // 256-bit master key
        verificationKey: generateRandomKey(32) // 256-bit verification key
    };
}

/**
 * Encrypt user keys with password for signup
 * @param {string} masterKey - Base64 master key
 * @param {string} verificationKey - Base64 verification key
 * @param {string} password - User's password
 * @returns {Promise<Object>} { enc_masterkey, enc_verificationkey }
 */
export async function encryptUserKeys(masterKey, verificationKey, password) {
    const enc_masterkey = await encryptWithPassword(masterKey, password);
    const enc_verificationkey = await encryptWithPassword(verificationKey, password);

    return {
        enc_masterkey,
        enc_verificationkey
    };
}

/**
 * Decrypt verification key for signin
 * @param {string} enc_verificationkey - Encrypted verification key from server
 * @param {string} password - User's password
 * @returns {Promise<string>} Plain verification key
 */
export async function decryptVerificationKey(enc_verificationkey, password) {
    return await decryptWithPassword(enc_verificationkey, password);
}

// Export all functions
export default {
    generateRandomKey,
    generateUserKeys,
    encryptWithPassword,
    decryptWithPassword,
    encryptUserKeys,
    decryptVerificationKey
};
