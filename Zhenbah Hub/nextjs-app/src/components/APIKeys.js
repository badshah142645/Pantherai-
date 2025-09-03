import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './APIKeys.css';

function APIKeys() {
  const [keys, setKeys] = useState([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/keys', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setKeys(response.data);
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
    }
  };

  const createKey = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/keys', { name: newKeyName }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewKeyName('');
      setShowCreateForm(false);
      fetchKeys();
    } catch (error) {
      console.error('Failed to create API key:', error);
    }
  };

  const deleteKey = async (keyId) => {
    if (!window.confirm('Are you sure you want to delete this API key?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/keys/${keyId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchKeys();
    } catch (error) {
      console.error('Failed to delete API key:', error);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const maskApiKey = (key) => {
    return `${key.substring(0, 7)}...${key.substring(key.length - 4)}`;
  };

  return (
    <div className="api-keys">
      <div className="page-header">
        <h1 className="page-title">API Keys</h1>
        <p className="page-description">
          Manage your API keys to access Zhenbah Hub's unified AI interface
        </p>
      </div>

      <div className="keys-section">
        <div className="section-header">
          <h2 className="section-title">Your API Keys</h2>
          <button
            onClick={() => setShowCreateForm(true)}
            className="button button-primary"
          >
            + Create New Key
          </button>
        </div>

        {showCreateForm && (
          <div className="create-key-form">
            <form onSubmit={createKey} className="form">
              <div className="form-group">
                <label className="form-label">Key Name</label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g., My App Production Key"
                  className="input"
                  required
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="button button-primary">
                  Create Key
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="button button-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="keys-list">
          {keys.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔑</div>
              <h3>No API keys yet</h3>
              <p>Create your first API key to start using Zhenbah Hub</p>
            </div>
          ) : (
            keys.map(key => (
              <div key={key._id} className="key-card">
                <div className="key-info">
                  <div className="key-details">
                    <h3 className="key-name">{key.name || 'Unnamed Key'}</h3>
                    <div className="key-value">
                      <code className="key-code">{maskApiKey(key.key)}</code>
                      <button
                        onClick={() => copyToClipboard(key.key)}
                        className="copy-btn"
                        title="Copy to clipboard"
                      >
                        📋
                      </button>
                    </div>
                    <div className="key-meta">
                      <span className="key-date">
                        Created: {new Date(key.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="key-actions">
                  <button
                    onClick={() => deleteKey(key._id)}
                    className="button button-danger button-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="usage-info">
        <div className="card">
          <h3 className="card-title">Usage Guidelines</h3>
          <ul className="usage-list">
            <li>• Keep your API keys secure and never share them publicly</li>
            <li>• Use different keys for development and production</li>
            <li>• Rotate keys regularly for better security</li>
            <li>• Monitor your usage to avoid unexpected charges</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default APIKeys;