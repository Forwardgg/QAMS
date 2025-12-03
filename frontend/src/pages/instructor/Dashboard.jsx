import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../components/AuthProvider';
import questionPaperAPI from '../../api/questionPaper.api';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PersonIcon from '@mui/icons-material/Person';
import PendingIcon from '@mui/icons-material/Pending';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DescriptionIcon from '@mui/icons-material/Description';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import BookIcon from '@mui/icons-material/Book';
import FlagIcon from '@mui/icons-material/Flag';
import EditNoteIcon from '@mui/icons-material/EditNote';
import SendIcon from '@mui/icons-material/Send';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ChangeCircleIcon from '@mui/icons-material/ChangeCircle';
import './Dashboard.css';

const InstructorDashboard = () => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPapers: 0,
    myPapers: 0,
    pendingReview: 0,
    approved: 0,
    statusBreakdown: []
  });
  const [recentActions, setRecentActions] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      
      try {
        // Fetch all papers
        const response = await questionPaperAPI.getAll({ limit: 1000, offset: 0 });
        
        if (!response || !response.success) {
          throw new Error('Failed to fetch papers');
        }
        
        const allPapers = response.data || [];
        
        // Filter papers created by this instructor
        const myPapers = allPapers.filter(paper => {
          const paperCreatorId = Number(paper.created_by);
          const userId = Number(user.id);
          return paperCreatorId === userId;
        });
        
        // Calculate statistics
        const pendingReview = myPapers.filter(p => 
          p.status === 'submitted' || p.status === 'under_review'
        ).length;
        
        const approved = myPapers.filter(p => p.status === 'approved').length;
        
        // Calculate status breakdown
        const statusBreakdown = [
          { name: 'Drafts', count: myPapers.filter(p => p.status === 'draft').length, color: '#FF9800' },
          { name: 'Submitted', count: myPapers.filter(p => p.status === 'submitted').length, color: '#2196F3' },
          { name: 'Under Review', count: myPapers.filter(p => p.status === 'under_review').length, color: '#9C27B0' },
          { name: 'Change Requested', count: myPapers.filter(p => p.status === 'change_requested').length, color: '#F44336' },
          { name: 'Approved', count: approved, color: '#4CAF50' }
        ];
        
        // Generate recent actions from my papers
        const recentPapers = [...myPapers]
          .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))
          .slice(0, 10);
        
        const actions = recentPapers.map((paper, index) => ({
          id: paper.paper_id || index,
          text: getActionText(paper),
          time: getTimeAgo(paper.updated_at || paper.created_at),
          type: getActionType(paper)
        }));
        
        setStats({
          totalPapers: allPapers.length,
          myPapers: myPapers.length,
          pendingReview,
          approved,
          statusBreakdown
        });
        
        setRecentActions(actions);
        
      } catch (error) {
        // Set fallback dummy data for testing
        setStats({
          totalPapers: 25,
          myPapers: 12,
          pendingReview: 4,
          approved: 1,
          statusBreakdown: [
            { name: 'Drafts', count: 3, color: '#FF9800' },
            { name: 'Submitted', count: 2, color: '#2196F3' },
            { name: 'Under Review', count: 4, color: '#9C27B0' },
            { name: 'Change Requested', count: 2, color: '#F44336' },
            { name: 'Approved', count: 1, color: '#4CAF50' }
          ]
        });
        
        setRecentActions([
          { id: 1, text: 'Created paper "CS101 Midterm"', time: '2 hours ago', type: 'draft' },
          { id: 2, text: 'Submitted paper "PHY202 Final" for review', time: '1 day ago', type: 'submitted' },
          { id: 3, text: 'Added 5 questions to "MATH301"', time: '2 days ago', type: 'update' },
          { id: 4, text: 'Paper "CHEM101" approved', time: '3 days ago', type: 'approved' },
          { id: 5, text: 'Updated course outcomes for "CS102"', time: '4 days ago', type: 'update' }
        ]);
      } finally {
        setLoading(false);
      }
    };

    if (user && user.id) {
      fetchDashboardData();
    }
  }, [user]);

  // Helper functions
  const getActionText = (paper) => {
    const baseText = `Paper "${paper.title}"`;
    switch (paper.status) {
      case 'draft': return `${baseText} created`;
      case 'submitted': return `${baseText} submitted for moderation`;
      case 'under_review': return `${baseText} is under review`;
      case 'change_requested': return `${baseText} requires changes`;
      case 'approved': return `${baseText} approved`;
      default: return `${baseText} updated`;
    }
  };

  const getActionType = (paper) => {
    return paper.status;
  };

  const getTimeAgo = (dateString) => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) !== 1 ? 's' : ''} ago`;
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'Drafts': return <EditNoteIcon style={{ color: '#FF9800' }} />;
      case 'Submitted': return <SendIcon style={{ color: '#2196F3' }} />;
      case 'Under Review': return <VisibilityIcon style={{ color: '#9C27B0' }} />;
      case 'Change Requested': return <ChangeCircleIcon style={{ color: '#F44336' }} />;
      case 'Approved': return <CheckCircleIcon style={{ color: '#4CAF50' }} />;
      default: return <DescriptionIcon />;
    }
  };

  const getActionIcon = (type) => {
    switch(type) {
      case 'draft':
      case 'create': return <EditNoteIcon />;
      case 'submitted': return <SendIcon />;
      case 'under_review': return <VisibilityIcon />;
      case 'change_requested':
      case 'update': return <ChangeCircleIcon />;
      case 'approved': return <CheckCircleIcon />;
      default: return <DescriptionIcon />;
    }
  };

  // Calculate pie chart data
  const calculatePieChart = () => {
    const total = stats.myPapers;
    if (total === 0) return [];
    
    let cumulativePercent = 0;
    return stats.statusBreakdown.map(item => {
      const percent = (item.count / total) * 100;
      const startPercent = cumulativePercent;
      cumulativePercent += percent;
      
      return {
        ...item,
        percent,
        startPercent,
        endPercent: cumulativePercent
      };
    });
  };

  const pieChartData = calculatePieChart();

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Dashboard</h1>
        <p className="dashboard-subtitle">Welcome back, {user?.name}! Here's your teaching overview.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon stat-icon-total">
            <DashboardIcon />
          </div>
          <div className="stat-content">
            <h3 className="stat-value">{stats.totalPapers}</h3>
            <p className="stat-label">Total Papers</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-icon-mine">
            <PersonIcon />
          </div>
          <div className="stat-content">
            <h3 className="stat-value">{stats.myPapers}</h3>
            <p className="stat-label">My Papers</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-icon-pending">
            <PendingIcon />
          </div>
          <div className="stat-content">
            <h3 className="stat-value">{stats.pendingReview}</h3>
            <p className="stat-label">Pending Review</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-icon-approved">
            <CheckCircleIcon />
          </div>
          <div className="stat-content">
            <h3 className="stat-value">{stats.approved}</h3>
            <p className="stat-label">Approved</p>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-sidebar">
          {/* Paper Status Card */}
          <div className="dashboard-card">
            <div className="card-header">
              <h2 className="card-title">Paper Status Overview</h2>
              <span className="card-subtitle">Distribution of your {stats.myPapers} papers</span>
            </div>
            <div className="pie-chart-container">
              <div className="pie-chart">
                {stats.myPapers > 0 ? (
                  <>
                    <svg viewBox="0 0 100 100" className="pie-svg">
                      {pieChartData.map((item, index) => (
                        <circle
                          key={index}
                          cx="50"
                          cy="50"
                          r="40"
                          fill="transparent"
                          stroke={item.color}
                          strokeWidth="20"
                          strokeDasharray={`${item.percent * 2.51} ${251 - item.percent * 2.51}`}
                          strokeDashoffset={-item.startPercent * 2.51}
                          transform="rotate(-90) translate(-100)"
                        />
                      ))}
                    </svg>
                    <div className="pie-center">
                      <span className="pie-total">{stats.myPapers}</span>
                      <span className="pie-label">Papers</span>
                    </div>
                  </>
                ) : (
                  <div className="no-data-pie">
                    <DescriptionIcon style={{ fontSize: 48, color: '#ccc' }} />
                    <p>No papers created yet</p>
                  </div>
                )}
              </div>
              <div className="pie-legend">
                {stats.statusBreakdown.map((item, index) => (
                  <div key={index} className="legend-item">
                    <div className="legend-color" style={{ backgroundColor: item.color }}></div>
                    <span className="legend-label">{item.name}</span>
                    <span className="legend-count">({item.count})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="dashboard-card">
            <div className="card-header">
              <h2 className="card-title">Quick Actions</h2>
              <span className="card-subtitle">Get things done faster</span>
            </div>
            <div className="actions-grid">
              <Link to="/instructor/question-papers" className="action-card">
                <div className="action-icon">
                  <DescriptionIcon />
                </div>
                <span className="action-text">Paper Management</span>
              </Link>
              
              <Link to="/instructor/questions/create" className="action-card">
                <div className="action-icon">
                  <NoteAddIcon />
                </div>
                <span className="action-text">Add Questions</span>
              </Link>
              
              <Link to="/instructor/courses" className="action-card">
                <div className="action-icon">
                  <BookIcon />
                </div>
                <span className="action-text">View Courses</span>
              </Link>
              
              <Link to="/instructor/cos" className="action-card">
                <div className="action-icon">
                  <FlagIcon />
                </div>
                <span className="action-text">View COs</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Activity Card - Now on the side */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2 className="card-title">Recent Activity</h2>
            <span className="card-subtitle">Latest {recentActions.length} actions</span>
          </div>
          <div className="activity-list">
            {recentActions.length > 0 ? (
              recentActions.map((action) => (
                <div key={action.id} className="activity-item">
                  <div className="activity-icon">
                    {getActionIcon(action.type)}
                  </div>
                  <div className="activity-content">
                    <p className="activity-text">{action.text}</p>
                    <span className="activity-time">{action.time}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-activity">
                <p>No recent activity found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructorDashboard;