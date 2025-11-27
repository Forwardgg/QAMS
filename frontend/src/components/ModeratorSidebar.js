import React, { useState } from 'react';
import './Sidebar.css';

const ModeratorSidebar = ({ activePage, onPageChange }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'courses', label: 'Courses', icon: '👥' },
    { id: 'COs', label: 'COs', icon: '📚' },
    { id: 'question_paper', label: 'Question Paper', icon: '🛡️' },
    { id: 'reports', label: 'Reports', icon: '📈' }
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

export default ModeratorSidebar;