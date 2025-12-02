/**
 * Photo Service
 * Handles API calls for photo upload and management
 */

const API_BASE_URL = 'http://localhost:8080';

/**
 * Upload encrypted photo to server
 * @param {Blob} encryptedFile - Encrypted file blob
 * @param {string} filename - Original filename
 * @param {string} username - Owner username
 * @param {string} token - JWT authentication token
 * @param {Function} onProgress - Progress callback (optional)
 * @returns {Promise<Object>} Upload response
 */
export async function uploadPhoto(encryptedFile, filename, username, token, onProgress) {
    try {
        // Create FormData
        const formData = new FormData();
        formData.append('file', encryptedFile, filename);
        formData.append('ownerUsername', username);
        formData.append('contentType', 'image');

        // Create XMLHttpRequest for progress tracking
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            // Track upload progress
            if (onProgress) {
                xhr.upload.addEventListener('progress', (e) => {
                    if (e.lengthComputable) {
                        const percentComplete = (e.loaded / e.total) * 100;
                        onProgress(percentComplete);
                    }
                });
            }

            // Handle completion
            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const response = xhr.responseText ? JSON.parse(xhr.responseText) : {};
                        resolve(response);
                    } catch (e) {
                        // If response is not JSON, just resolve with the text
                        resolve({ message: xhr.responseText || 'Upload successful' });
                    }
                } else {
                    reject(new Error(`Upload failed: ${xhr.statusText}`));
                }
            });

            // Handle errors
            xhr.addEventListener('error', () => {
                reject(new Error('Network error during upload'));
            });

            xhr.addEventListener('abort', () => {
                reject(new Error('Upload cancelled'));
            });

            // Send request
            xhr.open('POST', `${API_BASE_URL}/api/secure/photos/upload`);
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            xhr.send(formData);
        });
    } catch (error) {
        console.error('Upload error:', error);
        throw error;
    }
}

/**
 * List user's photos (for future use)
 * @param {string} token - JWT authentication token
 * @returns {Promise<Array>} List of photos
 */
export async function listPhotos(token) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/secure/photos/list`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to list photos: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('List photos error:', error);
        throw error;
    }
}

/**
 * Delete a photo (for future use)
 * @param {number} photoId - Photo ID to delete
 * @param {string} token - JWT authentication token
 * @returns {Promise<Object>} Delete response
 */
export async function deletePhoto(photoId, token) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/secure/photos/delete/${photoId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to delete photo: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Delete photo error:', error);
        throw error;
    }
}

export default {
    uploadPhoto,
    listPhotos,
    deletePhoto
};
