import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import './index.css'
import SignUp from './pages/SignUp'
import SignIn from './pages/SignIn'
import Dashboard from './pages/Dashboard'
import { AuthProvider } from './context/AuthContext'

// Landing Page Component
function LandingPage() {
  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="navbar">
        <div className="navbar-content">
          <Link to="/" className="navbar-logo">
            <span className="gradient-text">🔒 Protected Pixels</span>
          </Link>
          
          <ul className="navbar-nav">
            <li><a href="#features" className="navbar-link">Features</a></li>
            <li><a href="#" className="navbar-link">Pricing</a></li>
            <li><a href="#" className="navbar-link">Docs</a></li>
            <li>
              <a 
                href="https://github.com/parvthummar/Protected-Pixels" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="navbar-link"
              >
                GitHub
              </a>
            </li>
          </ul>
          
          <div className="navbar-actions">
            <Link to="/signin" className="btn btn-ghost">Sign In</Link>
            <Link to="/signup" className="btn btn-primary">Sign Up</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-background">
          <div className="floating-shape"></div>
          <div className="floating-shape"></div>
          <div className="floating-shape"></div>
          <div className="floating-shape"></div>
        </div>
        
        <div className="hero-content">
          <div className="hero-badge">
            🔐 Now in public beta — Get early access
          </div>
          
          <h1 className="hero-title">
            Share your photos <span className="gradient-text">securely</span> with end-to-end encryption
          </h1>
          
          <p className="hero-subtitle">
            <strong>Protect your pixels.</strong> The modern photo sharing platform with zero-knowledge encryption. 
            Fast, secure, and beautifully simple.
          </p>
          
          <div className="hero-cta">
            <Link to="/signup" className="btn btn-primary">
              Get Started Free →
            </Link>
            <a href="#demo" className="btn btn-secondary">
              ▶ Watch Demo
            </a>
          </div>
          
          {/* Stats */}
          <div className="stats">
            <div className="stat-item">
              <span className="stat-value">1M+</span>
              <span className="stat-label">Photos Encrypted</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">10K+</span>
              <span className="stat-label">Active Users</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">100%</span>
              <span className="stat-label">Private & Secure</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features">
        <div className="container">
          <div className="features-header">
            <h2 className="features-title">
              Everything you need to <span className="gradient-text">stay secure</span>
            </h2>
            <p className="features-description">
              Powerful features designed for those who value privacy and security above all else.
            </p>
          </div>
          
          <div className="features-grid">
            {/* Feature 1 - End-to-End Encryption */}
            <div className="card feature-card">
              <div className="feature-icon">🔒</div>
              <h3 className="feature-title">End-to-End Encrypted</h3>
              <p className="feature-description">
                Your photos are encrypted before they leave your device. Only you have access. 
                Not even we can see your images.
              </p>
            </div>
            
            {/* Feature 2 - Zero-Knowledge */}
            <div className="card feature-card">
              <div className="feature-icon">🛡️</div>
              <h3 className="feature-title">Zero-Knowledge Architecture</h3>
              <p className="feature-description">
                Built on zero-knowledge principles. We never have access to your encryption keys 
                or unencrypted data.
              </p>
            </div>
            
            {/* Feature 3 - Fast Upload */}
            <div className="card feature-card">
              <div className="feature-icon">⚡</div>
              <h3 className="feature-title">Lightning Fast</h3>
              <p className="feature-description">
                Upload photos in milliseconds with our optimized infrastructure. Security doesn't 
                mean sacrificing speed.
              </p>
            </div>
            
            {/* Feature 4 - Cross Platform */}
            <div className="card feature-card">
              <div className="feature-icon">☁️</div>
              <h3 className="feature-title">Access Anywhere</h3>
              <p className="feature-description">
                Securely access your encrypted photos from any device. Works seamlessly across 
                web, mobile, and desktop.
              </p>
            </div>
            
            {/* Feature 5 - Privacy First */}
            <div className="card feature-card">
              <div className="feature-icon">👁️</div>
              <h3 className="feature-title">Privacy by Design</h3>
              <p className="feature-description">
                No tracking, no analytics, no data mining. Your privacy is our top priority, 
                not our product.
              </p>
            </div>
            
            {/* Feature 6 - Open Source */}
            <div className="card feature-card">
              <div className="feature-icon">🌐</div>
              <h3 className="feature-title">Open Source</h3>
              <p className="feature-description">
                Fully open-source and auditable. Verify our security claims yourself. 
                Transparency builds trust.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-brand">Protected Pixels</div>
          
          <div className="footer-links">
            <a href="#features" className="footer-link">Features</a>
            <a href="#" className="footer-link">Privacy Policy</a>
            <a href="#" className="footer-link">Terms of Service</a>
            <a 
              href="https://github.com/parvthummar/Protected-Pixels" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="footer-link"
            >
              GitHub
            </a>
            <a href="#" className="footer-link">Documentation</a>
          </div>
          
          <p className="footer-text">
            © 2025 Protected Pixels. Built with privacy in mind. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

// Main App Component with Router
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
