import React, { useState } from 'react';
import AdminHeader from '../../components/AdminHeader';
import AdminSidebar from '../../components/AdminSidebar';
import './Dashboard.css';

const AdminDashboard = () => {
  const [activePage, setActivePage] = useState('dashboard');
  const [user] = useState({
    name: 'Admin User',
    email: 'admin@example.com'
  });

  const handleLogout = () => {
    // Add logout logic here
    console.log('Logging out...');
  };

  const handlePageChange = (pageId) => {
    setActivePage(pageId);
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
      case 'users':
        return (
          <div className="dashboard-content">
            <h1>User Management</h1>
            <p>User management content goes here...</p>
          </div>
        );
      case 'courses':
        return (
          <div className="dashboard-content">
            <h1>Courses Management</h1>
            <p>Courses management content goes here...</p>
          </div>
        );
      case 'content':
        return (
          <div className="dashboard-content">
            <h1>Content Moderation</h1>
            <p>Content moderation content goes here...</p>
          </div>
        );
      case 'reports':
        return (
          <div className="dashboard-content">
            <h1>Reports & Analytics</h1>
            <p>Reports and analytics content goes here...</p>
          </div>
        );
      case 'system':
        return (
          <div className="dashboard-content">
            <h1>System Settings</h1>
            <p>System settings content goes here...</p>
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
      <AdminHeader user={user} onLogout={handleLogout} />
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