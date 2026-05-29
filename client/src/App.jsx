import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Dashboard from './components/Dashboard';

const API_URL = 'https://fb0e20b7407c96bc-122-183-50-183.serveousercontent.com/api/auth';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));
  
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Configure axios defaults when token changes
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  const handleLogout = () => {
    setToken('');
    setUser(null);
    setError('');
    setSuccess('Logged out successfully.');
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isLoginTab) {
        // Login API Call
        const response = await axios.post(`${API_URL}/login`, { email, password });
        if (response.data.success) {
          const { token, ...userData } = response.data.data;
          setToken(token);
          setUser(userData);
          setSuccess('Welcome back!');
        }
      } else {
        // Register API Call
        const response = await axios.post(`${API_URL}/register`, { name, email, password });
        if (response.data.success) {
          const { token, ...userData } = response.data.data;
          setToken(token);
          setUser(userData);
          setSuccess('Account created successfully!');
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(err.response?.data?.error || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (token && user) {
    return <Dashboard user={user} token={token} onLogout={handleLogout} />;
  }

  return (
    <div className="glass-panel auth-container">
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 className="title-glow" style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>WhatsApp Mini</h1>
        <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Async Message Delivery Automation Platform</p>
      </div>

      <div className="auth-tabs">
        <button
          className={`auth-tab ${isLoginTab ? 'active' : ''}`}
          onClick={() => { setIsLoginTab(true); setError(''); setSuccess(''); }}
        >
          Sign In
        </button>
        <button
          className={`auth-tab ${!isLoginTab ? 'active' : ''}`}
          onClick={() => { setIsLoginTab(false); setError(''); setSuccess(''); }}
        >
          Register
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={handleAuthSubmit}>
        {!isLoginTab && (
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input
            type="email"
            className="form-input"
            placeholder="johndoe@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <input
            type="password"
            className="form-input"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }} disabled={loading}>
          {loading ? 'Processing...' : isLoginTab ? 'Sign In' : 'Create Account'}
        </button>
      </form>

      <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.85rem', color: '#64748b', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '1.2rem' }}>
        Developed by <a href="https://codearcade20.vercel.app" target="_blank" rel="noopener noreferrer" style={{ color: '#25d366', textDecoration: 'none', fontWeight: 600 }}>codearcade</a>
      </div>
    </div>
  );
}

export default App;
