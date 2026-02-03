import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './Settings.css';

function Settings() {
  const { user, token } = useAuth();
  const [settings, setSettings] = useState({
    notifications: true,
    emailUpdates: true,
    darkMode: false,
    language: 'en',
    autoSave: true,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    // Load saved settings
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings({
      ...settings,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Save to localStorage
      localStorage.setItem('userSettings', JSON.stringify(settings));

      // Optionally save to backend
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
      await fetch(`${API_URL}/api/user/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });

      setMessage({ type: 'success', text: 'Settings saved successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = () => {
    // Password change functionality
    alert('Password change feature coming soon!');
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>Settings</h1>
        <p>Manage your preferences and account settings</p>
      </div>

      <div className="settings-content">
        <form onSubmit={handleSubmit} className="settings-form">
          {message.text && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}

          <div className="settings-section">
            <h2>Notifications</h2>
            <div className="setting-item">
              <div className="setting-info">
                <label htmlFor="notifications">Enable Notifications</label>
                <p>Receive notifications about document analysis updates</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  id="notifications"
                  name="notifications"
                  checked={settings.notifications}
                  onChange={handleChange}
                />
                <span className="slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <label htmlFor="emailUpdates">Email Updates</label>
                <p>Receive email notifications for important updates</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  id="emailUpdates"
                  name="emailUpdates"
                  checked={settings.emailUpdates}
                  onChange={handleChange}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>

          <div className="settings-section">
            <h2>Preferences</h2>
            <div className="setting-item">
              <div className="setting-info">
                <label htmlFor="darkMode">Dark Mode</label>
                <p>Switch to dark theme (coming soon)</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  id="darkMode"
                  name="darkMode"
                  checked={settings.darkMode}
                  onChange={handleChange}
                  disabled
                />
                <span className="slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <label htmlFor="language">Language</label>
                <p>Select your preferred language</p>
              </div>
              <select
                id="language"
                name="language"
                value={settings.language}
                onChange={handleChange}
                className="setting-select"
              >
                <option value="en">English</option>
                <option value="te">Telugu</option>
                <option value="hi">Hindi</option>
              </select>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <label htmlFor="autoSave">Auto Save</label>
                <p>Automatically save document analysis results</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  id="autoSave"
                  name="autoSave"
                  checked={settings.autoSave}
                  onChange={handleChange}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>

          <div className="settings-section">
            <h2>Security</h2>
            <div className="setting-item">
              <div className="setting-info">
                <label>Password</label>
                <p>Change your account password</p>
              </div>
              <button
                type="button"
                onClick={handleChangePassword}
                className="secondary-button"
              >
                Change Password
              </button>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="save-button"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Settings;
