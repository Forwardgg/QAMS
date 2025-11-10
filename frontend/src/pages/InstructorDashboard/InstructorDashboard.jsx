// src/pages/InstructorDashboard/InstructorDashboard.jsx
import React from 'react';
import MainLayout from '../../layouts/Mainlayout/MainLayout';
import Button from '../../components/Button/Button';
import './InstructorDashboard.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBookOpen, faQuestionCircle, faCheckCircle, faComments } from '@fortawesome/free-solid-svg-icons';

const InstructorDashboard = () => {
  // Dummy data for instructor's overview
  const instructorInfo = {
    name: 'Dr. Jane Doe',
    assignedCourses: 3,
    totalQuestions: 75,
    pendingQuestions: 5,
    moderatedQuestions: 68,
    recentActivity: [
      { id: 1, type: 'question', message: 'New question "Loops in Python" approved.', timestamp: '2 hours ago' },
      { id: 2, type: 'course', message: 'Course CS201: Data Structures updated.', timestamp: 'yesterday' },
      { id: 3, type: 'feedback', message: 'Feedback received on question "SQL Joins".', timestamp: '3 days ago' },
    ],
  };

  const handleCreateQuestion = () => {
    console.log('Navigate to Create New Question Form/Modal');
    alert('Create New Question feature is coming!');
    // In a real app, you'd navigate: navigate('/instructor/questions/new');
  };

  return (
    <MainLayout role="instructor" username={instructorInfo.name}>
      <div className="instructor-dashboard-page">
        <h2>Instructor Dashboard</h2>

        <div className="dashboard-grid">
          <div className="stat-card">
            <FontAwesomeIcon icon={faBookOpen} />
            <h4>Assigned Courses</h4>
            <p>{instructorInfo.assignedCourses}</p>
          </div>
          <div className="stat-card">
            <FontAwesomeIcon icon={faQuestionCircle} />
            <h4>Total Questions</h4>
            <p>{instructorInfo.totalQuestions}</p>
          </div>
          <div className="stat-card">
            <FontAwesomeIcon icon={faCheckCircle} />
            <h4>Approved Questions</h4>
            <p>{instructorInfo.moderatedQuestions}</p>
          </div>
          <div className="stat-card">
            <FontAwesomeIcon icon={faComments} />
            <h4>Pending Moderation</h4>
            <p>{instructorInfo.pendingQuestions}</p>
          </div>
        </div>

        <div className="d-flex gap-md" style={{ marginBottom: 'var(--spacing-xl)' }}>
          <Button variant="primary" onClick={handleCreateQuestion}>
            <FontAwesomeIcon icon={faQuestionCircle} style={{ marginRight: '8px' }} />
            Create New Question
          </Button>
          {/* Add more quick action buttons if needed */}
        </div>

        <div className="recent-activity-box card">
          <h3>Recent Activity</h3>
          <div className="activity-list">
            {instructorInfo.recentActivity.map(activity => (
              <div key={activity.id} className="activity-item">
                <span className="activity-message">{activity.message}</span>
                <span className="activity-timestamp">{activity.timestamp}</span>
              </div>
            ))}
            {instructorInfo.recentActivity.length === 0 && (
              <p className="no-data-message">No recent activity.</p>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default InstructorDashboard;