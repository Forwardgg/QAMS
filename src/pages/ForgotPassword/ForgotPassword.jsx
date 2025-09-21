// src/pages/ForgotPasswordPage/ForgotPasswordPage.jsx
import React, { useState } from 'react';
import Button from '../../components/Button/Button';
import './ForgotPassword.css';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for redirection

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const navigate = useNavigate(); // Hook to navigate programmatically

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(`Password reset requested for email: ${email}`);
    alert(`If an account exists for ${email}, a password reset link has been sent.`);
    
    // In a real app, after sending the email, you might navigate back to login
    navigate('/auth'); 
  };

  return (
    <div className="forgot-password-wrapper">
      <div className="card forgot-password-card">
        <img src="/logo.png" alt="University Logo" className="forgot-password-logo" />
        <h2>TEZPUR UNIVERSITY</h2>
        <h3>QAMS - Forgot Password?</h3>
        <p>Enter your email address below and we'll send you a link to reset your password.</p>
        <form onSubmit={handleSubmit} className="forgot-password-form">
          <div className="form-group">
            <input
              type="email"
              className="form-control"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <Button type="submit" variant="primary">
            Send Reset Link
          </Button>
          <a href="/auth" className="back-to-login">Back to Login</a>
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;