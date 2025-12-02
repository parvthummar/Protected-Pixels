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

        // Prepend IV to encrypted data (IV is 12 bytes)
        // This way we can extract it during decryption
        const combined = new Uint8Array(12 + encryptedBuffer.byteLength);
        combined.set(iv, 0);
        combined.set(new Uint8Array(encryptedBuffer), 12);

        // Convert to Blob
        const encryptedBlob = new Blob([combined], { type: 'application/octet-stream' });

        // Convert IV to base64 for logging/debugging
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
 * @param {ArrayBuffer} encryptedDataWithIV - Encrypted file data with IV prepended
 * @param {string} masterKey - Base64-encoded master key
 * @returns {Promise<ArrayBuffer>} Decrypted file data
 */
export async function decryptFile(encryptedDataWithIV, masterKey) {
    try {
        // Convert to Uint8Array
        const dataArray = new Uint8Array(encryptedDataWithIV);

        // Extract IV (first 12 bytes)
        const iv = dataArray.slice(0, 12);

        // Extract encrypted data (remaining bytes)
        const encryptedData = dataArray.slice(12);

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
