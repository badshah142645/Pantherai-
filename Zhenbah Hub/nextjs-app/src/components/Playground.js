import React, { useState } from 'react';
import axios from 'axios';
import './Playground.css';

function Playground({ models }) {
  const [selectedModel, setSelectedModel] = useState('gpt-4o');
  const [messages, setMessages] = useState([
    { role: 'system', content: 'You are a helpful assistant.' }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [maxTokens, setMaxTokens] = useState(1000);
  const [temperature, setTemperature] = useState(0.7);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    setLoading(true);
    const updatedMessages = [...messages, { role: 'user', content: newMessage }];
    setMessages(updatedMessages);
    setNewMessage('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/v1/chat/completions',
        {
          model: selectedModel,
          messages: updatedMessages,
          max_tokens: maxTokens,
          temperature: temperature
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const assistantMessage = response.data.choices[0].message.content;
      setMessages([...updatedMessages, { role: 'assistant', content: assistantMessage }]);
      setResponse(JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.error('API Error:', error);
      setResponse(JSON.stringify(error.response?.data || error.message, null, 2));
    }
    setLoading(false);
  };

  const clearChat = () => {
    setMessages([{ role: 'system', content: 'You are a helpful assistant.' }]);
    setResponse('');
  };

  return (
    <div className="playground">
      <div className="playground-header">
        <h1 className="page-title">Playground</h1>
        <p className="page-description">
          Test and experiment with AI models in real-time
        </p>
      </div>

      <div className="playground-content">
        <div className="playground-left">
          {/* Model Selection */}
          <div className="card model-settings">
            <h3 className="card-title">Model Settings</h3>
            <div className="settings-grid">
              <div className="setting-group">
                <label className="setting-label">Model</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="select"
                >
                  {models.slice(0, 50).map(model => (
                    <option key={model.id} value={model.id}>
                      {model.id} ({model.owned_by})
                    </option>
                  ))}
                </select>
              </div>
              <div className="setting-group">
                <label className="setting-label">Max Tokens</label>
                <input
                  type="number"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                  className="input"
                  min="1"
                  max="4000"
                />
              </div>
              <div className="setting-group">
                <label className="setting-label">Temperature</label>
                <input
                  type="range"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="range-input"
                  min="0"
                  max="2"
                  step="0.1"
                />
                <span className="range-value">{temperature}</span>
              </div>
            </div>
          </div>

          {/* Chat Interface */}
          <div className="card chat-interface">
            <div className="chat-header">
              <h3 className="card-title">Chat</h3>
              <button onClick={clearChat} className="button button-secondary button-sm">
                Clear Chat
              </button>
            </div>
            <div className="chat-messages">
              {messages.map((message, index) => (
                <div key={index} className={`message message-${message.role}`}>
                  <div className="message-role">{message.role}</div>
                  <div className="message-content">{message.content}</div>
                </div>
              ))}
              {loading && (
                <div className="message message-assistant">
                  <div className="message-role">assistant</div>
                  <div className="message-content">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="chat-input">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="textarea"
                rows="3"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />
              <button
                onClick={sendMessage}
                disabled={loading || !newMessage.trim()}
                className="button button-primary"
              >
                {loading ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>

        <div className="playground-right">
          {/* Raw Response */}
          <div className="card response-viewer">
            <h3 className="card-title">Raw Response</h3>
            <pre className="response-code">
              {response || 'Send a message to see the API response'}
            </pre>
          </div>

          {/* Usage Stats */}
          <div className="card usage-stats">
            <h3 className="card-title">Session Stats</h3>
            <div className="stats">
              <div className="stat-item">
                <span className="stat-label">Messages:</span>
                <span className="stat-value">{messages.length - 1}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Model:</span>
                <span className="stat-value">{selectedModel}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Temperature:</span>
                <span className="stat-value">{temperature}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Playground;