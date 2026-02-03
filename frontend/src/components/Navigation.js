import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navigation.css';

function Navigation() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  if (!isAuthenticated) {
    return null;
  }

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/dashboard" className="nav-logo">
          <span className="logo-icon">⚖️</span>
          <span className="logo-text">LexiBridge</span>
        </Link>

        <button
          className="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <ul className={`nav-menu ${mobileMenuOpen ? 'active' : ''}`}>
          <li>
            <Link
              to="/dashboard"
              className={isActive('/dashboard') ? 'active' : ''}
              onClick={() => setMobileMenuOpen(false)}
            >
              Dashboard
            </Link>
          </li>
          <li>
            <Link
              to="/analyze"
              className={isActive('/analyze') ? 'active' : ''}
              onClick={() => setMobileMenuOpen(false)}
            >
              Analyze Document
            </Link>
          </li>
          <li>
            <Link
              to="/history"
              className={isActive('/history') ? 'active' : ''}
              onClick={() => setMobileMenuOpen(false)}
            >
              History
            </Link>
          </li>
          <li className="nav-dropdown">
            <span className="nav-user">
              <span className="user-avatar">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
              <span className="user-name">{user?.name || 'User'}</span>
              <span className="dropdown-arrow">▼</span>
            </span>
            <ul className="dropdown-menu">
              <li>
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Profile
                </Link>
              </li>
              <li>
                <Link
                  to="/settings"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Settings
                </Link>
              </li>
              <li>
                <button onClick={handleLogout} className="logout-btn">
                  Logout
                </button>
              </li>
            </ul>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Navigation;
