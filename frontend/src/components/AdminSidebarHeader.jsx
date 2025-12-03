import React, { useState, useContext, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { AuthContext } from './AuthProvider';
import './AdminSidebarHeader.css';

// Import MUI Icons
import {
  Dashboard as DashboardIcon,
  Build as BuildIcon,
  MenuBook as MenuBookIcon,
  Flag as FlagIcon,
  Description as DescriptionIcon,
  ChevronLeft,
  ChevronRight,
  KeyboardArrowUp,
  KeyboardArrowDown,
  Logout as LogoutIcon,
  AdminPanelSettings
} from '@mui/icons-material';

const AdminSidebarHeader = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Menu items configuration with MUI Icons
  const menuItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: <DashboardIcon sx={{ fontSize: 20 }} />, 
      path: '/admin/dashboard' 
    },
    { 
      id: 'moderation', 
      label: 'Moderation', 
      icon: <BuildIcon sx={{ fontSize: 20 }} />, 
      path: '/admin/moderation' 
    },
    { 
      id: 'courses', 
      label: 'Courses', 
      icon: <MenuBookIcon sx={{ fontSize: 20 }} />, 
      path: '/admin/courses' 
    },
    { 
      id: 'CO', 
      label: 'CO Management', 
      icon: <FlagIcon sx={{ fontSize: 20 }} />,
      path: '/admin/cos' 
    },
    { 
      id: 'questionPaper', 
      label: 'Question Papers', 
      icon: <DescriptionIcon sx={{ fontSize: 20 }} />, 
      path: '/admin/question-papers' 
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
    const activeItem = menuItems.find(item => 
      currentPath.startsWith(item.path) || 
      (item.id === 'moderation' && currentPath.includes('/admin/moderation/'))
    );
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
            <div className="sidebar-logo-container">
              <AdminPanelSettings className="admin-icon" />
              <span className="sidebar-logo">Admin</span>
            </div>
          )}
          {isCollapsed && (
            <div className="sidebar-collapsed-logo">
              <AdminPanelSettings />
            </div>
          )}
          
          <button 
            className="sidebar-toggle" 
            onClick={toggleSidebar}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <ChevronRight /> : <ChevronLeft />}
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
                  <span className="sidebar-icon">
                    {item.icon}
                  </span>
                  {!isCollapsed && (
                    <span className="sidebar-label">{item.label}</span>
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
                {menuItems.find(item => item.id === activePage)?.label || 'Admin Dashboard'}
              </h1>
            </div>
          </div>
          
          <div className="header-right">
            <div className="user-dropdown-container" ref={dropdownRef}>
              <button 
                className="user-info-header"
                onClick={toggleUserDropdown}
              >
                <div className="header-avatar">
                  {user?.name?.charAt(0) || user?.email?.charAt(0) || 'A'}
                </div>
                {!isCollapsed && (
                  <div className="header-user-details">
                    <div className="header-user-name">{user?.name || 'Administrator'}</div>
                    <div className="header-user-role">Admin</div>
                  </div>
                )}
                <div className="dropdown-arrow">
                  {isUserDropdownOpen ? 
                    <KeyboardArrowUp /> : 
                    <KeyboardArrowDown />
                  }
                </div>
              </button>
              
              {/* Dropdown Menu */}
              {isUserDropdownOpen && (
                <div className="user-dropdown-menu">
                  <button className="dropdown-item logout-item" onClick={handleLogout}>
                    <span className="dropdown-item-icon">
                      <LogoutIcon />
                    </span>
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
      </div>
    </div>
  );
};

export default AdminSidebarHeader;