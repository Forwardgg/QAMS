import React from 'react';
import './Dashboard.css';

const ModeratorDashboard = () => {
  const stats = {
    pendingReviews: 18,
    reviewedToday: 45,
    approvalRate: '92%',
    flaggedContent: 7,
    totalApproved: 324,
    avgReviewTime: '12m'
  };

  const recentActivity = [
    { id: 1, type: 'question', action: 'approved', title: 'Physics MCQ Set 5', time: '30 mins ago' },
    { id: 2, type: 'question', action: 'rejected', title: 'Duplicate: Math Problem 3', time: '2 hours ago' },
    { id: 3, type: 'question', action: 'flagged', title: 'Chemistry Lab Questions', time: '4 hours ago' },
    { id: 4, type: 'paper', action: 'reviewed', title: 'Final Exam Paper 2024', time: '1 day ago' }
  ];

  const priorityQueue = [
    { id: 1, title: 'Advanced Calculus Problems', priority: 'high', waitTime: '2 days' },
    { id: 2, title: 'Biology Lab Questions', priority: 'medium', waitTime: '1 day' },
    { id: 3, title: 'Computer Science Basics', priority: 'low', waitTime: '6 hours' }
  ];

  return (
    <div className="dashboard moderator-dashboard">
      <div className="dashboard-header">
        <h1>Moderator Dashboard</h1>
        <p>Content moderation and quality control center</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-info">
            <h3>{stats.pendingReviews}</h3>
            <p>Pending Reviews</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-info">
            <h3>{stats.reviewedToday}</h3>
            <p>Reviewed Today</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <h3>{stats.approvalRate}</h3>
            <p>Approval Rate</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🚩</div>
          <div className="stat-info">
            <h3>{stats.flaggedContent}</h3>
            <p>Flagged Content</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-info">
            <h3>{stats.totalApproved}</h3>
            <p>Total Approved</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⏱️</div>
          <div className="stat-info">
            <h3>{stats.avgReviewTime}</h3>
            <p>Avg Review Time</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="dashboard-section">
        <h2>Moderation Actions</h2>
        <div className="action-buttons">
          <button className="action-btn primary">
            🔍 Start Reviewing
          </button>
          <button className="action-btn secondary">
            🚩 Flagged Content
          </button>
          <button className="action-btn secondary">
            📋 Review Queue
          </button>
          <button className="action-btn secondary">
            📈 Performance Stats
          </button>
        </div>
      </div>

      <div className="dashboard-columns">
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
                    You {activity.action} {activity.type}: "{activity.title}"
                  </p>
                  <span className="activity-time">{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Queue */}
        <div className="dashboard-section">
          <h2>Priority Review Queue</h2>
          <div className="priority-list">
            {priorityQueue.map(item => (
              <div key={item.id} className={`priority-item ${item.priority}`}>
                <div className="priority-marker"></div>
                <div className="priority-details">
                  <h4>{item.title}</h4>
                  <div className="priority-meta">
                    <span className={`priority-badge ${item.priority}`}>
                      {item.priority} priority
                    </span>
                    <span className="wait-time">Waiting: {item.waitTime}</span>
                  </div>
                </div>
                <button className="review-btn">Review</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModeratorDashboard;