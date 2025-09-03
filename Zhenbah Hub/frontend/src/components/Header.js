import React from 'react';
import './Header.css';

function Header({ user, onLogout }) {
  return (
    <header className="header">
      <div className="header-container">
        <div className="logo-section">
          <img src="/logo.svg" alt="Zhenbah Hub" className="logo" />
          <span className="brand">Zhenbah Hub</span>
        </div>
        <nav className="nav-menu">
          <a href="#models" className="nav-link">Models</a>
          <a href="#playground" className="nav-link">Playground</a>
          <a href="#docs" className="nav-link">Docs</a>
          <a href="#pricing" className="nav-link">Pricing</a>
        </nav>
        <div className="user-section">
          <div className="credits">
            Credits: $10.00
          </div>
          <div className="user-menu">
            <span className="username">{user?.email}</span>
            <button onClick={onLogout} className="logout-btn">Logout</button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;