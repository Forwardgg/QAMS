import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import questionPaperAPI from '../../api/questionPaper.api';
import moderatorAPI from '../../api/moderator.api';
import courseAPI from '../../api/course.api';

// Import MUI Icons
import {
  Book as BookIcon,
  HourglassEmpty as HourglassIcon,
  CheckCircle as CheckCircleIcon,
  Description as DescriptionIcon,
  Edit as EditIcon,
  Warning as WarningIcon,
  Dashboard as DashboardIcon,
  Notifications as NotificationsIcon,
  TrendingUp as TrendingUpIcon
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
    
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) return interval + " year" + (interval > 1 ? "s" : "") + " ago";
    
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return interval + " month" + (interval > 1 ? "s" : "") + " ago";
    
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return interval + " day" + (interval > 1 ? "s" : "") + " ago";
    
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return interval + " hour" + (interval > 1 ? "s" : "") + " ago";
    
    interval = Math.floor(seconds / 60);
    if (interval >= 1) return interval + " minute" + (interval > 1 ? "s" : "") + " ago";
    
    return "just now";
  };

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // 1. Get total courses count
        const coursesResponse = await courseAPI.getAll({ limit: 1, page: 1 });
        const totalCourses = coursesResponse.data?.total || 0;
        
        // 2. Get all papers for stats and activities
        const papersResponse = await questionPaperAPI.getAll({ limit: 200 });
        const papers = papersResponse.data || [];
        
        // 3. Get all moderations for stats and activities
        const moderationsResponse = await moderatorAPI.getAllModerations({ limit: 200 });
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
        
        // Build recent activities from 3 sources
        const activities = [];
        
        // A. Recent Paper Submissions (last 7 days)
        const recentSubmissions = papers
          .filter(paper => 
            ['submitted', 'under_review'].includes(paper.status) &&
            new Date(paper.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          )
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 5)
          .map(paper => ({
            id: `paper-${paper.paper_id}`,
            type: 'paper_submitted',
            description: `New paper "${paper.title}" submitted for ${paper.course_code || 'course'}`,
            time: paper.created_at,
            icon: <DescriptionIcon />,
            color: '#4f46e5'
          }));
        
        activities.push(...recentSubmissions);
        
        // B. Recent Moderation Completions
        const recentCompletions = moderations
          .filter(mod => ['approved', 'rejected'].includes(mod.status))
          .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))
          .slice(0, 5)
          .map(mod => ({
            id: `mod-${mod.moderation_id}`,
            type: mod.status === 'approved' ? 'moderation_approved' : 'moderation_rejected',
            description: `Paper "${mod.paper_title}" ${mod.status === 'approved' ? 'approved' : 'rejected'}`,
            time: mod.updated_at || mod.created_at,
            icon: mod.status === 'approved' ? <CheckCircleIcon /> : <WarningIcon />,
            color: mod.status === 'approved' ? '#10b981' : '#ef4444'
          }));
        
        activities.push(...recentCompletions);
        
        // C. Recent Paper Updates (status changes)
        const recentUpdates = papers
          .filter(paper => 
            new Date(paper.updated_at) > new Date(paper.created_at) &&
            new Date(paper.updated_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          )
          .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
          .slice(0, 5)
          .map(paper => ({
            id: `update-${paper.paper_id}`,
            type: 'paper_updated',
            description: `Paper "${paper.title}" status changed to ${paper.status}`,
            time: paper.updated_at,
            icon: <EditIcon />,
            color: '#f59e0b'
          }));
        
        activities.push(...recentUpdates);
        
        // Sort all activities by time and take top 8
        const sortedActivities = activities
          .sort((a, b) => new Date(b.time) - new Date(a.time))
          .map(activity => ({
            ...activity,
            time: timeAgo(activity.time)
          }))
          .slice(0, 8);
        
        setRecentActivity(sortedActivities);
        
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
        
        // Fallback to mock data on error with MUI icons
        setRecentActivity([
          { 
            id: 1, 
            type: 'course_added', 
            description: 'New course "Advanced React" added', 
            time: '2 hours ago', 
            icon: <BookIcon />,
            color: '#4f46e5'
          },
          { 
            id: 2, 
            type: 'moderation_approved', 
            description: 'Paper "Web Development" approved', 
            time: '5 hours ago', 
            icon: <CheckCircleIcon />,
            color: '#10b981'
          },
          { 
            id: 3, 
            type: 'co_added', 
            description: 'New Course Outcomes added', 
            time: '1 day ago', 
            icon: <TrendingUpIcon />,
            color: '#8b5cf6'
          },
          { 
            id: 4, 
            type: 'moderation_pending', 
            description: 'Paper "Data Structures" awaiting review', 
            time: '2 days ago', 
            icon: <HourglassIcon />,
            color: '#f59e0b'
          }
        ]);
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
        <p className="dashboard-subtitle">Welcome to the admin panel. Here's what's happening.</p>
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
          <div className="section-header-icon">
            <h2>Recent Activity</h2>
          </div>
        </div>
        
        {loading ? (
          <div className="activity-loading">
            <div className="loading-spinner"></div>
            <p>Loading activities...</p>
          </div>
        ) : (
          <div className="activity-list">
            {recentActivity.length === 0 ? (
              <div className="no-activities">
                <p>No recent activities found.</p>
              </div>
            ) : (
              recentActivity.map((activity) => (
                <div key={activity.id} className="activity-item">
                  <div 
                    className="activity-icon" 
                    style={{ 
                      backgroundColor: `${activity.color}20`,
                      border: `1px solid ${activity.color}40`
                    }}
                  >
                    <div className="activity-icon-wrapper">
                      {activity.icon}
                    </div>
                  </div>
                  <div className="activity-content">
                    <p className="activity-description">{activity.description}</p>
                    <span className="activity-time">{activity.time}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;