import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Dashboard from './components/Dashboard';

const API_URL = 'https://98d056aa2472be16-122-183-50-63.serveousercontent.com/api/auth';

function App() {
  const [token, setToken] = useState(() => {
    const savedToken = localStorage.getItem('token') || '';
    if (savedToken) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
    }
    return savedToken;
  });
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));
  
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [photo, setPhoto] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1.5 * 1024 * 1024) {
        setError('Profile picture must be under 1.5 MB');
        e.target.value = null;
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

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

  // Global Axios interceptor to auto-logout on 401 Unauthorized (e.g. stale tokens after server reset)
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          handleLogout();
        }
        return Promise.reject(error);
      }
    );
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

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
          const { token: userToken, ...userData } = response.data.data;
          axios.defaults.headers.common['Authorization'] = `Bearer ${userToken}`;
          setToken(userToken);
          setUser(userData);
          setSuccess('Welcome back!');
        }
      } else {
        // Register API Call
        if (phone.length !== 10) {
          return setError('Phone number must be exactly 10 digits');
        }
        const response = await axios.post(`${API_URL}/register`, { name, email, password, phone, photo });
        if (response.data.success) {
          const { token: userToken, ...userData } = response.data.data;
          axios.defaults.headers.common['Authorization'] = `Bearer ${userToken}`;
          setToken(userToken);
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
          onClick={() => { setIsLoginTab(true); setError(''); setSuccess(''); setPhone(''); setPhoto(''); }}
        >
          Sign In
        </button>
        <button
          className={`auth-tab ${!isLoginTab ? 'active' : ''}`}
          onClick={() => { setIsLoginTab(false); setError(''); setSuccess(''); setPhone(''); setPhoto(''); }}
        >
          Register
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={handleAuthSubmit}>
        {!isLoginTab && (
          <>
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

            <div className="form-group">
              <label className="form-label">Phone Number (Mandatory - 10 digits)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Profile Photo (Optional)</label>
              <input
                type="file"
                className="form-input"
                accept="image/*"
                onChange={handlePhotoChange}
                style={{ padding: '0.45rem' }}
              />
              {photo && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.5rem' }}>
                  <img
                    src={photo}
                    alt="Preview"
                    style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #25d366' }}
                  />
                </div>
              )}
            </div>
          </>
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
