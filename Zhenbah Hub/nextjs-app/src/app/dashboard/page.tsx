'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import ErrorBoundary from '../../components/ErrorBoundary';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import ModelsExplorer from '../../components/ModelsExplorer';
import APIKeys from '../../components/APIKeys';
import Playground from '../../components/Playground';
import Usage from '../../components/Usage';
import Billing from '../../components/Billing';
import Settings from '../../components/Settings';
import './dashboard.css';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('models');
  const [models, setModels] = useState([]);
  const [providers, setProviders] = useState([]);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState('');

  useEffect(() => {
    fetchModels();
    fetchProviders();
    // Check for existing token
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  const fetchModels = async () => {
    try {
      const response = await axios.get('/api/models');
      setModels(response.data.data);
    } catch (error) {
      console.error('Failed to fetch models:', error);
    }
  };

  const fetchProviders = async () => {
    try {
      const response = await axios.get('/api/providers');
      setProviders(response.data.providers);
    } catch (error) {
      console.error('Failed to fetch providers:', error);
    }
  };

  const handleLogout = () => {
    setToken('');
    setUser(null);
    localStorage.removeItem('token');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'models':
        return <ModelsExplorer models={models} providers={providers} />;
      case 'playground':
        return <Playground models={models} />;
      case 'keys':
        return <APIKeys />;
      case 'usage':
        return <Usage />;
      case 'billing':
        return <Billing />;
      case 'settings':
        return <Settings />;
      default:
        return <ModelsExplorer models={models} providers={providers} />;
    }
  };

  // If no token, show login prompt
  if (!token) {
    return (
      <ErrorBoundary>
        <div className="login-prompt">
          <div className="login-card">
            <h1 className="login-title">Zhenbah Hub</h1>
            <p className="login-subtitle">Your AI API Gateway</p>
            <p>Please log in to access the dashboard.</p>
            <a href="/" className="login-link">Go to Login</a>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="dashboard">
        <Header user={user} onLogout={handleLogout} />
        <div className="dashboard-content">
          <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
          <main className="main-content">
            {renderContent()}
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
}