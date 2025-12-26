import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import questionPaperAPI from '../../api/questionPaper.api';
import moderatorAPI from '../../api/moderator.api';
import courseAPI from '../../api/course.api';

// Import only used icons
import {
  Book as BookIcon,
  HourglassEmpty as HourglassIcon,
  CheckCircle as CheckCircleIcon,
  Description as DescriptionIcon,
  Warning as WarningIcon,
  Dashboard as DashboardIcon
} from '@mui/icons-material';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalCourses: 0,
    pendingModeration: 0,
    approvedPapers: 0
  });

  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Format time ago
  const timeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return "just now";
    if (seconds < 3600) return Math.floor(seconds / 60) + " minutes ago";
    if (seconds < 86400) return Math.floor(seconds / 3600) + " hours ago";
    if (seconds < 2592000) return Math.floor(seconds / 86400) + " days ago";
    if (seconds < 31536000) return Math.floor(seconds / 2592000) + " months ago";
    return Math.floor(seconds / 31536000) + " years ago";
  };

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Get total courses count
        const coursesResponse = await courseAPI.getAll({ limit: 1, page: 1 });
        const totalCourses = coursesResponse.data?.total || 0;
        
        // Get all papers for stats and activities
        const papersResponse = await questionPaperAPI.getAll({ limit: 100 });
        const papers = papersResponse.data || [];
        
        // Get all moderations for stats and activities
        const moderationsResponse = await moderatorAPI.getAllModerations({ limit: 100 });
        const moderations = moderationsResponse.data || [];
        
        // Calculate stats
        const pendingModerations = moderations.filter(m => m.status === 'pending');
        const approvedPapers = papers.filter(p => p.status === 'approved').length;
        
        // Set stats
        setStats({
          totalCourses,
          pendingModeration: pendingModerations.length,
          approvedPapers
        });
        
        // Build recent activities
        const activities = [];
        
        // Recent Paper Submissions
        const recentSubmissions = papers
          .filter(paper => ['submitted', 'under_review'].includes(paper.status))
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 3)
          .map(paper => ({
            id: `paper-${paper.paper_id}`,
            description: `New paper submitted: ${paper.title}`,
            time: paper.created_at,
            icon: <DescriptionIcon />,
            color: '#4f46e5'
          }));
        
        activities.push(...recentSubmissions);
        
        // Recent Moderation Completions
        const recentCompletions = moderations
          .filter(mod => ['approved', 'rejected'].includes(mod.status))
          .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))
          .slice(0, 3)
          .map(mod => ({
            id: `mod-${mod.moderation_id}`,
            description: `Paper ${mod.status}: ${mod.paper_title}`,
            time: mod.updated_at || mod.created_at,
            icon: mod.status === 'approved' ? <CheckCircleIcon /> : <WarningIcon />,
            color: mod.status === 'approved' ? '#10b981' : '#ef4444'
          }));
        
        activities.push(...recentCompletions);
        
        // Sort activities by time
        const sortedActivities = activities
          .sort((a, b) => new Date(b.time) - new Date(a.time))
          .slice(0, 6)
          .map(activity => ({
            ...activity,
            time: timeAgo(activity.time)
          }));
        
        setRecentActivity(sortedActivities);
        
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  const statCards = [
    {
      title: 'Total Courses',
      value: stats.totalCourses,
      icon: <BookIcon sx={{ fontSize: 28 }} />,
      color: '#4f46e5',
    },
    {
      title: 'Pending Moderation',
      value: stats.pendingModeration,
      icon: <HourglassIcon sx={{ fontSize: 28 }} />,
      color: '#f59e0b',
    },
    {
      title: 'Approved Papers',
      value: stats.approvedPapers,
      icon: <CheckCircleIcon sx={{ fontSize: 28 }} />,
      color: '#10b981',
    }
  ];

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="header-icon-title">
          <DashboardIcon sx={{ fontSize: 32, color: '#4f46e5', marginRight: 2 }} />
          <h1>Admin Dashboard</h1>
        </div>
        <p className="dashboard-subtitle">Welcome to the admin panel.</p>
      </div>

      {error && (
        <div className="error-message">
          <WarningIcon sx={{ fontSize: 20, marginRight: 1 }} />
          <span>{error}</span>
        </div>
      )}

      {/* Quick Stats */}
      <div className="stats-grid">
        {statCards.map((stat, index) => (
          <div key={index} className="stat-card" style={{ borderTop: `4px solid ${stat.color}` }}>
            <div className="stat-icon" style={{ backgroundColor: `${stat.color}20` }}>
              {stat.icon}
            </div>
            <div className="stat-content">
              <h3>{stat.title}</h3>
              {loading ? (
                <div className="stat-loading">Loading...</div>
              ) : (
                <p className="stat-value">{stat.value}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="section-card">
        <div className="section-header">
          <h2>Recent Activity</h2>
        </div>
        
        {loading ? (
          <div className="activity-loading">
            <div className="loading-spinner"></div>
            <p>Loading activities...</p>
          </div>
        ) : recentActivity.length === 0 ? (
          <div className="no-activities">
            <p>No recent activities found.</p>
          </div>
        ) : (
          <div className="activity-list">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="activity-item">
                <div 
                  className="activity-icon" 
                  style={{ backgroundColor: `${activity.color}20` }}
                >
                  {activity.icon}
                </div>
                <div className="activity-content">
                  <p className="activity-description">{activity.description}</p>
                  <span className="activity-time">{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;