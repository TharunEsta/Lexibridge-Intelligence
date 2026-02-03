import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DocumentInput from '../components/DocumentInput';
import DocumentAnalysis from '../components/DocumentAnalysis';
import LoadingAnimation from '../components/LoadingAnimation';
import './Analyze.css';

function Analyze() {
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { token } = useAuth();
  const navigate = useNavigate();

  const handleAnalyze = async (documentText) => {
    setLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_URL}/api/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          text: documentText,
          document_type: 'land_document'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to analyze document');
      }

      const data = await response.json();
      
      // Add a small delay for smooth transition
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setAnalysisResult(data);
    } catch (err) {
      setError(err.message || 'An error occurred while analyzing the document');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setAnalysisResult(null);
    setError(null);
  };

  const handleViewHistory = () => {
    navigate('/history');
  };

  return (
    <div className="analyze-container">
      <LoadingAnimation status={loading} />
      {!analysisResult ? (
        <DocumentInput 
          onAnalyze={handleAnalyze} 
          loading={loading}
          error={error}
        />
      ) : (
        <>
          <DocumentAnalysis 
            result={analysisResult}
            onReset={handleReset}
          />
          <div className="analyze-actions">
            <button onClick={handleReset} className="secondary-button">
              Analyze Another Document
            </button>
            <button onClick={handleViewHistory} className="primary-button">
              View History
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Analyze;
