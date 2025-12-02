import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { generateUserKeys, encryptUserKeys } from '../utils/crypto';
import { signup } from '../services/authService';

function SignUp() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
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
    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('All fields are required');
      return false;
    }

    if (formData.username.length < 3) {
      setError('Username must be at least 3 characters');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
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
      // Step 1: Generate random master key and verification key
      console.log('Generating user keys...');
      const { masterKey, verificationKey } = generateUserKeys();
      
      // Step 2: Encrypt both keys with password using PBKDF2 + AES-256-GCM
      console.log('Encrypting keys with password...');
      const { enc_masterkey, enc_verificationkey } = await encryptUserKeys(
        masterKey,
        verificationKey,
        formData.password
      );
      
      // Step 3: Prepare signup data
      const signupData = {
        username: formData.username,
        email: formData.email,
        enc_masterkey,
        enc_verificationkey,
        plain_verificationkey: verificationKey // Send plain verification key to backend
      };
      
      // Step 4: Send to backend
      console.log('Sending signup request to backend...');
      const response = await signup(signupData);
      
      // Success! Redirect to sign in
      console.log('Signup successful!', response);
      alert('Account created successfully! Please sign in.');
      navigate('/signin');
      
    } catch (err) {
      console.error('Signup error:', err);
      
      // Parse error message from response
      let errorMessage = 'Failed to create account. Please try again.';
      
      if (err.message) {
        // Check for specific error messages
        if (err.message.includes('Username already exists') || err.message.includes('already exists')) {
          errorMessage = 'This username is already taken. Please choose a different username.';
        } else if (err.message.includes('email')) {
          errorMessage = 'This email is already registered. Please use a different email.';
        } else if (err.message.includes('network') || err.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
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
              Create Account
            </h1>
            <p className="auth-subtitle">
              Join Protected Pixels - Your photos, encrypted and secure
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
                placeholder="Choose a username"
                disabled={loading}
                autoComplete="username"
              />
            </div>

            {/* Email */}
            <div className="form-group">
              <label htmlFor="email" className="form-label">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="form-input"
                placeholder="your.email@example.com"
                disabled={loading}
                autoComplete="email"
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
                placeholder="At least 8 characters"
                disabled={loading}
                autoComplete="new-password"
              />
            </div>

            {/* Confirm Password */}
            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="form-input"
                placeholder="Re-enter your password"
                disabled={loading}
                autoComplete="new-password"
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
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="auth-footer">
            <p className="auth-footer-text">
              Already have an account?{' '}
              <Link to="/signin" className="auth-link">
                Sign In
              </Link>
            </p>
          </div>

          {/* Security Note */}
          <div className="security-note">
            <p>🔒 Your password encrypts your keys locally. We never see it.</p>
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

export default SignUp;
