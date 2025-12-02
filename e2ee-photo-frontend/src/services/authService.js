/**
 * Authentication Service
 * Handles all API calls to the backend authentication endpoints
 */

const API_BASE_URL = 'http://localhost:8080';

/**
 * Sign up a new user
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} API response
 */
export async function signup(userData) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        });

        const data = await response.json();

        if (!response.ok) {
            // Handle error response - backend sends { success: false, message: "..." }
            throw new Error(data.message || data.error || `Signup failed: ${response.statusText}`);
        }

        return data;
    } catch (error) {
        console.error('Signup error:', error);
        throw error;
    }
}

/**
 * Sign in - Step 1: Get encrypted keys from server
 * @param {string} username - Username
 * @returns {Promise<Object>} { enc_masterkey, enc_verificationkey }
 */
export async function signin(username) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/signin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username,
                verificationKey: '' // Always empty for initial signin
            })
        });

        const data = await response.json();

        if (!response.ok) {
            // Handle error response - backend sends { success: false, message: "..." }
            throw new Error(data.message || data.error || `Sign in failed: ${response.statusText}`);
        }

        return data;
    } catch (error) {
        console.error('Sign in error:', error);
        throw error;
    }
}

/**
 * Verify - Step 2: Verify with decrypted verification key
 * @param {string} username - Username
 * @param {string} verificationKey - Plain verification key
 * @returns {Promise<Object>} { success, token }
 */
export async function verify(username, verificationKey) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username,
                verificationKey
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || data.error || `Verification failed: ${response.statusText}`);
        }

        return data;
    } catch (error) {
        console.error('Verification error:', error);
        throw error;
    }
}

/**
 * Store JWT token in localStorage
 * @param {string} token - JWT token
 */
export function storeToken(token) {
    localStorage.setItem('auth_token', token);
}

/**
 * Get stored JWT token
 * @returns {string|null} JWT token or null
 */
export function getToken() {
    return localStorage.getItem('auth_token');
}

/**
 * Remove token (logout)
 */
export function clearToken() {
    localStorage.removeItem('auth_token');
}

/**
 * Check if user is authenticated
 * @returns {boolean}
 */
export function isAuthenticated() {
    return !!getToken();
}

export default {
    signup,
    signin,
    verify,
    storeToken,
    getToken,
    clearToken,
    isAuthenticated
};
