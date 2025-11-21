// src/components/AdminSidebar.js

import React from 'react';
import './AdminSidebar.css';

const AdminSidebar = ({ activePage, onPageChange }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'users', label: 'User Management', icon: '👥' },
    { id: 'courses', label: 'Courses', icon: '📚' },
    { id: 'content', label: 'Content Moderation', icon: '🛡️' },
    { id: 'reports', label: 'Reports & Analytics', icon: '📈' },
    { id: 'system', label: 'System Settings', icon: '⚙️' }
  ];

  return (
    <aside className="admin-sidebar">
      <nav className="admin-sidebar-nav">
        <ul className="admin-sidebar-menu">
          {menuItems.map((item) => (
            <li key={item.id} className="admin-sidebar-item">
              <button
                className={`admin-sidebar-link ${activePage === item.id ? 'active' : ''}`}
                onClick={() => onPageChange(item.id)}
              >
                <span className="admin-sidebar-icon">{item.icon}</span>
                <span className="admin-sidebar-label">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default AdminSidebar;