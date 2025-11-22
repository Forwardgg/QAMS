// frontend/src/components/InstructorSidebar.js
import React, { useState } from 'react';
import './Sidebar.css';

const InstructorSidebar = ({ activePage, onPageChange }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'courses', label: 'courses', icon: '👥' },
    { id: 'CO', label: 'CO Management', icon: '📚' },
    { id: 'Question Paper', label: 'Question Papers', icon: '🛡️' },
    { id: 'Question', label: 'UQuestion Management', icon: '📈' },
    { id: 'Moderation', label: 'Moderation', icon: '⚙️' }
  ];

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <aside className={`admin-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Toggle Button with Hamburger Icon */}
      <div className="sidebar-toggle" onClick={toggleSidebar}>
        <div className="hamburger-icon">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>

      <nav className="admin-sidebar-nav">
        <ul className="admin-sidebar-menu">
          {menuItems.map((item) => (
            <li key={item.id} className="admin-sidebar-item">
              <button
                className={`admin-sidebar-link ${activePage === item.id ? 'active' : ''}`}
                onClick={() => onPageChange(item.id)}
                title={isCollapsed ? item.label : ''}
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

export default InstructorSidebar;