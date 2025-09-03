import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Loading, { SkeletonCard } from './Loading';
import './Settings.css';

function Settings() {
  const [user, setUser] = useState({
    name: '',
    email: '',
    company: '',
    timezone: 'UTC',
    notifications: {
      email: true,
      usage: true,
      billing: true
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [apiSettings, setApiSettings] = useState({
    defaultModel: '',
    maxTokens: 4096,
    temperature: 0.7,
    rateLimit: 100
  });

  useEffect(() => {
    fetchUserSettings();
    fetchAPISettings();
  }, []);

  const fetchUserSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/user/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAPISettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/user/api-settings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setApiSettings(response.data);
    } catch (error) {
      console.error('Failed to fetch API settings:', error);
    }
  };

  const handleUserUpdate = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      await axios.put('http://localhost:5000/user/profile', user, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleAPISettingsUpdate = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      await axios.put('http://localhost:5000/user/api-settings', apiSettings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('API settings updated successfully!');
    } catch (error) {
      console.error('Failed to update API settings:', error);
      alert('Failed to update API settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    const currentPassword = e.target.currentPassword.value;
    const newPassword = e.target.newPassword.value;
    const confirmPassword = e.target.confirmPassword.value;

    if (newPassword !== confirmPassword) {
      alert('New passwords do not match.');
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      await axios.put('http://localhost:5000/user/password', {
        currentPassword,
        newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Password changed successfully!');
      e.target.reset();
    } catch (error) {
      console.error('Failed to change password:', error);
      alert('Failed to change password. Please check your current password.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="settings">
        <div className="settings-header">
          <h1>Settings</h1>
        </div>

        <div className="settings-content">
          <div className="settings-tabs">
            {['Profile', 'API Settings', 'Security', 'Notifications'].map((tab, index) => (
              <div key={index} className="tab-button" style={{width: '120px', height: '44px'}}></div>
            ))}
          </div>

          <div className="settings-panel">
            <div className="settings-form">
              <h2 style={{width: '200px', height: '32px', background: '#333', borderRadius: '6px', marginBottom: '24px'}}></h2>

              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="form-group">
                  <div style={{width: '120px', height: '16px', background: '#333', borderRadius: '4px', marginBottom: '8px'}}></div>
                  <div style={{width: '100%', height: '44px', background: '#333', borderRadius: '6px'}}></div>
                </div>
              ))}

              <div style={{width: '140px', height: '44px', background: '#0ea5e9', borderRadius: '6px', marginTop: '16px'}}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="settings">
      <div className="settings-header">
        <h1>Settings</h1>
      </div>

      <div className="settings-content">
        <div className="settings-tabs">
          <button
            className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
          <button
            className={`tab-button ${activeTab === 'api' ? 'active' : ''}`}
            onClick={() => setActiveTab('api')}
          >
            API Settings
          </button>
          <button
            className={`tab-button ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            Security
          </button>
          <button
            className={`tab-button ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            Notifications
          </button>
        </div>

        <div className="settings-panel">
          {activeTab === 'profile' && (
            <form className="settings-form" onSubmit={handleUserUpdate}>
              <h2>Profile Information</h2>

              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={user.name}
                  onChange={(e) => setUser({...user, name: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={user.email}
                  onChange={(e) => setUser({...user, email: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Company (Optional)</label>
                <input
                  type="text"
                  value={user.company}
                  onChange={(e) => setUser({...user, company: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Timezone</label>
                <select
                  value={user.timezone}
                  onChange={(e) => setUser({...user, timezone: e.target.value})}
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                  <option value="Europe/London">London</option>
                  <option value="Europe/Paris">Paris</option>
                  <option value="Asia/Tokyo">Tokyo</option>
                </select>
              </div>

              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          )}

          {activeTab === 'api' && (
            <form className="settings-form" onSubmit={handleAPISettingsUpdate}>
              <h2>API Settings</h2>

              <div className="form-group">
                <label>Default Model</label>
                <select
                  value={apiSettings.defaultModel}
                  onChange={(e) => setApiSettings({...apiSettings, defaultModel: e.target.value})}
                >
                  <option value="">Select a model</option>
                  <option value="gpt-4">GPT-4</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                  <option value="claude-3">Claude 3</option>
                  <option value="claude-2">Claude 2</option>
                </select>
              </div>

              <div className="form-group">
                <label>Max Tokens</label>
                <input
                  type="number"
                  min="1"
                  max="32768"
                  value={apiSettings.maxTokens}
                  onChange={(e) => setApiSettings({...apiSettings, maxTokens: parseInt(e.target.value)})}
                />
              </div>

              <div className="form-group">
                <label>Temperature (0.0 - 2.0)</label>
                <input
                  type="number"
                  min="0"
                  max="2"
                  step="0.1"
                  value={apiSettings.temperature}
                  onChange={(e) => setApiSettings({...apiSettings, temperature: parseFloat(e.target.value)})}
                />
              </div>

              <div className="form-group">
                <label>Rate Limit (requests/minute)</label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={apiSettings.rateLimit}
                  onChange={(e) => setApiSettings({...apiSettings, rateLimit: parseInt(e.target.value)})}
                />
              </div>

              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </form>
          )}

          {activeTab === 'security' && (
            <form className="settings-form" onSubmit={handlePasswordChange}>
              <h2>Change Password</h2>

              <div className="form-group">
                <label>Current Password</label>
                <input
                  type="password"
                  name="currentPassword"
                  required
                />
              </div>

              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  name="newPassword"
                  required
                />
              </div>

              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                />
              </div>

              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Changing...' : 'Change Password'}
              </button>
            </form>
          )}

          {activeTab === 'notifications' && (
            <div className="settings-form">
              <h2>Notification Preferences</h2>

              <div className="notification-settings">
                <div className="notification-item">
                  <div className="notification-info">
                    <h3>Email Notifications</h3>
                    <p>Receive email updates about your account</p>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={user.notifications.email}
                      onChange={(e) => setUser({
                        ...user,
                        notifications: {...user.notifications, email: e.target.checked}
                      })}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="notification-item">
                  <div className="notification-info">
                    <h3>Usage Alerts</h3>
                    <p>Get notified when approaching usage limits</p>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={user.notifications.usage}
                      onChange={(e) => setUser({
                        ...user,
                        notifications: {...user.notifications, usage: e.target.checked}
                      })}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="notification-item">
                  <div className="notification-info">
                    <h3>Billing Notifications</h3>
                    <p>Receive billing and payment reminders</p>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={user.notifications.billing}
                      onChange={(e) => setUser({
                        ...user,
                        notifications: {...user.notifications, billing: e.target.checked}
                      })}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>

              <button
                type="button"
                className="btn-primary"
                onClick={handleUserUpdate}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Settings;