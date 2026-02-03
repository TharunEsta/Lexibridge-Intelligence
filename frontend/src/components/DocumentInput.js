import React, { useState, useEffect } from 'react';
import './DocumentInput.css';

function DocumentInput({ onAnalyze, loading, error }) {
  const [text, setText] = useState('');
  const [isPasteMode, setIsPasteMode] = useState(true);
  const [charCount, setCharCount] = useState(0);
  const [wordCount, setWordCount] = useState(0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim()) {
      onAnalyze(text.trim());
    }
  };

  useEffect(() => {
    setCharCount(text.length);
    setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0);
  }, [text]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setText(event.target.result);
        setIsPasteMode(true);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="document-input-container">
      <div className="input-card">
        <h2 className="card-title">Upload or Paste Document</h2>
        <p className="card-description">
          Enter your land or property document text below. Our AI will analyze it
          and provide a simplified interpretation.
        </p>

        <div className="mode-toggle">
          <button
            className={`mode-btn ${isPasteMode ? 'active' : ''}`}
            onClick={() => setIsPasteMode(true)}
          >
            Paste Text
          </button>
          <button
            className={`mode-btn ${!isPasteMode ? 'active' : ''}`}
            onClick={() => setIsPasteMode(false)}
          >
            Upload File
          </button>
        </div>

        {isPasteMode ? (
          <form onSubmit={handleSubmit} className="input-form">
            <div className="textarea-wrapper">
              <textarea
                className="document-textarea"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste your document text here...&#10;&#10;Example:&#10;This deed of sale is executed between...&#10;Survey Number: 123/4&#10;Area: 2.5 acres..."
                rows={15}
                disabled={loading}
              />
              <div className="text-stats">
                <span className="stat-item">
                  <strong>{charCount}</strong> characters
                </span>
                <span className="stat-item">
                  <strong>{wordCount}</strong> words
                </span>
              </div>
            </div>
            <div className="file-upload-section">
              <label className="file-upload-label">
                <input
                  type="file"
                  accept=".txt,.doc,.docx"
                  onChange={handleFileUpload}
                  className="file-input"
                  disabled={loading}
                />
                <span className="file-upload-text">Or upload a text file</span>
              </label>
            </div>
            <button
              type="submit"
              className="analyze-btn"
              disabled={loading || !text.trim()}
            >
              {loading ? 'Analyzing...' : 'Analyze Document'}
            </button>
          </form>
        ) : (
          <div className="upload-section">
            <label className="upload-area">
              <input
                type="file"
                accept=".txt,.doc,.docx"
                onChange={handleFileUpload}
                className="file-input"
                disabled={loading}
              />
              <div className="upload-content">
                <svg
                  className="upload-icon"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <p className="upload-text">Click to upload or drag and drop</p>
                <p className="upload-hint">TXT, DOC, DOCX files supported</p>
              </div>
            </label>
            {text && (
              <div className="preview-section">
                <h3>Preview:</h3>
                <textarea
                  className="document-textarea preview"
                  value={text}
                  readOnly
                  rows={10}
                />
                <button
                  onClick={handleSubmit}
                  className="analyze-btn"
                  disabled={loading}
                >
                  {loading ? 'Analyzing...' : 'Analyze Document'}
                </button>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="error-message">
            <strong>Error:</strong> {error}
          </div>
        )}

        <div className="disclaimer">
          <p>
            <strong>Disclaimer:</strong> LexiBridge Intelligence is a legal-awareness
            tool and does not provide legal advice. Always consult with a qualified
            legal professional for legal matters.
          </p>
        </div>
      </div>
    </div>
  );
}

export default DocumentInput;
