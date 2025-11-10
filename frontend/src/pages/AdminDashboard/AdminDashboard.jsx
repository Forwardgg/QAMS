// src/pages/AdminDashboard/AdminDashboard.jsx
import React from 'react';
import MainLayout from '../../layouts/Mainlayout/MainLayout';
import Button from '../../components/Button/Button';
import './AdminDashboard.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCubes, faUserTie, faHourglassHalf } from '@fortawesome/free-solid-svg-icons';


const AdminDashboard = () => {
  return (
    // Ensure MainLayout is correctly used as a wrapper
    <MainLayout role="admin" username="John Doe">
      <div className="admin-dashboard-page">
        <h2>System Overview</h2>

        <div className="dashboard-grid">
          <div className="stat-card">
            <FontAwesomeIcon icon={faCubes} />
            <h4>Total Courses</h4>
            <p>45</p>
          </div>
          <div className="stat-card">
            <FontAwesomeIcon icon={faUserTie} />
            <h4>Active Instructors</h4>
            <p>120</p>
          </div>
          <div className="stat-card">
            <FontAwesomeIcon icon={faHourglassHalf} />
            <h4>Pending Moderations</h4>
            <p>15</p>
          </div>
        </div>

        <div className="d-flex gap-md" style={{ marginBottom: 'var(--spacing-xl)' }}>
          <Button variant="primary">Add New Course</Button>
          <Button variant="outline-primary">Create User Account</Button>
        </div>

        <div className="recent-activity-box card">
          <h3>Recent System Activity</h3>
          <div className="activity-item">
            <span>1</span>
            <span>New course 'CS401' added</span>
          </div>
          <div className="activity-item">
            <span>5</span>
            <span>Instructor John Doe created</span>
          </div>
          <div className="activity-item">
            <span>12</span>
            <span>3 questions submitted for 'EE302'</span>
          </div>
          <div className="activity-item">
            <span>15</span>
            <span>User Jane Smith updated course 'ME201'</span>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default AdminDashboard;