// src/layouts/MainLayout/MainLayout.jsx
import React from 'react';
import Sidebar from '../Sidebar/Sidebar'; // <<-- IMPORTANT: Relative path to Sidebar
import './MainLayout.css';

// The 'children' prop will be the content of the specific page (e.g., AdminDashboard)
const MainLayout = ({ children, role, username }) => {
  return (
    <div className="app-container">
      <Sidebar role={role} username={username} /> {/* Pass props to Sidebar */}
      <div className="main-content">
        {children} {/* This is where your page content will be rendered */}
      </div>
    </div>
  );
};

export default MainLayout; // <<-- IMPORTANT: Default export