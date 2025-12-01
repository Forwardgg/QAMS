import React, { useState, useContext } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { AuthContext } from './AuthProvider';
import './AdminSidebarHeader.css';

const ModeratorSidebarHeader = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // INSTRUCTOR menu items configuration
  const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊', path: '/instructor/dashboard' },
  { id: 'courses', label: 'My Courses', icon: '📘', path: '/instructor/courses' },
  { id: 'CO', label: 'Course Outcomes', icon: '🎯', path: '/instructor/cos' },
  { id: 'questionCreate', label: 'Create Question', icon: '➕', path: '/instructor/questions/create' },
  { id: 'questionPaper', label: 'Question Papers', icon: '📝', path: '/instructor/question-papers' }
];

  // Determine active page based on current route
  const getActivePage = () => {
    const currentPath = location.pathname;
    const activeItem = menuItems.find(item => 
      currentPath.startsWith(item.path) || 
      (item.id === 'questionPaper' && currentPath.includes('/instructor/question-papers/'))
    );
    return activeItem?.id || 'dashboard';
  };

  const activePage = getActivePage();

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleLogout = () => {
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
              <div className="sidebar-logo">INSTRUCTOR</div>
              <div className="sidebar-title">Dashboard</div>
            </>
          )}
          {isCollapsed && <div className="sidebar-collapsed-logo">I</div>}
          
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

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          {!isCollapsed && (
            <button className="logout-btn" onClick={handleLogout}>
              <span className="logout-icon">🚪</span>
              <span className="logout-text">Logout</span>
            </button>
          )}
          {isCollapsed && (
            <button className="logout-btn-collapsed" onClick={handleLogout} title="Logout">
              <span className="logout-icon">🚪</span>
            </button>
          )}
        </div>
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
                {activePage === 'dashboard' && 'Your teaching overview and recent activities'}
                {activePage === 'courses' && 'View and manage your assigned courses'}
                {activePage === 'CO' && 'Manage course outcomes for your courses'}
                {activePage === 'questionCreate' && 'Create new questions for your courses'}
                {activePage === 'questionPaper' && 'Create and manage question papers'}
              </p>
            </div>
          </div>
          
          <div className="header-right">
            <div className="user-info-header">
              <div className="header-avatar">
                {user?.name?.charAt(0) || user?.email?.charAt(0) || 'I'}
              </div>
              <div className="header-user-details">
                <div className="header-user-name">{user?.name || 'Instructor'}</div>
                <div className="header-user-email">{user?.email || 'instructor@example.com'}</div>
              </div>
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
              <a href="/instructor/help" className="footer-link">Help</a>
              <a href="/instructor/support" className="footer-link">Support</a>
              <a href="/instructor/privacy" className="footer-link">Privacy</a>
              <a href="/instructor/terms" className="footer-link">Terms</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default ModeratorSidebarHeader;