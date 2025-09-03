import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from './Header';
import Sidebar from './Sidebar';
import ModelsExplorer from './ModelsExplorer';
import APIKeys from './APIKeys';
import Playground from './Playground';
import Usage from './Usage';
import Billing from './Billing';
import Settings from './Settings';
import './Dashboard.css';

function Dashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('models');
  const [models, setModels] = useState([]);
  const [providers, setProviders] = useState([]);

  useEffect(() => {
    fetchModels();
    fetchProviders();
  }, []);

  const fetchModels = async () => {
    try {
      const response = await axios.get('http://localhost:5000/v1/models');
      setModels(response.data.data);
    } catch (error) {
      console.error('Failed to fetch models:', error);
    }
  };

  const fetchProviders = async () => {
    try {
      const response = await axios.get('http://localhost:5000/providers');
      setProviders(response.data.providers);
    } catch (error) {
      console.error('Failed to fetch providers:', error);
    }
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

  return (
    <div className="dashboard">
      <Header user={user} onLogout={onLogout} />
      <div className="dashboard-content">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="main-content">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default Dashboard;