// components/ModeratorSidebarHeader.jsx
import React, { useState, useContext, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { AuthContext } from './AuthProvider';
import './AdminSidebarHeader.css';

const ModeratorSidebarHeader = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // MODERATOR menu items configuration
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', path: '/moderator/dashboard' },
    { id: 'courses', label: 'Courses', icon: '📘', path: '/moderator/courses' },
    { id: 'CO', label: 'Course Outcomes', icon: '🎯', path: '/moderator/cos' },
    { 
      id: 'moderation', 
      label: 'Moderation', 
      icon: '🔍', 
      path: '/moderator/moderation/papers',
      subPaths: [
        '/moderator/moderation/',
        '/moderator/moderation/papers',
        '/moderator/moderation/paper/',
        '/moderator/moderation/questions',
        '/moderator/moderation/report/'
      ]
    }
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Determine active page based on current route
  const getActivePage = () => {
    const currentPath = location.pathname;
    const activeItem = menuItems.find(item => {
      // Check main path
      if (currentPath.startsWith(item.path)) return true;
      // Check subpaths if they exist
      if (item.subPaths) {
        return item.subPaths.some(subPath => currentPath.startsWith(subPath));
      }
      return false;
    });
    return activeItem?.id || 'dashboard';
  };

  const activePage = getActivePage();

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleUserDropdown = () => {
    setIsUserDropdownOpen(!isUserDropdownOpen);
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleLogout = () => {
    setIsUserDropdownOpen(false);
    if (logout) {
      logout();
    } else {
      localStorage.removeItem("token");
      window.location.href = "/auth/login";
    }
  };

  return (
    <div className={`admin-container ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Sidebar */}
      <aside className={`admin-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        {/* Sidebar Header */}
        <div className="sidebar-header">
          {!isCollapsed && (
            <>
              <div className="sidebar-logo">MODERATOR</div>
              <div className="sidebar-title">Dashboard</div>
            </>
          )}
          {isCollapsed && <div className="sidebar-collapsed-logo">M</div>}
          
          <button 
            className="sidebar-toggle" 
            onClick={toggleSidebar}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? '→' : '←'}
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="sidebar-nav">
          <ul className="sidebar-menu">
            {menuItems.map((item) => (
              <li key={item.id} className="sidebar-item">
                <button
                  className={`sidebar-link ${activePage === item.id ? 'active' : ''}`}
                  onClick={() => handleNavigation(item.path)}
                  title={isCollapsed ? item.label : ''}
                >
                  <span className="sidebar-icon">{item.icon}</span>
                  {!isCollapsed && (
                    <span className="sidebar-label">{item.label}</span>
                  )}
                  {!isCollapsed && activePage === item.id && (
                    <span className="active-indicator"></span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="admin-main">
        {/* Header */}
        <header className="admin-header">
          <div className="header-left">
            <div className="page-info">
              <h1 className="page-title">
                {menuItems.find(item => item.id === activePage)?.label || 'Dashboard'}
              </h1>
              <p className="page-description">
                {activePage === 'dashboard' && 'Your moderation overview and recent activities'}
                {activePage === 'courses' && 'View courses available for moderation'}
                {activePage === 'CO' && 'View course outcomes for moderation'}
                {activePage === 'moderation' && 'Review and moderate question papers'}
              </p>
            </div>
          </div>
          
          <div className="header-right">
            {/* User Info with Dropdown */}
            <div className="user-dropdown-container" ref={dropdownRef}>
              <button 
                className="user-info-header"
                onClick={toggleUserDropdown}
              >
                <div className="header-avatar">
                  {user?.name?.charAt(0) || user?.email?.charAt(0) || 'M'}
                </div>
                <div className="header-user-details">
                  <div className="header-user-name">{user?.name || 'Moderator'}</div>
                  <div className="header-user-email">{user?.email || 'moderator@example.com'}</div>
                </div>
                <div className="dropdown-arrow">
                  {isUserDropdownOpen ? '▲' : '▼'}
                </div>
              </button>
              
              {/* Dropdown Menu */}
              {isUserDropdownOpen && (
                <div className="user-dropdown-menu">
                  <button className="dropdown-item logout-item" onClick={handleLogout}>
                    <span className="dropdown-item-text">Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="admin-content">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="admin-footer">
          <div className="footer-content">
            <p>© {new Date().getFullYear()} Learning Management System • v1.0</p>
            <div className="footer-links">
              <a href="/moderator/help" className="footer-link">Help</a>
              <a href="/moderator/support" className="footer-link">Support</a>
              <a href="/moderator/privacy" className="footer-link">Privacy</a>
              <a href="/moderator/terms" className="footer-link">Terms</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default ModeratorSidebarHeader;