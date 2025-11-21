import React from 'react';
import './Dashboard.css';

const InstructorDashboard = () => {
  const stats = {
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

  return (
    <div className="dashboard instructor-dashboard">
      <div className="dashboard-header">
        <h1>Instructor Dashboard</h1>
        <p>Welcome back! Manage your questions and create exam papers.</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-info">
            <h3>{stats.totalQuestions}</h3>
            <p>Total Questions</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📄</div>
          <div className="stat-info">
            <h3>{stats.totalPapers}</h3>
            <p>Question Papers</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-info">
            <h3>{stats.pendingReviews}</h3>
            <p>Pending Reviews</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <h3>{stats.approvedQuestions}</h3>
            <p>Approved Questions</p>
          </div>
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
            📊 View My Questions
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
};

export default InstructorDashboard;