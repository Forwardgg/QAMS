// src/frontend/src/pages/moderator/Dashboard.jsx
import React, { useState, useContext } from 'react';
import { AuthContext } from '../../components/AuthProvider';
import ModeratorHeader from '../../components/ModeratorHeader';
import ModeratorSidebar from '../../components/ModeratorSidebar';
import ModeratorCourses from './Courses';
import ModeratorCO from './COs';
import PaperList from './moderation/PaperList';
import './Dashboard.css';

const ModeratorDashboard = () => {
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
    pendingReviews: 15,
    approvedToday: 8,
    rejectedToday: 3,
    totalModerated: 127
  };

  const recentActivity = [
    { id: 1, type: 'question', action: 'approved', title: 'Physics MCQ Set 1', time: '1 hour ago' },
    { id: 2, type: 'question', action: 'rejected', title: 'Chemistry Problem', time: '3 hours ago' },
    { id: 3, type: 'paper', action: 'reviewed', title: 'Midterm Paper 2024', time: '5 hours ago' },
    { id: 4, type: 'course', action: 'approved', title: 'Advanced Mathematics', time: '1 day ago' }
  ];

  const moderationQueue = [
    { id: 1, type: 'question', title: 'Quantum Mechanics Problems', submittedBy: 'Dr. Smith', waitingTime: '2 days' },
    { id: 2, type: 'paper', title: 'Final Exam 2024', submittedBy: 'Prof. Johnson', waitingTime: '1 day' },
    { id: 3, type: 'course', title: 'Data Science Fundamentals', submittedBy: 'Dr. Brown', waitingTime: '3 days' }
  ];

  // Render different content based on active page
  const renderContent = () => {
    switch (activePage) {
      case 'dashboard':
        return (
          <div className="moderator-dashboard-content">
            <div className="dashboard-header">
              <h1>Moderation Dashboard</h1>
              <p>Welcome back! Manage content moderation and reviews.</p>
            </div>
            
            {/* Stats Grid */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">⏳</div>
                <div className="stat-info">
                  <h3>Pending Reviews</h3>
                  <p className="stat-number">{dashboardStats.pendingReviews}</p>
                  <span className="stat-trend warning">Requires attention</span>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">✅</div>
                <div className="stat-info">
                  <h3>Approved Today</h3>
                  <p className="stat-number">{dashboardStats.approvedToday}</p>
                  <span className="stat-trend">Good progress</span>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">❌</div>
                <div className="stat-info">
                  <h3>Rejected Today</h3>
                  <p className="stat-number">{dashboardStats.rejectedToday}</p>
                  <span className="stat-trend">Quality control</span>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">📊</div>
                <div className="stat-info">
                  <h3>Total Moderated</h3>
                  <p className="stat-number">{dashboardStats.totalModerated}</p>
                  <span className="stat-trend">All time</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="dashboard-section">
              <h2>Quick Actions</h2>
              <div className="action-buttons">
                <button className="action-btn primary">
                  ⚡ Start Reviewing
                </button>
                <button className="action-btn secondary">
                  📋 View Pending Queue
                </button>
                <button className="action-btn secondary">
                  📊 Generate Reports
                </button>
                <button className="action-btn secondary">
                  ⚙️ Moderation Settings
                </button>
              </div>
            </div>

            <div className="content-row">
              {/* Recent Activity */}
              <div className="dashboard-section half-width">
                <h2>Recent Moderation Activity</h2>
                <div className="activity-list">
                  {recentActivity.map(activity => (
                    <div key={activity.id} className="activity-item">
                      <div className="activity-icon">
                        {activity.action === 'approved' ? '✅' : 
                         activity.action === 'rejected' ? '❌' : '📄'}
                      </div>
                      <div className="activity-details">
                        <p className="activity-text">
                          {activity.title}
                        </p>
                        <div className="activity-meta">
                          <span className={`activity-type ${activity.action}`}>
                            {activity.action}
                          </span>
                          <span className="activity-time">{activity.time}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Moderation Queue */}
              <div className="dashboard-section half-width">
                <h2>Moderation Queue</h2>
                <div className="queue-list">
                  {moderationQueue.map(item => (
                    <div key={item.id} className="queue-item">
                      <div className="queue-icon">
                        {item.type === 'question' ? '❓' : 
                         item.type === 'paper' ? '📄' : '📚'}
                      </div>
                      <div className="queue-details">
                        <p className="queue-title">{item.title}</p>
                        <div className="queue-meta">
                          <span className="queue-submitter">By: {item.submittedBy}</span>
                          <span className="queue-waiting">Waiting: {item.waitingTime}</span>
                        </div>
                      </div>
                      <button className="queue-action-btn">
                        Review
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      case 'courses':
        return (
          <div className="moderator-dashboard-content">
            <ModeratorCourses />
          </div>
        );
      case 'COs':
        return (
          <div className="moderator-dashboard-content">
            <ModeratorCO />
          </div>
        );
      case 'question_paper':
        return (
          <div className="moderator-dashboard-content">
            <PaperList />
          </div>
        );
      case 'reports':
        return (
          <div className="moderator-dashboard-content">
            <h1>Moderation Reports</h1>
            <p>View moderation statistics and reports</p>
          </div>
        );
      default:
        return (
          <div className="moderator-dashboard-content">
            <h1>Moderator Panel</h1>
            <p>Welcome to the moderation panel</p>
          </div>
        );
    }
  };

  return (
    <div className="moderator-dashboard">
      <ModeratorHeader user={auth.user} onLogout={handleLogout} />
      <div className="moderator-dashboard-body">
        <ModeratorSidebar activePage={activePage} onPageChange={handlePageChange} />
        <main className="moderator-main-content">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default ModeratorDashboard;