import React, { useState, useEffect } from 'react';
import './DocumentAnalysis.css';
import TypingEffect from './TypingEffect';

function DocumentAnalysis({ result, onReset }) {
  const { simplified_summary, legal_entities } = result;
  const [visibleSections, setVisibleSections] = useState(new Set());
  const [animatedItems, setAnimatedItems] = useState({});

  useEffect(() => {
    // Animate sections appearing one by one
    const sections = [
      'summary',
      'survey_numbers',
      'ownership',
      'land_extents',
      'encumbrances',
      'risks',
      'missing_data',
      'notable_clauses'
    ];

    sections.forEach((section, index) => {
      setTimeout(() => {
        setVisibleSections(prev => new Set([...prev, section]));
      }, index * 200);
    });
  }, []);

  const renderSection = (title, items, type = 'list', sectionKey) => {
    if (!items || (Array.isArray(items) && items.length === 0) || (typeof items === 'object' && Object.keys(items).length === 0)) {
      return null;
    }

    const isVisible = visibleSections.has(sectionKey);

    return (
      <div 
        className={`analysis-section ${isVisible ? 'visible' : ''}`}
        style={{ 
          animationDelay: `${visibleSections.size * 0.1}s`
        }}
      >
        <h3 className="section-title">{title}</h3>
        {type === 'list' && Array.isArray(items) ? (
          <ul className="section-list">
            {items.map((item, index) => {
              const itemKey = `${sectionKey}-${index}`;
              const showItem = animatedItems[itemKey] !== undefined ? animatedItems[itemKey] : false;
              
              if (!animatedItems[itemKey] && isVisible) {
                setTimeout(() => {
                  setAnimatedItems(prev => ({ ...prev, [itemKey]: true }));
                }, index * 100);
              }

              return (
                <li 
                  key={index} 
                  className={showItem ? 'animate-in' : ''}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {item}
                </li>
              );
            })}
          </ul>
        ) : type === 'object' ? (
          <div className="section-object">
            {Object.entries(items).map(([key, value], index) => {
              const itemKey = `${sectionKey}-${key}`;
              const showItem = animatedItems[itemKey] !== undefined ? animatedItems[itemKey] : false;
              
              if (!animatedItems[itemKey] && isVisible) {
                setTimeout(() => {
                  setAnimatedItems(prev => ({ ...prev, [itemKey]: true }));
                }, index * 100);
              }

              return (
                <div 
                  key={key} 
                  className={`object-item ${showItem ? 'animate-in' : ''}`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <strong className="object-key">{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</strong>
                  <span className="object-value">
                    {Array.isArray(value) ? value.join(', ') : value || 'Not specified'}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="section-text">{items}</p>
        )}
      </div>
    );
  };

  return (
    <div className="analysis-container">
      <div className="analysis-header">
        <div className="header-content">
          <h2>Document Analysis Results</h2>
          <div className="result-badge">
            <span className="badge-icon">✓</span>
            <span>Analysis Complete</span>
          </div>
        </div>
        <button onClick={onReset} className="reset-btn">
          Analyze Another Document
        </button>
      </div>

      <div className="analysis-content">
        {simplified_summary && simplified_summary.length > 0 && (
          <div className={`summary-card ${visibleSections.has('summary') ? 'visible' : ''}`}>
            <h2 className="summary-title">Simplified Summary</h2>
            <ul className="summary-list">
              {simplified_summary.map((point, index) => {
                const itemKey = `summary-${index}`;
                const showItem = animatedItems[itemKey] !== undefined ? animatedItems[itemKey] : false;
                
                if (!animatedItems[itemKey] && visibleSections.has('summary')) {
                  setTimeout(() => {
                    setAnimatedItems(prev => ({ ...prev, [itemKey]: true }));
                  }, index * 150);
                }

                return (
                  <li 
                    key={index} 
                    className={`summary-item ${showItem ? 'animate-in' : ''}`}
                    style={{ animationDelay: `${index * 0.15}s` }}
                  >
                    {point}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div className="entities-grid">
          {renderSection(
            'Survey Numbers',
            legal_entities?.survey_numbers,
            'list',
            'survey_numbers'
          )}

          {renderSection(
            'Ownership Details',
            legal_entities?.ownership_details,
            'object',
            'ownership'
          )}

          {renderSection(
            'Land Extents',
            legal_entities?.land_extents,
            'object',
            'land_extents'
          )}

          {renderSection(
            'Encumbrances',
            legal_entities?.encumbrances,
            'list',
            'encumbrances'
          )}

          {legal_entities?.risks && legal_entities.risks.length > 0 && (
            <div className={`analysis-section risk-section ${visibleSections.has('risks') ? 'visible' : ''}`}>
              <h3 className="section-title risk-title">⚠️ Potential Risks</h3>
              <ul className="section-list">
                {legal_entities.risks.map((risk, index) => {
                  const itemKey = `risks-${index}`;
                  const showItem = animatedItems[itemKey] !== undefined ? animatedItems[itemKey] : false;
                  
                  if (!animatedItems[itemKey] && visibleSections.has('risks')) {
                    setTimeout(() => {
                      setAnimatedItems(prev => ({ ...prev, [itemKey]: true }));
                    }, index * 100);
                  }

                  return (
                    <li 
                      key={index} 
                      className={`risk-item ${showItem ? 'animate-in' : ''}`}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      {risk}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {renderSection(
            'Missing Data',
            legal_entities?.missing_data,
            'list',
            'missing_data'
          )}

          {renderSection(
            'Notable Clauses',
            legal_entities?.notable_clauses,
            'list',
            'notable_clauses'
          )}
        </div>
      </div>

      <div className="analysis-footer">
        <p className="footer-note">
          <strong>Note:</strong> This analysis is for informational purposes only
          and does not constitute legal advice. Please consult with a qualified
          legal professional for legal matters.
        </p>
      </div>
    </div>
  );
}

export default DocumentAnalysis;
