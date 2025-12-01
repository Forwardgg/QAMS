import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalCourses: 0,
    pendingModeration: 0,
    completedModeration: 0,
    totalUsers: 0
  });

  const [recentActivity, setRecentActivity] = useState([]);

  // Fetch dashboard data (mock for now)
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setStats({
        totalCourses: 45,
        pendingModeration: 12,
        completedModeration: 33,
        totalUsers: 156
      });

      setRecentActivity([
        { id: 1, type: 'course_added', description: 'New course "Advanced React" added', time: '2 hours ago' },
        { id: 2, type: 'moderation_approved', description: 'Course "Web Development" approved', time: '5 hours ago' },
        { id: 3, type: 'user_registered', description: 'New instructor registered', time: '1 day ago' },
        { id: 4, type: 'moderation_pending', description: 'Course "Data Structures" awaiting review', time: '2 days ago' }
      ]);
    }, 500);
  }, []);

  const statCards = [
    {
      title: 'Total Courses',
      value: stats.totalCourses,
      icon: '📚',
      color: '#4f46e5',
      link: '/admin/courses'
    },
    {
      title: 'Pending Moderation',
      value: stats.pendingModeration,
      icon: '⏳',
      color: '#f59e0b',
      link: '/admin/moderation/list'
    },
    {
      title: 'Completed Moderation',
      value: stats.completedModeration,
      icon: '✅',
      color: '#10b981',
      link: '/admin/moderation/report'
    },
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: '👥',
      color: '#8b5cf6',
      link: '/admin/users' // You might want to add this route later
    }
  ];

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p className="dashboard-subtitle">Welcome to the admin panel. Here's what's happening.</p>
      </div>

      {/* Quick Stats */}
      <div className="stats-grid">
        {statCards.map((stat, index) => (
          <Link to={stat.link} key={index} className="stat-card-link">
            <div className="stat-card" style={{ borderTop: `4px solid ${stat.color}` }}>
              <div className="stat-icon" style={{ backgroundColor: `${stat.color}20` }}>
                <span className="icon">{stat.icon}</span>
              </div>
              <div className="stat-content">
                <h3>{stat.title}</h3>
                <p className="stat-value">{stat.value}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="section-card">
        <h2>Quick Actions</h2>
        <div className="quick-actions-grid">
          <Link to="/admin/courses" className="quick-action-card">
            <span className="action-icon">📘</span>
            <h3>Manage Courses</h3>
            <p>Add, edit, or remove courses</p>
          </Link>
          
          <Link to="/admin/cos" className="quick-action-card">
            <span className="action-icon">🎯</span>
            <h3>Course Outcomes</h3>
            <p>Manage learning objectives</p>
          </Link>
          
          <Link to="/admin/moderation/list" className="quick-action-card">
            <span className="action-icon">⚖️</span>
            <h3>Review Moderation</h3>
            <p>Check pending approvals</p>
          </Link>
          
          <Link to="/admin/moderation/report" className="quick-action-card">
            <span className="action-icon">📊</span>
            <h3>View Reports</h3>
            <p>See moderation reports</p>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="section-card">
        <div className="section-header">
          <h2>Recent Activity</h2>
          <Link to="/admin/activity" className="view-all-link">View All →</Link>
        </div>
        <div className="activity-list">
          {recentActivity.map((activity) => (
            <div key={activity.id} className="activity-item">
              <div className="activity-icon">
                {activity.type.includes('moderation') && '⚖️'}
                {activity.type.includes('course') && '📚'}
                {activity.type.includes('user') && '👤'}
              </div>
              <div className="activity-content">
                <p className="activity-description">{activity.description}</p>
                <span className="activity-time">{activity.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;