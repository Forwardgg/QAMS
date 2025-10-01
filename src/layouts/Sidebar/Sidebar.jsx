// src/layouts/Sidebar/Sidebar.jsx
import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTachometerAlt,
  faBook,
  faUsers,
  faHistory,
  faQuestionCircle,
  faBookOpen,
  faSignOutAlt
} from '@fortawesome/free-solid-svg-icons';

import './Sidebar.css';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // ✅ Load role + username from sessionStorage (not localStorage)
  const [role, setRole] = useState(sessionStorage.getItem("role") || "guest");
  const [username, setUsername] = useState(sessionStorage.getItem("username") || "User");

  useEffect(() => {
    // Re-sync on mount
    setRole(sessionStorage.getItem("role") || "guest");
    setUsername(sessionStorage.getItem("username") || "User");
  }, []);

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
    guest: [] // no items for guests
  };

  const currentItems = sidebarItems[role] || [];

  const handleLogout = () => {
    // ✅ Clear sessionStorage
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("role");
    sessionStorage.removeItem("username");
    navigate("/auth", { replace: true });
  };

  return (
    <div className="sidebar">
      <div className="logo-section">
        <img src="/logo.png" alt="Logo" /> 
        <h3>
          QAMS - {role !== "guest" ? role.charAt(0).toUpperCase() + role.slice(1) : "Guest"}
        </h3>
      </div>

      {role !== "guest" && (
        <div className="user-info-section">
          <p className="user-name">Welcome, {username}</p>
          <p className="user-role">{role.toUpperCase()}</p>
        </div>
      )}

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

          {role !== "guest" && (
            <li>
              <button className="logout-btn" onClick={handleLogout}>
                <FontAwesomeIcon icon={faSignOutAlt} /> Logout
              </button>
            </li>
          )}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
