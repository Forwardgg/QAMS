// App.js
import React, { useState, useEffect } from 'react';
import './App.css';
import AdminDashboard from './components/AdminDashboard';
import ModeratorDashboard from './components/ModeratorDashboard';
import InstructorDashboard from './components/InstructorDashboard';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';

import { checkHealth } from './services/healthService'; // 👈 backend health check

function App() {
  const [currentView, setCurrentView] = useState('login');
  const [userRole, setUserRole] = useState(null);
  const [userEmail, setUserEmail] = useState('');

  const [backendStatus, setBackendStatus] = useState('Checking backend...');

  // 👇 Backend connection test
  useEffect(() => {
    const testConnection = async () => {
      try {
        const data = await checkHealth();
        console.log('Backend /api/health response:', data);
        setBackendStatus('✅ Backend connected');
      } catch (err) {
        console.error('Error talking to backend:', err);
        setBackendStatus('❌ Cannot reach backend');
      }
    };

    testConnection();
  }, []);

  // Auth: called from LoginPage as onLogin(user)
  const handleLogin = (user) => {
    if (!user) {
      setUserRole(null);
      setUserEmail('');
      setCurrentView('login');
      return;
    }

    const { email, role } = user;
    const normalizedRole = (role || '').toLowerCase();

    setUserEmail(email || '');
    setUserRole(normalizedRole || null);

    // Decide which dashboard to show
    if (normalizedRole === 'admin') {
      setCurrentView('admin');
    } else if (normalizedRole === 'moderator') {
      setCurrentView('moderator');
    } else if (normalizedRole === 'instructor') {
      setCurrentView('instructor');
    } else {
      // fallback (unknown role)
      setCurrentView('login');
    }
  };

  const handleRegister = (userData) => {
    // In real app, this would send data to backend
    console.log('Registration data:', userData);
    // After successful registration, redirect to login
    setCurrentView('login');
    alert('Registration successful! Please login.');
  };

  const handleLogout = () => {
    setUserRole(null);
    setUserEmail('');
    setCurrentView('login');
    // Optionally also clear auth storage here (authAPI.logout())
  };

  // Render the appropriate component based on current view
  const renderCurrentView = () => {
    switch (currentView) {
      case 'login':
        return (
          <LoginPage
            onLogin={handleLogin}
            onSwitchToRegister={() => setCurrentView('register')}
          />
        );
      case 'register':
        return (
          <RegisterPage
            onRegister={handleRegister}
            onSwitchToLogin={() => setCurrentView('login')}
          />
        );
      case 'admin':
        return <AdminDashboard />;
      case 'moderator':
        return <ModeratorDashboard />;
      case 'instructor':
        return <InstructorDashboard />;
      default:
        return (
          <LoginPage
            onLogin={handleLogin}
            onSwitchToRegister={() => setCurrentView('register')}
          />
        );
    }
  };

  return (
    <div className="App">
      {/* Header with user info and logout when logged in */}
      {userRole && (
        <header className="app-header">
          <div className="header-content">
            <div className="user-info">
              <h1>
                QAMS - {userRole.charAt(0).toUpperCase() + userRole.slice(1)} Panel
              </h1>
              <span className="user-email">Welcome, {userEmail}</span>
            </div>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </header>
      )}

      {renderCurrentView()}

      {/* Backend status indicator */}
      <div style={{ marginTop: '20px', fontSize: '0.9rem', opacity: 0.7 }}>
        Backend status: {backendStatus}
      </div>
    </div>
  );
}

export default App;
