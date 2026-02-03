import React from 'react';
import './Header.css';

function Header() {
  return (
    <header className="header">
      <div className="header-content">
        <h1 className="header-title">LexiBridge Intelligence</h1>
        <p className="header-subtitle">
          AI-Assisted Legal Document Interpretation System
        </p>
        <p className="header-description">
          Simplify complex land and property documents with AI-powered analysis
        </p>
      </div>
    </header>
  );
}

export default Header;
