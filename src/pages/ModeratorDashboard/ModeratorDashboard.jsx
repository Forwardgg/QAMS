// src/pages/ModeratorDashboard/ModeratorDashboard.jsx
import React from 'react';
import MainLayout from '../../layouts/MainLayout/MainLayout';
import Button from '../../components/Button/Button';
import './ModeratorDashboard.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHourglassHalf, faCheckCircle, faTimesCircle, faComments } from '@fortawesome/free-solid-svg-icons';

const ModeratorDashboard = () => {
  // Dummy data for moderator's overview
  const moderatorInfo = {
    name: 'Mr. David Lee',
    pendingModerations: 12,
    approvedLastWeek: 35,
    rejectedLastWeek: 5,
    recentActivity: [
      { id: 1, type: 'approval', message: 'Approved question "Binary Search Algorithm".', timestamp: '1 hour ago' },
      { id: 2, type: 'rejection', message: 'Rejected question "Simple Arithmetic" (low quality).', timestamp: '4 hours ago' },
      { id: 3, type: 'pending', message: 'New question "Graph Traversal" added by Dr. Sharma.', timestamp: 'yesterday' },
    ],
  };

  const handleGoToPending = () => {
    console.log('Navigate to Pending Moderations page');
    alert('Navigating to Pending Moderations!');
    // In a real app, you'd navigate: navigate('/moderator/pending');
  };

  return (
    <MainLayout role="moderator" username={moderatorInfo.name}>
      <div className="moderator-dashboard-page">
        <h2>Moderator Dashboard</h2>

        <div className="dashboard-grid">
          <div className="stat-card">
            <FontAwesomeIcon icon={faHourglassHalf} />
            <h4>Pending Moderations</h4>
            <p>{moderatorInfo.pendingModerations}</p>
          </div>
          <div className="stat-card">
            <FontAwesomeIcon icon={faCheckCircle} />
            <h4>Approved (Last Week)</h4>
            <p>{moderatorInfo.approvedLastWeek}</p>
          </div>
          <div className="stat-card">
            <FontAwesomeIcon icon={faTimesCircle} />
            <h4>Rejected (Last Week)</h4>
            <p>{moderatorInfo.rejectedLastWeek}</p>
          </div>
          <div className="stat-card">
            <FontAwesomeIcon icon={faComments} />
            <h4>Feedback Provided</h4>
            <p>15</p> {/* Example static data */}
          </div>
        </div>

        <div className="d-flex gap-md" style={{ marginBottom: 'var(--spacing-xl)' }}>
          <Button variant="primary" onClick={handleGoToPending}>
            <FontAwesomeIcon icon={faHourglassHalf} style={{ marginRight: '8px' }} />
            Review Pending Questions
          </Button>
          {/* Add more quick action buttons if needed */}
        </div>

        <div className="recent-activity-box card">
          <h3>Recent Moderation Activity</h3>
          <div className="activity-list">
            {moderatorInfo.recentActivity.map(activity => (
              <div key={activity.id} className="activity-item">
                <span className={`activity-status-badge activity-${activity.type}`}>{activity.type.toUpperCase()}</span>
                <span className="activity-message">{activity.message}</span>
                <span className="activity-timestamp">{activity.timestamp}</span>
              </div>
            ))}
            {moderatorInfo.recentActivity.length === 0 && (
              <p className="no-data-message">No recent moderation activity.</p>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ModeratorDashboard;