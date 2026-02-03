import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalDocuments: 0,
    recentDocuments: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/api/user/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>Welcome back, {user?.name || 'User'}!</h1>
          <p>Here's your document analysis overview</p>
        </div>
        <Link to="/analyze" className="primary-button">
          Analyze New Document
        </Link>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📄</div>
          <div className="stat-content">
            <h3>{stats.totalDocuments}</h3>
            <p>Total Documents</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⚡</div>
          <div className="stat-content">
            <h3>{stats.recentDocuments?.length || 0}</h3>
            <p>Recent Analyses</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>100%</h3>
            <p>Success Rate</p>
          </div>
        </div>
      </div>

      <div className="recent-section">
        <div className="section-header">
          <h2>Recent Documents</h2>
          <Link to="/history" className="view-all-link">
            View All →
          </Link>
        </div>

        {loading ? (
          <div className="loading-state">Loading...</div>
        ) : stats.recentDocuments?.length > 0 ? (
          <div className="documents-list">
            {stats.recentDocuments.map((doc) => (
              <div key={doc._id} className="document-card">
                <div className="document-info">
                  <h3>{doc.document_type || 'Land Document'}</h3>
                  <p className="document-date">
                    {new Date(doc.processed_at).toLocaleDateString()}
                  </p>
                </div>
                <Link
                  to={`/document/${doc._id}`}
                  className="view-button"
                >
                  View Details
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No documents analyzed yet</p>
            <Link to="/analyze" className="primary-button">
              Analyze Your First Document
            </Link>
          </div>
        )}
      </div>

      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          <Link to="/analyze" className="action-card">
            <div className="action-icon">📝</div>
            <h3>Analyze Document</h3>
            <p>Upload and analyze a new legal document</p>
          </Link>

          <Link to="/history" className="action-card">
            <div className="action-icon">📚</div>
            <h3>View History</h3>
            <p>Browse all your analyzed documents</p>
          </Link>

          <Link to="/profile" className="action-card">
            <div className="action-icon">👤</div>
            <h3>My Profile</h3>
            <p>Manage your account information</p>
          </Link>

          <Link to="/settings" className="action-card">
            <div className="action-icon">⚙️</div>
            <h3>Settings</h3>
            <p>Configure your preferences</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
