// frontend/src/pages/instructor/Dashboard.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css';

const InstructorDashboard = () => {
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalQuestions: 0,
    totalPapers: 0,
    pendingReviews: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const fetchDashboardData = async () => {
      try {
        // TODO: Replace with actual API calls
        const mockStats = {
          totalCourses: 4,
          totalQuestions: 42,
          totalPapers: 12,
          pendingReviews: 3
        };

        const mockActivity = [
          { 
            id: 1, 
            type: 'question', 
            action: 'created', 
            title: 'Physics MCQ Set 1', 
            time: '2 hours ago',
            link: '/instructor/questions/create'
          },
          { 
            id: 2, 
            type: 'paper', 
            action: 'created', 
            title: 'Midterm Paper 2024', 
            time: '1 day ago',
            link: '/instructor/question-papers'
          },
          { 
            id: 3, 
            type: 'question', 
            action: 'updated', 
            title: 'Chemistry Problem', 
            time: '2 days ago',
            link: '/instructor/questions/create'
          },
          { 
            id: 4, 
            type: 'moderation', 
            action: 'reviewed', 
            title: 'Question Paper Review Completed', 
            time: '3 days ago',
            link: '/instructor/question-papers'
          }
        ];

        setStats(mockStats);
        setRecentActivity(mockActivity);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="instructor-dashboard">
      {/* Welcome Section */}
      <div className="dashboard-welcome">
        <h1 className="welcome-title">Welcome back, Instructor!</h1>
        <p className="welcome-subtitle">
          Here's what's happening with your teaching activities today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📘</div>
          <div className="stat-info">
            <h3 className="stat-title">My Courses</h3>
            <p className="stat-number">{stats.totalCourses}</p>
            <p className="stat-desc">Active courses assigned</p>
          </div>
          <Link to="/instructor/courses" className="stat-link">View All →</Link>
        </div>

        <div className="stat-card">
          <div className="stat-icon">❓</div>
          <div className="stat-info">
            <h3 className="stat-title">Total Questions</h3>
            <p className="stat-number">{stats.totalQuestions}</p>
            <p className="stat-desc">Questions created</p>
          </div>
          <Link to="/instructor/questions/create" className="stat-link">Create New →</Link>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-info">
            <h3 className="stat-title">Question Papers</h3>
            <p className="stat-number">{stats.totalPapers}</p>
            <p className="stat-desc">Papers created</p>
          </div>
          <Link to="/instructor/question-papers" className="stat-link">Manage →</Link>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-info">
            <h3 className="stat-title">Pending Reviews</h3>
            <p className="stat-number">{stats.pendingReviews}</p>
            <p className="stat-desc">Awaiting moderation</p>
          </div>
          <Link to="/instructor/question-papers" className="stat-link">Review →</Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2 className="section-title">Quick Actions</h2>
          <p className="section-subtitle">Frequently used actions</p>
        </div>
        <div className="action-buttons">
          <Link to="/instructor/questions/create" className="action-btn primary">
            <span className="action-icon">➕</span>
            <span className="action-text">Create New Question</span>
          </Link>
          <Link to="/instructor/question-papers/create" className="action-btn secondary">
            <span className="action-icon">📄</span>
            <span className="action-text">Build Question Paper</span>
          </Link>
          <Link to="/instructor/cos" className="action-btn secondary">
            <span className="action-icon">🎯</span>
            <span className="action-text">Manage Course Outcomes</span>
          </Link>
          <Link to="/instructor/courses" className="action-btn secondary">
            <span className="action-icon">📘</span>
            <span className="action-text">View My Courses</span>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2 className="section-title">Recent Activity</h2>
          <p className="section-subtitle">Your recent teaching activities</p>
        </div>
        <div className="activity-list">
          {recentActivity.map(activity => (
            <div key={activity.id} className="activity-item">
              <div className={`activity-icon ${activity.type}`}>
                {activity.type === 'question' && '❓'}
                {activity.type === 'paper' && '📄'}
                {activity.type === 'moderation' && '✓'}
              </div>
              <div className="activity-details">
                <p className="activity-text">
                  You <span className="activity-action">{activity.action}</span> {activity.type}: 
                  <strong> "{activity.title}"</strong>
                </p>
                <span className="activity-time">{activity.time}</span>
              </div>
              <Link to={activity.link} className="activity-link">
                View →
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Deadlines */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2 className="section-title">Upcoming Deadlines</h2>
          <p className="section-subtitle">Important dates to remember</p>
        </div>
        <div className="deadlines-list">
          <div className="deadline-item">
            <div className="deadline-date">
              <span className="date-day">15</span>
              <span className="date-month">DEC</span>
            </div>
            <div className="deadline-details">
              <h4 className="deadline-title">Midterm Papers Submission</h4>
              <p className="deadline-course">Physics 101</p>
            </div>
            <span className="deadline-status warning">5 days left</span>
          </div>
          <div className="deadline-item">
            <div className="deadline-date">
              <span className="date-day">20</span>
              <span className="date-month">DEC</span>
            </div>
            <div className="deadline-details">
              <h4 className="deadline-title">Final Question Paper Review</h4>
              <p className="deadline-course">Chemistry 201</p>
            </div>
            <span className="deadline-status info">10 days left</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructorDashboard;