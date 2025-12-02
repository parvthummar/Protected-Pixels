/**
 * File Encryption Utilities
 * Handles client-side file encryption/decryption using AES-256-GCM with the user's master key
 */

/**
 * Encrypt a file using the master key
 * @param {File} file - File to encrypt
 * @param {string} masterKey - Base64-encoded master key
 * @returns {Promise<{encryptedBlob: Blob, iv: string, filename: string}>}
 */
export async function encryptFile(file, masterKey) {
    try {
        // Read file as ArrayBuffer
        const fileBuffer = await file.arrayBuffer();

        // Decode master key from base64
        const keyData = Uint8Array.from(atob(masterKey), c => c.charCodeAt(0));

        // Import master key for AES-GCM
        const cryptoKey = await window.crypto.subtle.importKey(
            'raw',
            keyData,
            { name: 'AES-GCM' },
            false,
            ['encrypt']
        );

        // Generate random IV (96 bits = 12 bytes for AES-GCM)
        const iv = window.crypto.getRandomValues(new Uint8Array(12));

        // Encrypt file
        const encryptedBuffer = await window.crypto.subtle.encrypt(
            {
                name: 'AES-GCM',
                iv: iv,
                tagLength: 128 // 128-bit authentication tag
            },
            cryptoKey,
            fileBuffer
        );

        // Convert encrypted data to Blob
        const encryptedBlob = new Blob([encryptedBuffer], { type: 'application/octet-stream' });

        // Convert IV to base64 for transmission
        const ivBase64 = btoa(String.fromCharCode(...iv));

        return {
            encryptedBlob,
            iv: ivBase64,
            filename: file.name
        };
    } catch (error) {
        console.error('File encryption error:', error);
        throw new Error('Failed to encrypt file: ' + error.message);
    }
}

/**
 * Decrypt a file using the master key
 * @param {ArrayBuffer} encryptedData - Encrypted file data
 * @param {string} masterKey - Base64-encoded master key
 * @param {string} ivBase64 - Base64-encoded IV
 * @returns {Promise<ArrayBuffer>} Decrypted file data
 */
export async function decryptFile(encryptedData, masterKey, ivBase64) {
    try {
        // Decode master key from base64
        const keyData = Uint8Array.from(atob(masterKey), c => c.charCodeAt(0));

        // Import master key for AES-GCM
        const cryptoKey = await window.crypto.subtle.importKey(
            'raw',
            keyData,
            { name: 'AES-GCM' },
            false,
            ['decrypt']
        );

        // Decode IV from base64
        const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));

        // Decrypt file
        const decryptedBuffer = await window.crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv: iv,
                tagLength: 128
            },
            cryptoKey,
            encryptedData
        );

        return decryptedBuffer;
    } catch (error) {
        console.error('File decryption error:', error);
        throw new Error('Failed to decrypt file: ' + error.message);
    }
}

/**
 * Validate if file is an image
 * @param {File} file - File to validate
 * @returns {boolean} True if file is an image
 */
export function isImageFile(file) {
    const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    return imageTypes.includes(file.type);
}

export default {
    encryptFile,
    decryptFile,
    isImageFile
};
