// src/layouts/Sidebar/Sidebar.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTachometerAlt, faBook, faUsers, faHistory, faQuestionCircle, faBookOpen } from '@fortawesome/free-solid-svg-icons';

import './Sidebar.css';

const Sidebar = ({ role = 'admin', username = 'Admin User' }) => {
  const location = useLocation();

  const sidebarItems = {
    admin: [
      { path: '/admin/dashboard', icon: faTachometerAlt, label: 'Dashboard' },
      { path: '/admin/courses', icon: faBook, label: 'Course Management' },
      { path: '/admin/users', icon: faUsers, label: 'User Management' },
      { path: '/admin/logs', icon: faHistory, label: 'User Logs' },
    ],
    instructor: [
      { path: '/instructor/dashboard', icon: faTachometerAlt, label: 'Dashboard' },
      { path: '/instructor/my-courses', icon: faBookOpen, label: 'My Courses' },
      { path: '/instructor/my-questions', icon: faQuestionCircle, label: 'My Questions' },
    ],
    moderator: [
      { path: '/moderator/dashboard', icon: faTachometerAlt, label: 'Dashboard' },
      { path: '/moderator/pending', icon: faQuestionCircle, label: 'Pending Moderations' },
    ],
  };

  const currentItems = sidebarItems[role] || sidebarItems.admin;

  return (
    <div className="sidebar">
      <div className="logo-section">
        <img src="/logo.png" alt="Logo" /> {/* Ensure logo.png is in your public folder */}
        <h3>QAMS - {role.charAt(0).toUpperCase() + role.slice(1)}</h3>
      </div>
      <div className="user-info-section">
        <p className="user-name">Welcome, {username}</p>
        <p className="user-role">{role.toUpperCase()}</p>
      </div>
      <nav className="sidebar-nav">
        <ul>
          {currentItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={location.pathname === item.path ? 'active' : ''}
              >
                <FontAwesomeIcon icon={item.icon} /> {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;