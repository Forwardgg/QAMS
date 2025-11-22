// frontend/src/pages/instructor/dashboard.js
import React, { useState, useContext } from 'react';
import { AuthContext } from '../../components/AuthProvider';
import InstructorHeader from '../../components/InstructorHeader';
import InstructorSidebar from '../../components/InstructorSidebar';
import InstructorCourses from './Courses';
import InstructorCO from './CO';
import QuestionPapers from './QuestionPapers';
import './Dashboard.css';

const InstructorDashboard = () => {
  const [activePage, setActivePage] = useState('dashboard');
  const auth = useContext(AuthContext);

  const handleLogout = () => {
    auth.logout();
  };

  const handlePageChange = (pageId) => {
    setActivePage(pageId);
  };

  // Mock data for dashboard stats
  const dashboardStats = {
    totalQuestions: 24,
    totalPapers: 8,
    pendingReviews: 3,
    approvedQuestions: 21
  };

  const recentActivity = [
    { id: 1, type: 'question', action: 'created', title: 'Physics MCQ Set 1', time: '2 hours ago' },
    { id: 2, type: 'paper', action: 'created', title: 'Midterm Paper 2024', time: '1 day ago' },
    { id: 3, type: 'question', action: 'updated', title: 'Chemistry Problem', time: '2 days ago' }
  ];

  // Render different content based on active page
  const renderContent = () => {
    switch (activePage) {
      case 'dashboard':
        return (
          <div className="dashboard-content">
            <h1>Teaching Dashboard</h1>
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Total Questions</h3>
                <p className="stat-number">{dashboardStats.totalQuestions}</p>
              </div>
              <div className="stat-card">
                <h3>Question Papers</h3>
                <p className="stat-number">{dashboardStats.totalPapers}</p>
              </div>
              <div className="stat-card">
                <h3>Pending Reviews</h3>
                <p className="stat-number">{dashboardStats.pendingReviews}</p>
              </div>
              <div className="stat-card">
                <h3>Approved Questions</h3>
                <p className="stat-number">{dashboardStats.approvedQuestions}</p>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="dashboard-section">
              <h2>Quick Actions</h2>
              <div className="action-buttons">
                <button className="action-btn primary">
                  ➕ Create New Question
                </button>
                <button className="action-btn secondary">
                  📄 Build Question Paper
                </button>
                <button className="action-btn secondary">
                  📊 View Analytics
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="dashboard-section">
              <h2>Recent Activity</h2>
              <div className="activity-list">
                {recentActivity.map(activity => (
                  <div key={activity.id} className="activity-item">
                    <div className="activity-icon">
                      {activity.type === 'question' ? '❓' : '📄'}
                    </div>
                    <div className="activity-details">
                      <p className="activity-text">
                        You {activity.action} {activity.type} "{activity.title}"
                      </p>
                      <span className="activity-time">{activity.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 'questions':
        return (
          <div className="dashboard-content">
            <h1>some</h1>
            <p>some</p>
          </div>
        );
      case 'Question Paper':
        return (
          <div className="dashboard-content">
            <QuestionPapers />
          </div>
        );
      case 'analytics':
        return (
          <div className="dashboard-content">
            <h1>some</h1>
            <p>some</p>
          </div>
        );
      case 'courses':
        return (
          <div className="dashboard-content">
            <InstructorCourses />
          </div>
        );
      case 'CO':
        return (
          <div className="dashboard-content">
            <InstructorCO />
          </div>
        );
      default:
        return (
          <div className="dashboard-content">
            <h1>some</h1>
            <p>some</p>
          </div>
        );
    }
  };

  return (
    <div className="instructor-dashboard">
      <InstructorHeader user={auth.user} onLogout={handleLogout} />
      <div className="instructor-dashboard-body">
        <InstructorSidebar activePage={activePage} onPageChange={handlePageChange} />
        <main className="instructor-main-content">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default InstructorDashboard;