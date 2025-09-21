// src/pages/AuthContainerPage/AuthContainerPage.jsx
import React, { useState } from 'react';
import LoginPage from '../LoginPage/LoginPage'; // Import the Login component
import SignupPage from '../SignupPage/SignupPage'; // Import the Signup component
import './AuthContainerPage.css'; // Import its CSS

const AuthContainerPage = () => {
  // State to determine which form to show: 'login' or 'signup'
  const [showLogin, setShowLogin] = useState(true); // Start by showing login

  return (
    <div className="auth-container-wrapper">
      <div className="auth-toggle-buttons">
        <button
          className={`auth-toggle-btn ${showLogin ? 'active' : ''}`}
          onClick={() => setShowLogin(true)}
        >
          Login
        </button>
        <button
          className={`auth-toggle-btn ${!showLogin ? 'active' : ''}`}
          onClick={() => setShowLogin(false)}
        >
          Sign Up
        </button>
      </div>

      <div className="auth-forms-area">
        {showLogin ? <LoginPage /> : <SignupPage />}
      </div>
    </div>
  );
};

export default AuthContainerPage;