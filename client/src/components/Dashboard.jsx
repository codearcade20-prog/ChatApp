import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

const API_BASE = 'https://98d056aa2472be16-122-183-50-63.serveousercontent.com/api';

const Dashboard = ({ user, token, onLogout }) => {
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState([]);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);

  // AI Copilot States
  const [aiEnabled, setAiEnabled] = useState(false);
  const [autocompleteText, setAutocompleteText] = useState('');
  const [aiEnhancing, setAiEnhancing] = useState(false);
  const [originalMessage, setOriginalMessage] = useState('');

  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);

  // 1. Fetch registered contacts on mount
  const fetchContacts = async () => {
    try {
      const response = await axios.get(`${API_BASE}/auth/contacts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setContacts(response.data.data);
      }
    } catch (err) {
      console.error('Fetch contacts error:', err);
    }
  };

  // 2. Fetch direct message history for selected contact
  const fetchChatHistory = async (contactId) => {
    try {
      const response = await axios.get(`${API_BASE}/messages/history`, {
        params: { contactId },
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setHistory(response.data.data);
      }
    } catch (err) {
      console.error('Fetch history error:', err);
    }
  };

  useEffect(() => {
    fetchContacts();

    // 3. Initialize Socket.IO connection
    const socket = io('https://98d056aa2472be16-122-183-50-63.serveousercontent.com');

    socket.on('connect', () => {
      console.log('Socket.io connected to server');
      setSocketConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Socket.io disconnected');
      setSocketConnected(false);
    });

    // Receive enqueued/real-time messages live
    socket.on('new-message', (newMessage) => {
      console.log('Real-time new message received:', newMessage);
      
      // We check if the message belongs to our currently active conversation
      setSelectedContact((currentContact) => {
        if (currentContact && (
          (newMessage.user === user._id && newMessage.recipient === currentContact._id) ||
          (newMessage.user === currentContact._id && newMessage.recipient === user._id)
        )) {
          setHistory((prev) => {
            if (prev.some((msg) => msg._id === newMessage._id)) return prev;
            return [...prev, newMessage];
          });
        }
        return currentContact;
      });
    });

    // Listen for live message status updates enqueued in the worker!
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

    return () => {
      socket.disconnect();
    };
  }, [user._id]);

  // Load chat history when selected contact changes
  useEffect(() => {
    if (selectedContact) {
      fetchChatHistory(selectedContact._id);
      setOriginalMessage('');
      setAutocompleteText('');
      setFormError('');
      setFormSuccess('');
    }
  }, [selectedContact]);

  // Auto-scroll to bottom of chat log when history updates
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  // Auto-grow textarea height based on content text wrap
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  // Debounced Autocomplete/Prediction
  useEffect(() => {
    if (!aiEnabled || !message || message.trim().length < 3) {
      setAutocompleteText('');
      return;
    }

    const delayDebounce = setTimeout(async () => {
      try {
        const response = await axios.post(`${API_BASE}/ai/autocomplete`, { message }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.success && response.data.data.completion) {
          setAutocompleteText(response.data.data.completion);
        } else {
          setAutocompleteText('');
        }
      } catch (err) {
        console.error('Autocomplete prediction error:', err);
        setAutocompleteText('');
      }
    }, 800);

    return () => clearTimeout(delayDebounce);
  }, [message, aiEnabled]);

  // Tab key interceptor for Autocomplete auto-fill
  const handleKeyDown = (e) => {
    if (e.key === 'Tab' && aiEnabled && autocompleteText) {
      e.preventDefault();
      acceptAutocomplete();
    }
  };

  const acceptAutocomplete = () => {
    if (!autocompleteText) return;
    const needsSpace = message && !message.endsWith(' ') && !autocompleteText.startsWith(' ');
    const space = needsSpace ? ' ' : '';
    setMessage((prev) => prev + space + autocompleteText);
    setAutocompleteText('');
  };

  // Handle Toggle AI - automatically enhances and corrects the message upon enabling!
  const handleToggleAi = async (checked) => {
    setAiEnabled(checked);
    if (checked) {
      if (message && message.trim().length > 0) {
        setAiEnhancing(true);
        setFormError('');
        setFormSuccess('');
        try {
          const response = await axios.post(`${API_BASE}/ai/enhance`, { message }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (response.data.success && response.data.data.enhancedMessage) {
            setOriginalMessage(message);
            setMessage(response.data.data.enhancedMessage);
            setFormSuccess('AI automatically corrected and enhanced your message!');
          }
        } catch (err) {
          console.error('Auto-enhance error:', err);
          setFormError(err.response?.data?.error || 'Failed to auto-correct message.');
        } finally {
          setAiEnhancing(false);
        }
      }
    } else {
      setAutocompleteText('');
      setOriginalMessage('');
    }
  };

  const handleRevertMessage = () => {
    if (!originalMessage) return;
    setMessage(originalMessage);
    setOriginalMessage('');
    setFormSuccess('Reverted back to your original message draft.');
  };

  // Handle sending a message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!selectedContact || !message.trim()) return;

    setFormError('');
    setFormSuccess('');
    setFormLoading(true);

    try {
      const response = await axios.post(`${API_BASE}/messages/send-message`, {
        recipientId: selectedContact._id,
        message: message.trim(),
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setMessage('');
        const newMsg = response.data.data;
        
        // Add the newly created pending message to our history instantly
        setHistory((prev) => {
          if (prev.some((msg) => msg._id === newMsg._id)) return prev;
          return [...prev, newMsg];
        });
      }
    } catch (err) {
      console.error('Send message error:', err);
      setFormError(err.response?.data?.error || 'Failed to queue message.');
    } finally {
      setFormLoading(false);
    }
  };

  // Simulate Delivery Webhook
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
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Filter contacts by search query
  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  );

  return (
    <div className={`whatsapp-app-container glass-panel ${selectedContact ? 'has-active-chat' : 'no-active-chat'}`}>
      {/* 1. Left Sidebar: User profile header & contact cards */}
      <aside className="whatsapp-sidebar">
        <header className="whatsapp-sidebar-header">
          <div className="whatsapp-avatar-container">
            {user.photo ? (
              <img src={user.photo} alt="My Avatar" className="whatsapp-avatar" />
            ) : (
              <div className="whatsapp-avatar-fallback">{user.name.charAt(0).toUpperCase()}</div>
            )}
            <div className="whatsapp-user-info">
              <span className="whatsapp-user-name">{user.name}</span>
              <span className="whatsapp-user-phone">{user.phone}</span>
            </div>
          </div>
          <button className="btn-logout" onClick={onLogout} title="Sign Out">
            Logout
          </button>
        </header>

        {/* Sidebar Contacts Search */}
        <div className="whatsapp-sidebar-search">
          <input
            type="text"
            placeholder="Search or start new chat..."
            className="whatsapp-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Contacts List */}
        <div className="whatsapp-contacts-list">
          {filteredContacts.map((contact) => (
            <div
              key={contact._id}
              className={`whatsapp-contact-card ${selectedContact?._id === contact._id ? 'active' : ''}`}
              onClick={() => setSelectedContact(contact)}
            >
              {contact.photo ? (
                <img src={contact.photo} alt={contact.name} className="whatsapp-avatar" />
              ) : (
                <div className="whatsapp-avatar-fallback">{contact.name.charAt(0).toUpperCase()}</div>
              )}
              <div className="whatsapp-contact-details">
                <span className="whatsapp-contact-name">{contact.name}</span>
                <span className="whatsapp-contact-phone">{contact.phone}</span>
              </div>
            </div>
          ))}
          {filteredContacts.length === 0 && (
            <div className="whatsapp-empty-contacts">
              <p>No other registered contacts found.</p>
            </div>
          )}
        </div>
      </aside>

      {/* 2. Right Main Panel: Conversation logs & Composer */}
      <main className="whatsapp-chat-panel">
        {selectedContact ? (
          <>
            {/* Active Contact Header */}
            <header className="whatsapp-chat-header">
              <div className="whatsapp-avatar-container">
                <button 
                  type="button"
                  className="btn-whatsapp-back" 
                  onClick={() => setSelectedContact(null)} 
                  title="Back to contacts list"
                >
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                {selectedContact.photo ? (
                  <img src={selectedContact.photo} alt={selectedContact.name} className="whatsapp-avatar" />
                ) : (
                  <div className="whatsapp-avatar-fallback">{selectedContact.name.charAt(0).toUpperCase()}</div>
                )}
                <div className="whatsapp-user-info">
                  <span className="whatsapp-user-name">{selectedContact.name}</span>
                  <span className="whatsapp-user-phone">{selectedContact.phone}</span>
                </div>
              </div>
              
              <div className="socket-badge">
                <span className={`socket-dot ${socketConnected ? 'connected' : 'disconnected'}`}></span>
                <span>{socketConnected ? 'Online (Real-time)' : 'Connecting...'}</span>
              </div>
            </header>

            {/* Conversation Messages Thread */}
            <div className="whatsapp-chat-messages">
              {history.map((msg) => {
                const isSent = msg.user === user._id;
                return (
                  <div key={msg._id} className={`whatsapp-message-wrapper ${isSent ? 'sent' : 'received'}`}>
                    <div className="whatsapp-message-bubble">
                      <p className="whatsapp-message-text">{msg.message}</p>
                      <div className="whatsapp-message-meta">
                        <span className="whatsapp-message-time">{formatDate(msg.createdAt)}</span>
                        {isSent && (
                          <span className={`whatsapp-status-badge ${msg.status}`} title={msg.status}>
                            {msg.status === 'pending' && '🕒'}
                            {msg.status === 'sent' && '✓'}
                            {msg.status === 'delivered' && '✓✓'}
                            {msg.status === 'failed' && '❌'}
                          </span>
                        )}
                      </div>
                      {/* Webhook simulator trigger directly on the enqueued message bubble */}
                      {isSent && msg.status === 'sent' && (
                        <button
                          type="button"
                          className="btn-simulate-bubble"
                          onClick={() => handleSimulateDelivery(msg._id)}
                          title="Simulate WhatsApp delivered callback"
                        >
                          Simulate Delivery
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {history.length === 0 && (
                <div className="whatsapp-empty-chat-state">
                  <p>Encrypted conversation starting... Say hi to {selectedContact.name}!</p>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Message Composer Footer */}
            <footer className="whatsapp-chat-footer">
              {formError && <div className="alert alert-error" style={{ marginBottom: '0.6rem' }}>{formError}</div>}
              {formSuccess && <div className="alert alert-success" style={{ marginBottom: '0.6rem' }}>{formSuccess}</div>}

              <form onSubmit={handleSendMessage} className="whatsapp-composer-form">
                <div className="whatsapp-composer-container">
                  <textarea
                    ref={textareaRef}
                    className="form-input whatsapp-textarea"
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    required
                    rows={1}
                    disabled={formLoading}
                    style={{
                      resize: 'none',
                      maxHeight: '150px',
                      overflowY: 'auto'
                    }}
                  />
                  <button
                    type="submit"
                    className="btn-whatsapp-send"
                    disabled={formLoading || !message.trim()}
                  >
                    Send
                  </button>
                </div>

                {/* AI Toggle Switch Container */}
                <div className={`ai-toggle-container ${aiEnabled ? 'active' : ''}`} style={{ marginTop: '0.5rem' }}>
                  <span className="ai-toggle-label">
                    ✨ AI Copilot Active {aiEnhancing && <span className="ai-spinner" style={{ marginLeft: '0.5rem', display: 'inline-block' }}></span>}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {originalMessage && (
                      <button
                        type="button"
                        className="btn-ai-revert"
                        onClick={handleRevertMessage}
                        title="Revert to original message draft"
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', borderRadius: '4px', margin: 0 }}
                      >
                        Undo Change
                      </button>
                    )}
                    <label className="ai-switch" title="Toggle AI Autocomplete, and automatically correct/enhance message">
                      <input
                        type="checkbox"
                        checked={aiEnabled}
                        disabled={aiEnhancing}
                        onChange={(e) => handleToggleAi(e.target.checked)}
                      />
                      <span className="ai-slider"></span>
                    </label>
                  </div>
                </div>

                {/* AI Autocomplete Preview Bubble */}
                {aiEnabled && autocompleteText && (
                  <div className="ai-autocomplete-bubble animated-fade-in" style={{ marginTop: '0.5rem' }}>
                    <div className="ai-bubble-header">
                      <span className="ai-bubble-tag">
                        <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24" style={{ animation: 'pulse 1.5s infinite' }}>
                          <path d="M12 2L2 22h20L12 2zm0 3.99L19.53 19H4.47L12 5.99zM13 16h-2v2h2v-2zm0-6h-2v4h2v-4z" />
                        </svg>
                        AI Prediction
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Press Tab to Auto-fill</span>
                    </div>
                    <div className="ai-bubble-text">"{autocompleteText}"</div>
                    <div className="ai-bubble-actions">
                      <button type="button" className="btn-ai-bubble reject" onClick={() => setAutocompleteText('')}>
                        Dismiss
                      </button>
                      <button type="button" className="btn-ai-bubble accept" onClick={acceptAutocomplete}>
                        🔮 Accept & Auto-fill
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </footer>
          </>
        ) : (
          <div className="whatsapp-empty-state">
            <svg width="64" height="64" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24" style={{ opacity: 0.25, marginBottom: '1.5rem' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <h3 style={{ fontWeight: 500, color: '#e2e8f0' }}>WhatsApp Mini Chat</h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.5rem', maxWidth: '360px', lineHeight: 1.5 }}>
              Select a contact from the list on the left to start sending enqueued, encrypted, and AI-assisted real-time messages!
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
