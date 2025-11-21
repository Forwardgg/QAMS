// src/components/AdminHeader.js
import React from 'react';
import './AdminHeader.css';

const AdminHeader = ({ user, onLogout }) => {
  return (
    <header className="admin-header">
      <div className="admin-header-left">
        <h2 className="admin-header-title">Admin Dashboard</h2>
      </div>
      <div className="admin-header-right">
        <div className="admin-user-info">
          <span className="admin-welcome">Welcome, </span>
          <span className="admin-user-name">{user?.name || user?.email}</span>
        </div>
        <button onClick={onLogout} className="admin-logout-btn">
          Logout
        </button>
      </div>
    </header>
  );
};

export default AdminHeader;