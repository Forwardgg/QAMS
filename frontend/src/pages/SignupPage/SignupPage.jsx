// src/pages/SignupPage/SignupPage.jsx
import React, { useState } from 'react';
import Button from '../../components/Button/Button';
import './SignupPage.css';
import { useNavigate } from 'react-router-dom'; // Uncommented

const SignupPage = () => {
  // State for form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('');

  // State for loading and errors
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate(); // Now properly imported and used

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }
    if (!role) {
      setError("Please select a role.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Signup failed. Please try again.');
      }

      // SIGNUP SUCCESSFUL
      console.log('Signup successful:', data);
      alert('Signup successful! Please log in.');

      // Clear form fields
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setRole('');
      
      // Redirect to login page
      navigate('/auth'); // Now properly redirects

    } catch (err) {
      console.error('Signup error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-form-wrapper">
      <div className="card signup-card">
        <img src="/logo.png" alt="University Logo" className="signup-logo" />
        <h2>TEZPUR UNIVERSITY</h2>
        <h3>QAMS - Sign Up</h3>
        <form onSubmit={handleSignup} className="signup-form">
          <div className="form-group">
            <select
              id="signup-role-select"
              className="form-control"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
            >
              <option value="" disabled>Select Your Role</option>
              <option value="instructor">Instructor</option>
              <option value="moderator">Moderator</option>
            </select>
          </div>
          <div className="form-group">
            <input
              type="text"
              className="form-control"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength="2"
            />
          </div>
          <div className="form-group">
            <input
              type="email"
              className="form-control"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <input
              type="password"
              className="form-control"
              placeholder="Password (min. 8 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength="8"
            />
          </div>
          <div className="form-group">
            <input
              type="password"
              className="form-control"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength="8"
            />
          </div>

          {/* Display error message if it exists */}
          {error && <p style={{ color: 'red', fontSize: '0.9rem' }}>{error}</p>}
          
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'SIGNING UP...' : 'SIGN UP'}
          </Button>
          <a href="/auth" className="login-link">Already have an account? Login</a>
        </form>
      </div>
    </div>
  );
};

export default SignupPage;