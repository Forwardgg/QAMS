import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import moderatorAPI from '../../api/moderator.api';

// Import MUI Icons
import {
  Description as DescriptionIcon,
  Assessment as AssessmentIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  Close as CloseIcon,
  PlayArrow as PlayArrowIcon,
  MenuBook as MenuBookIcon,
  TrendingUp as TrendingUpIcon,
  Download as DownloadIcon,
  Circle as CircleIcon,
  Check as CheckIcon,
  Close as CloseIconSmall,
  History as HistoryIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';

import './Dashboard.css';

const ModeratorDashboard = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    pendingPapers: 0,
    activeModerations: 0,
    completedReviews: 0,
    recentActivity: [],
    stats: {
      totalModerations: 0,
      approvedCount: 0,
      rejectedCount: 0,
      pendingCount: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch papers for moderation
      const papersResponse = await moderatorAPI.getPapers();
      const pendingPapers = papersResponse.data?.filter(paper => 
        paper.status === 'submitted'
      ).length || 0;

      // Fetch moderation history
      const historyResponse = await moderatorAPI.getModerationHistory();
      const moderations = historyResponse.data || [];
      
      const activeModerations = moderations.filter(m => m.status === 'pending').length;
      const completedReviews = moderations.filter(m => 
        m.status === 'approved' || m.status === 'rejected'
      ).length;

      // Get recent activity
      const recentActivity = moderations
        .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
        .slice(0, 5)
        .map(mod => ({
          id: mod.moderation_id,
          paperTitle: mod.paper_title || 'Untitled Paper',
          courseCode: mod.course_code || 'N/A',
          status: mod.status,
          date: new Date(mod.updated_at).toLocaleDateString(),
          time: new Date(mod.updated_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        }));

      // Calculate stats
      const statsData = {
        totalModerations: moderations.length,
        approvedCount: moderations.filter(m => m.status === 'approved').length,
        rejectedCount: moderations.filter(m => m.status === 'rejected').length,
        pendingCount: moderations.filter(m => m.status === 'pending').length
      };

      setDashboardData({
        pendingPapers,
        activeModerations,
        completedReviews,
        recentActivity,
        stats: statsData
      });

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleStartNewModeration = () => {
    navigate('/moderator/moderation/papers');
  };

  const handleViewCourses = () => {
    navigate('/moderator/courses');
  };

  const handleViewCOs = () => {
    navigate('/moderator/cos');
  };

  const handleDownloadReports = () => {
    navigate('/moderator/moderation/papers');
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'approved': return 'status-approved';
      case 'pending': return 'status-pending';
      case 'rejected': return 'status-rejected';
      default: return '';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckIcon sx={{ fontSize: 14 }} />;
      case 'pending': return <CircleIcon sx={{ fontSize: 10 }} />;
      case 'rejected': return <CloseIconSmall sx={{ fontSize: 14 }} />;
      default: return <CircleIcon sx={{ fontSize: 10 }} />;
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Moderator Dashboard</h1>
          <p className="dashboard-subtitle">Welcome back! Here's your moderation overview</p>
        </div>
        <button className="refresh-btn" onClick={fetchDashboardData} title="Refresh">
          <RefreshIcon sx={{ fontSize: 20 }} />
        </button>
      </div>

      {error && (
        <div className="error-alert">
          <span className="error-icon">
            <WarningIcon sx={{ fontSize: 18 }} />
          </span>
          <span className="error-message">{error}</span>
          <button className="error-close" onClick={() => setError(null)}>
            <CloseIcon sx={{ fontSize: 18 }} />
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stats-card">
          <div className="stats-icon">
            <DescriptionIcon sx={{ fontSize: 32, color: '#4f46e5' }} />
          </div>
          <div className="stats-content">
            <h3 className="stats-number">{dashboardData.pendingPapers}</h3>
            <p className="stats-label">PENDING PAPERS</p>
            <p className="stats-description">Papers waiting for moderation</p>
          </div>
        </div>

        <div className="stats-card">
          <div className="stats-icon">
            <AssessmentIcon sx={{ fontSize: 32, color: '#f59e0b' }} />
          </div>
          <div className="stats-content">
            <h3 className="stats-number">{dashboardData.activeModerations}</h3>
            <p className="stats-label">ACTIVE MODERATIONS</p>
            <p className="stats-description">Currently moderating</p>
          </div>
        </div>

        <div className="stats-card">
          <div className="stats-icon">
            <CheckCircleIcon sx={{ fontSize: 32, color: '#10b981' }} />
          </div>
          <div className="stats-content">
            <h3 className="stats-number">{dashboardData.completedReviews}</h3>
            <p className="stats-label">COMPLETED REVIEWS</p>
            <p className="stats-description">Total moderated papers</p>
          </div>
        </div>
      </div>

      {/* Statistics Panel */}
      <div className="statistics-panel">
        <h2 className="section-title">Moderation Statistics</h2>
        <div className="stats-grid-inner">
          <div className="stat-item">
            <h3 className="stat-number">{dashboardData.stats.totalModerations}</h3>
            <p className="stat-label">Total Moderations</p>
          </div>
          <div className="stat-item">
            <h3 className="stat-number stat-success">{dashboardData.stats.approvedCount}</h3>
            <p className="stat-label">Approved</p>
          </div>
          <div className="stat-item">
            <h3 className="stat-number stat-error">{dashboardData.stats.rejectedCount}</h3>
            <p className="stat-label">Rejected</p>
          </div>
          <div className="stat-item">
            <h3 className="stat-number stat-warning">{dashboardData.stats.pendingCount}</h3>
            <p className="stat-label">In Progress</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions-panel">
        <h2 className="section-title">Quick Actions</h2>
        <div className="actions-grid">
          <button 
            className="action-btn action-btn-primary" 
            onClick={handleStartNewModeration}
          >
            <span className="action-icon">
              <PlayArrowIcon sx={{ fontSize: 24 }} />
            </span>
            <span className="action-title">Start New Moderation</span>
            {dashboardData.pendingPapers > 0 && (
              <span className="action-badge">{dashboardData.pendingPapers}</span>
            )}
          </button>

          <button 
            className="action-btn" 
            onClick={handleViewCourses}
          >
            <span className="action-icon">
              <MenuBookIcon sx={{ fontSize: 24 }} />
            </span>
            <span className="action-title">View Courses</span>
          </button>

          <button 
            className="action-btn" 
            onClick={handleViewCOs}
          >
            <span className="action-icon">
              <TrendingUpIcon sx={{ fontSize: 24 }} />
            </span>
            <span className="action-title">View COs</span>
          </button>

          <button 
            className="action-btn" 
            onClick={handleDownloadReports}
          >
            <span className="action-icon">
              <DownloadIcon sx={{ fontSize: 24 }} />
            </span>
            <span className="action-title">Download Reports</span>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="recent-activity-panel">
        <div className="activity-header">
          <h2 className="section-title">Recent Activity</h2>
          <button 
            className="view-all-btn"
            onClick={() => navigate('/moderator/moderation/papers')}
          >
            <VisibilityIcon sx={{ fontSize: 16, marginRight: 1 }} />
            View All
          </button>
        </div>
        
        {dashboardData.recentActivity.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <HistoryIcon sx={{ fontSize: 48, color: '#94a3b8' }} />
            </div>
            <p className="empty-text">No recent moderation activity found.</p>
          </div>
        ) : (
          <div className="activity-list">
            {dashboardData.recentActivity.map((activity, index) => (
              <div 
                key={activity.id} 
                className="activity-item"
              >
                <div className={`activity-icon ${getStatusClass(activity.status)}`}>
                  {getStatusIcon(activity.status)}
                </div>
                <div className="activity-content">
                  <h4 className="activity-title">{activity.paperTitle}</h4>
                  <div className="activity-meta">
                    <span className="activity-chip course-chip">{activity.courseCode}</span>
                    <span className={`activity-chip status-chip ${getStatusClass(activity.status)}`}>
                      {activity.status}
                    </span>
                    <span className="activity-time">{activity.date} at {activity.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ModeratorDashboard;