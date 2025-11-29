// src/pages/admin/Dashboard.js
import React, { useState, useContext } from 'react';
import { AuthContext } from '../../components/AuthProvider';
import AdminHeader from '../../components/AdminHeader';
import AdminSidebar from '../../components/AdminSidebar';
import Courses from './Courses';
import CO from './CO';
import Moderation from './Moderation';
import './Dashboard.css';

const AdminDashboard = () => {
  const [activePage, setActivePage] = useState('dashboard');
  const [moderationView, setModerationView] = useState('list'); // 'list' or 'details'
  const [selectedModeration, setSelectedModeration] = useState(null);
  const auth = useContext(AuthContext);

  const handleLogout = () => {
    auth.logout();
  };

  const handlePageChange = (pageId) => {
    setActivePage(pageId);
    setModerationView('list'); // Reset to list view when switching pages
    setSelectedModeration(null);
  };

  // Handle viewing moderation details
  const handleViewModeration = (moderationId, paperId) => {
    setSelectedModeration({ moderationId, paperId });
    setModerationView('details');
  };

  // Handle going back to moderation list
  const handleBackToList = () => {
    setModerationView('list');
    setSelectedModeration(null);
  };

  // Render different content based on active page
  const renderContent = () => {
    switch (activePage) {
      case 'dashboard':
        return (
          <div className="dashboard-content">
            <h1>Dashboard Overview</h1>
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Total Users</h3>
                <p className="stat-number">1,234</p>
              </div>
              <div className="stat-card">
                <h3>Total Courses</h3>
                <p className="stat-number">567</p>
              </div>
              <div className="stat-card">
                <h3>Pending Moderation</h3>
                <p className="stat-number">23</p>
              </div>
              <div className="stat-card">
                <h3>System Health</h3>
                <p className="stat-number">100%</p>
              </div>
            </div>
          </div>
        );
      case 'moderation':
        return (
          <div className="dashboard-content">
            <Moderation 
              view={moderationView}
              selectedModeration={selectedModeration}
              onViewModeration={handleViewModeration}
              onBackToList={handleBackToList}
            />
          </div>
        );
      case 'courses':
        return (
          <div className="dashboard-content">
            <Courses />
          </div>
        );
      case 'CO':
        return (
          <div className="dashboard-content">
            <CO />
          </div>
        );
      case 'users':
        return (
          <div className="dashboard-content">
            <h1>User Management</h1>
            <p>User management content goes here...</p>
          </div>
        );
      case 'reports':
        return (
          <div className="dashboard-content">
            <h1>Reports</h1>
            <p>Reports content goes here...</p>
          </div>
        );
      default:
        return (
          <div className="dashboard-content">
            <h1>Dashboard</h1>
            <p>Select a menu item to get started.</p>
          </div>
        );
    }
  };

  return (
    <div className="admin-dashboard">
      <AdminHeader user={auth.user} onLogout={handleLogout} />
      <div className="admin-dashboard-body">
        <AdminSidebar activePage={activePage} onPageChange={handlePageChange} />
        <main className="admin-main-content">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;