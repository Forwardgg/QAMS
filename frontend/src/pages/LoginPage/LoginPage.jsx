// src/pages/LoginPage/LoginPage.jsx
import React, { useState } from 'react';
import Button from '../../components/Button/Button';
import './LoginPage.css';
// Import a navigation hook if you are using react-router-dom
// import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  // State for form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('instructor'); // Default role

  // State for loading and errors
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // const navigate = useNavigate(); // Uncomment if using react-router-dom

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed. Please check your credentials.');
      }

      // --- LOGIN SUCCESSFUL ---
      console.log('Login successful:', data);
      
      // In a real app, you would store the token and user data
      // localStorage.setItem('token', data.token);
      // localStorage.setItem('user', JSON.stringify(data.user));

      alert(`Login successful! Welcome, ${data.user.name}.`);
      
      // And redirect to the dashboard
      // navigate('/dashboard'); // Example redirect

    } catch (err) {
      console.error('Login error:', err);
      setError(err.message); // Display the error message to the user
    } finally {
      setLoading(false); // Stop loading
    }
  };

  return (
    <div className="login-form-wrapper">
      <div className="card login-card">
        <img src="/logo.png" alt="University Logo" className="login-logo" />
        <h2>TEZPUR UNIVERSITY</h2>
        <h3>QAMS - Login</h3>
        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="role-select" className="form-label-hidden"><b>Select Role</b></label>
            <hr></hr>
            <br></br>
            <select
              id="role-select"
              className="form-control"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="admin">Admin</option>
              <option value="instructor">Instructor</option>
              <option value="moderator">Moderator</option>
            </select>
          </div>

          <div className="form-group">
            <input
              type="text"
              className="form-control"
              placeholder="Email/Username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <input
              type="password"
              className="form-control"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Display error message if it exists */}
          {error && <p style={{ color: 'red', fontSize: '0.9rem' }}>{error}</p>}
          
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'LOGGING IN...' : 'LOGIN'}
          </Button>
          <a href="/forgot-password" className="forgot-password">Forgot Password?</a>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;