import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './History.css';

function History() {
  const { token } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchDocuments();
  }, [filter]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_URL}/api/user/documents?filter=${filter}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_URL}/api/documents/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setDocuments(documents.filter(doc => doc._id !== documentId));
      }
    } catch (error) {
      console.error('Failed to delete document:', error);
    }
  };

  return (
    <div className="history-container">
      <div className="history-header">
        <div>
          <h1>Document History</h1>
          <p>View and manage all your analyzed documents</p>
        </div>
        <Link to="/analyze" className="primary-button">
          Analyze New Document
        </Link>
      </div>

      <div className="history-filters">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Documents
        </button>
        <button
          className={`filter-btn ${filter === 'recent' ? 'active' : ''}`}
          onClick={() => setFilter('recent')}
        >
          Recent
        </button>
        <button
          className={`filter-btn ${filter === 'land_document' ? 'active' : ''}`}
          onClick={() => setFilter('land_document')}
        >
          Land Documents
        </button>
      </div>

      {loading ? (
        <div className="loading-state">Loading documents...</div>
      ) : documents.length > 0 ? (
        <div className="documents-grid">
          {documents.map((doc) => (
            <div key={doc._id} className="document-card">
              <div className="document-header">
                <div className="document-type">
                  <span className="type-icon">📄</span>
                  <span>{doc.document_type || 'Land Document'}</span>
                </div>
                <div className="document-actions">
                  <Link
                    to={`/document/${doc._id}`}
                    className="view-btn"
                  >
                    View
                  </Link>
                  <button
                    onClick={() => handleDelete(doc._id)}
                    className="delete-btn"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="document-body">
                <p className="document-date">
                  {new Date(doc.processed_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
                {doc.simplified_summary && doc.simplified_summary.length > 0 && (
                  <p className="document-preview">
                    {doc.simplified_summary[0].substring(0, 100)}...
                  </p>
                )}
              </div>

              <div className="document-footer">
                <div className="document-stats">
                  {doc.legal_entities?.survey_numbers?.length > 0 && (
                    <span className="stat-badge">
                      {doc.legal_entities.survey_numbers.length} Survey Numbers
                    </span>
                  )}
                  {doc.legal_entities?.risks?.length > 0 && (
                    <span className="stat-badge risk">
                      {doc.legal_entities.risks.length} Risks
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h2>No documents found</h2>
          <p>Start analyzing documents to see them here</p>
          <Link to="/analyze" className="primary-button">
            Analyze Your First Document
          </Link>
        </div>
      )}
    </div>
  );
}

export default History;
