import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { decryptVerificationKey } from '../utils/crypto';
import { signin, verify, storeToken } from '../services/authService';
import { useAuth } from '../context/AuthContext';

function SignIn() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(''); // Clear error on input change
  };

  const validateForm = () => {
    if (!formData.username || !formData.password) {
      setError('Username and password are required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Step 1: Call /api/auth/signin with username
      console.log('Step 1: Requesting encrypted keys from server...');
      const signinResponse = await signin(formData.username);
      
      if (!signinResponse.enc_verificationkey || !signinResponse.enc_masterkey) {
        throw new Error('Invalid response from server');
      }
      
      // Step 2: Decrypt verification key using password
      console.log('Step 2: Decrypting verification key...');
      let plainVerificationKey;
      try {
        plainVerificationKey = await decryptVerificationKey(
          signinResponse.enc_verificationkey,
          formData.password
        );
      } catch (decryptError) {
        throw new Error('Invalid password. Please try again.');
      }
      
      // Step 2.5: Decrypt master key using password (for file encryption)
      console.log('Step 2.5: Decrypting master key...');
      let plainMasterKey;
      try {
        plainMasterKey = await decryptVerificationKey(
          signinResponse.enc_masterkey,
          formData.password
        );
      } catch (decryptError) {
        throw new Error('Invalid password. Please try again.');
      }
      
      // Step 3: Call /api/auth/verify with plain verification key
      console.log('Step 3: Verifying with decrypted key...');
      const verifyResponse = await verify(formData.username, plainVerificationKey);
      
      if (!verifyResponse.success || !verifyResponse.token) {
        throw new Error('Verification failed');
      }
      
      // Step 4: Store JWT token
      console.log('Authentication successful! Storing token...');
      storeToken(verifyResponse.token);
      
      // Step 5: Store master key and username in AuthContext
      login(formData.username, plainMasterKey, verifyResponse.token);
      
      // Success! Redirect to dashboard
      navigate('/dashboard');
      
    } catch (err) {
      console.error('Sign in error:', err);
      setError(err.message || 'Failed to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card card">
          {/* Header */}
          <div className="auth-header">
            <h1 className="auth-title">
              Welcome Back
            </h1>
            <p className="auth-subtitle">
              Sign in to access your encrypted photos
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            {/* Username */}
            <div className="form-group">
              <label htmlFor="username" className="form-label">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter your username"
                disabled={loading}
                autoComplete="username"
              />
            </div>

            {/* Password */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter your password"
                disabled={loading}
                autoComplete="current-password"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="error-message">
                ⚠️ {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="auth-footer">
            <p className="auth-footer-text">
              Don't have an account?{' '}
              <Link to="/signup" className="auth-link">
                Sign Up
              </Link>
            </p>
          </div>

          {/* Security Note */}
          <div className="security-note">
            <p>🔒 End-to-end encrypted. Zero-knowledge authentication.</p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="auth-back">
          <Link to="/" className="auth-link">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default SignIn;
