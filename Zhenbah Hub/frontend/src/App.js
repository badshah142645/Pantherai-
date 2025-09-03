import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ErrorBoundary from './components/ErrorBoundary';
import Dashboard from './components/Dashboard';
import './App.css';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      const res = await axios.post('http://localhost:5000/auth/login', { email, password });
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('token', res.data.token);
    } catch (error) {
      alert('Login failed: ' + (error.response?.data?.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    try {
      setLoading(true);
      const res = await axios.post('http://localhost:5000/auth/register', { email, password });
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('token', res.data.token);
    } catch (error) {
      alert('Registration failed: ' + (error.response?.data?.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  useEffect(() => {
    // Check if token exists and is valid on app load
    if (token) {
      // You could add token validation here
    }
  }, [token]);

  if (!token) {
    return (
      <ErrorBoundary>
        <div className="App">
          <div className="login-container">
            <div className="login-card">
              <h1 className="login-title">Zhenbah Hub</h1>
              <p className="login-subtitle">Your AI API Gateway</p>

              <div className="login-form">
                <div className="form-group">
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="login-input"
                  />
                </div>
                <div className="form-group">
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="login-input"
                  />
                </div>

                <div className="login-actions">
                  <button
                    onClick={handleLogin}
                    className="btn-primary"
                    disabled={loading}
                  >
                    {loading ? 'Logging in...' : 'Login'}
                  </button>
                  <button
                    onClick={handleRegister}
                    className="btn-secondary"
                    disabled={loading}
                  >
                    {loading ? 'Registering...' : 'Register'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <Dashboard user={user} onLogout={handleLogout} />
    </ErrorBoundary>
  );
}

export default App;
