import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

const API_BASE = 'https://fb0e20b7407c96bc-122-183-50-183.serveousercontent.com/api';

const Dashboard = ({ user, token, onLogout }) => {
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState([]);
  
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);

  // 1. Fetch message history on mount
  const fetchHistory = async () => {
    try {
      const response = await axios.get(`${API_BASE}/messages/history`);
      if (response.data.success) {
        setHistory(response.data.data);
      }
    } catch (err) {
      console.error('Fetch history error:', err);
    }
  };

  useEffect(() => {
    fetchHistory();

    // 2. Initialize Socket.IO connection
    const socket = io('https://fb0e20b7407c96bc-122-183-50-183.serveousercontent.com');

    socket.on('connect', () => {
      console.log('Socket.io connected to server');
      setSocketConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Socket.io disconnected');
      setSocketConnected(false);
    });

    // 3. Listen for live message status updates!
    socket.on('status-updated', (data) => {
      console.log('Real-time update received:', data);
      const { messageId, status } = data;
      
      // Update message status in our local state instantly
      setHistory((prevHistory) =>
        prevHistory.map((msg) =>
          msg._id === messageId ? { ...msg, status } : msg
        )
      );
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, []);

  // 4. Handle sending a message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setFormLoading(true);

    try {
      const response = await axios.post(`${API_BASE}/messages/send-message`, {
        phone,
        message,
      });

      if (response.data.success) {
        setFormSuccess('Message successfully added to the processing queue!');
        setPhone('');
        setMessage('');
        
        // Add the newly created pending message to the top of our list
        const newMsg = response.data.data;
        setHistory((prev) => [newMsg, ...prev]);
      }
    } catch (err) {
      console.error('Send message error:', err);
      setFormError(err.response?.data?.error || 'Failed to queue message.');
    } finally {
      setFormLoading(false);
    }
  };

  // 5. Simulate Delivery Webhook
  const handleSimulateDelivery = async (messageId) => {
    try {
      await axios.post(`${API_BASE}/webhook`, {
        messageId,
        status: 'delivered',
      });
      // The socket event will trigger automatically and update our state
    } catch (err) {
      console.error('Webhook simulation error:', err);
      alert('Failed to simulate delivery webhook.');
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + d.toLocaleDateString();
  };

  return (
    <div className="dashboard-container">
      {/* Header Panel */}
      <header className="glass-panel dashboard-header">
        <div>
          <h2 className="title-glow" style={{ fontSize: '1.6rem' }}>WhatsApp Automation</h2>
          <div className="socket-badge" style={{ marginTop: '0.4rem' }}>
            <span className={`socket-dot ${socketConnected ? 'connected' : 'disconnected'}`}></span>
            <span>{socketConnected ? 'Sockets Connected' : 'Sockets Offline'}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div className="user-badge">
            <div className="user-avatar">{user.name.charAt(0).toUpperCase()}</div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{user.name}</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{user.email}</div>
            </div>
          </div>
          <button className="btn-logout" onClick={onLogout}>Logout</button>
        </div>
      </header>

      {/* Grid: Left (Send Message Form) | Right (Message History Table) */}
      <div className="dashboard-grid">
        {/* Form Panel */}
        <section className="glass-panel dashboard-panel">
          <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '0.5rem', color: '#fff' }}>
            Send Message
          </h3>

          {formError && <div className="alert alert-error">{formError}</div>}
          {formSuccess && <div className="alert alert-success">{formSuccess}</div>}

          <form onSubmit={handleSendMessage}>
            <div className="form-group">
              <label className="form-label">Recipient Phone Number</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. 9876543210 or +919876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                disabled={formLoading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Message Content</label>
              <textarea
                className="form-input"
                placeholder="Type your automated WhatsApp message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={5}
                disabled={formLoading}
                style={{ resize: 'vertical', minHeight: '100px' }}
              />
            </div>

            <button type="submit" className="btn-primary" disabled={formLoading} style={{ marginTop: '0.5rem' }}>
              {formLoading ? 'Queueing...' : 'Add to Queue'}
            </button>
          </form>
        </section>

        {/* History Table Panel */}
        <section className="glass-panel dashboard-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '0.5rem' }}>
            <h3 style={{ color: '#fff', flex: 1, textAlign: 'left' }}>Message Queue & History</h3>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Real-time updates enabled</span>
          </div>

          <div className="table-container">
            {history.length === 0 ? (
              <div className="empty-state">
                <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ marginBottom: '1rem', opacity: 0.4 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p>No messages sent yet.</p>
                <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Automated messages you queue will appear here live.</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Recipient</th>
                    <th>Message</th>
                    <th>Status</th>
                    <th>Sent At</th>
                    <th>Simulator Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((msg) => (
                    <tr key={msg._id}>
                      <td style={{ fontWeight: 600 }}>{msg.phone}</td>
                      <td style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={msg.message}>
                        {msg.message}
                      </td>
                      <td>
                        <span className={`status-badge ${msg.status}`}>
                          {msg.status}
                        </span>
                      </td>
                      <td className="timestamp">{formatDate(msg.createdAt)}</td>
                      <td>
                        <button
                          className="btn-simulate"
                          disabled={msg.status !== 'sent'}
                          onClick={() => handleSimulateDelivery(msg._id)}
                          title={msg.status === 'sent' ? 'Simulate delivery callback' : msg.status === 'delivered' ? 'Already delivered' : 'Wait for message to be sent by queue'}
                        >
                          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {msg.status === 'delivered' ? 'Delivered' : 'Simulate Delivery'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>

      <footer style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.85rem', color: '#64748b' }}>
        Developed by <a href="https://codearcade20.vercel.app" target="_blank" rel="noopener noreferrer" style={{ color: '#25d366', textDecoration: 'none', fontWeight: 600 }}>codearcade</a>
      </footer>
    </div>
  );
};

export default Dashboard;
