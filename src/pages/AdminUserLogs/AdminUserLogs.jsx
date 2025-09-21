// src/pages/AdminSystemLogs/AdminSystemLogs.jsx
import React from 'react';
import MainLayout from '../../layouts/Mainlayout/MainLayout';
import './AdminUserLogs.css';

const AdminUserLogs = () => {
  // Dummy log data
  const logs = [
    { id: 1, timestamp: '2023-10-27 10:30:00', level: 'INFO', message: 'User John Doe logged in.' },
    { id: 2, timestamp: '2023-10-27 10:35:15', level: 'WARN', message: 'Failed login attempt for user "unknown".' },
    { id: 3, timestamp: '2023-10-27 10:40:05', level: 'ERROR', message: 'Database connection lost.' },
    { id: 4, timestamp: '2023-10-27 10:42:30', level: 'INFO', message: 'Course CS401 updated by Admin.' },
  ];

  return (
    <MainLayout role="admin" username="Admin User">
      <div className="admin-system-logs-page">
        <h2>System Logs</h2>

        <div className="log-filters" style={{ marginBottom: 'var(--spacing-xl)' }}>
          {/* Placeholder for filter controls like date range, log level */}
          <input type="date" className="form-control" style={{ marginRight: 'var(--spacing-md)', width: 'auto' }} />
          <select className="form-control" style={{ width: 'auto' }}>
            <option>All Levels</option>
            <option>INFO</option>
            <option>WARN</option>
            <option>ERROR</option>
          </select>
        </div>

        <div className="system-logs-list card">
          <h3>Recent Logs</h3>
          <div className="log-header">
            <span>Timestamp</span>
            <span>Level</span>
            <span>Message</span>
          </div>
          {logs.map(log => (
            <div key={log.id} className={`log-item log-level-${log.level.toLowerCase()}`}>
              <span>{log.timestamp}</span>
              <span className={`log-level-badge level-${log.level.toLowerCase()}`}>{log.level}</span>
              <span>{log.message}</span>
            </div>
          ))}
          {logs.length === 0 && <p className="no-data-message">No logs available.</p>}
        </div>
      </div>
    </MainLayout>
  );
};

export default AdminUserLogs;