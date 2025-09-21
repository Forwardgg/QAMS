// src/pages/LoginPage/LoginPage.jsx
import React, { useState } from 'react'; // Make sure useState is imported
import Button from '../../components/Button/Button';
import './LoginPage.css';

const LoginPage = () => {
  // State for all form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('instructor'); // Default role is 'instructor'

  const handleLogin = (e) => {
    e.preventDefault(); // Prevents the form from reloading the page
    
    // Log all the captured data
    console.log(`Login attempt with Email: ${email}, Password: [hidden], Role: ${role}`);
    
    // In a real application, you would send this data to a backend for authentication.
    // For now, we'll just show an alert.
    alert(`Simulating login for role: ${role}. In a real app, you would now be redirected.`);
  };

  return (
    <div className="login-form-wrapper"> {/* Note: We are using the wrapper class */}
      <div className="card login-card">
        <img src="/logo.png" alt="University Logo" className="login-logo" />
        <h2>TEZPUR UNIVERSITY</h2>
        <h3>QAMS - Login</h3>
        <form onSubmit={handleLogin} className="login-form">
            {/* ## ADD THIS NEW DROPDOWN ## */}
            
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
          {/* ## END OF NEW DROPDOWN ## */}

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
          
        
          <Button type="submit" variant="primary">
            LOGIN
          </Button>
          <a href="/forgot-password" className="forgot-password">Forgot Password?</a>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;