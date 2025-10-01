// src/layouts/MainLayout/MainLayout.jsx
import React from 'react';
import Sidebar from '../Sidebar/Sidebar'; 
import './MainLayout.css';

// The 'children' prop is the content of the specific page (e.g., AdminDashboard)
const MainLayout = ({ children }) => {
  return (
    <div className="app-container">
      {/* Sidebar now pulls role & username from localStorage itself */}
      <Sidebar />
      <div className="main-content">
        {children}
      </div>
    </div>
  );
};

export default MainLayout;
