// src/pages/SignupPage/SignupPage.jsx
import React, { useState } from 'react';
import Button from '../../components/Button/Button';
import './SignupPage.css';

const SignupPage = () => {
  // State for all form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
   const [mobilenumber, setMobilenumber] = useState('');
  const [department, setDepartment] = useState('');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState(''); // New state for role

  const handleSignup = (e) => {
    e.preventDefault(); // Prevents the form from reloading the page

    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    if (!role) { // Check if a role has been selected
        alert("Please select a role.");
        return;
    }

    // Log all the captured data
    console.log(`Signup attempt for Name: ${name}, Department:${department},Mobilenumber:${mobilenumber} Email: ${email}, Role: ${role}, Password: [hidden]`);
    
    // In a real application, you would send this data to a backend for user registration.
    alert(`Simulating signup for ${name} as a ${role}. Welcome!`);
    
    // Clear form fields after successful signup
    setName('');
    setDepartment('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setRole(''); // Reset role
  };

  return (
    <div className="signup-form-wrapper"> {/* We use the wrapper class */}
      <div className="card signup-card">
        <img src="/logo.png" alt="University Logo" className="signup-logo" />
        <h2>TEZPUR UNIVERSITY</h2>
        <h3>QAMS - Sign Up</h3>
        <form onSubmit={handleSignup} className="signup-form">
          <div className="form-group">
                    <div className="form-group">
            <select
              id="signup-role-select"
              className="form-control"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
            >
              <option value="" disabled selected>Select Your Role</option>
              <option value="admin">Admin</option>
              <option value="instructor">Instructor</option>
              <option value="moderator">Moderator</option>
            </select>
          </div>
            <input
              type="text"
              className="form-control"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>    
          <div className="form-group">
            <input
              type="text"
              className="form-control"
              placeholder="Department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              required
            />
          </div>
           <div className="form-group">
            <input
              type="mobilenumber"
              className="form-control"
              placeholder="Mobile number"
              value={mobilenumber}
              onChange={(e) => setMobilenumber(e.target.value)}
              required
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
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
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
            />
          </div>

          {/* ## ADD THIS NEW DROPDOWN FOR ROLE SELECTION ## */}
  
          {/* ## END OF NEW DROPDOWN ## */}

          <Button type="submit" variant="primary">
            SIGN UP
          </Button>
          <a href="/auth" className="login-link">Already have an account? Login</a>
        </form>
      </div>
    </div>
  );
};

export default SignupPage;