// src/pages/LoginPage/LoginPage.jsx
import React, { useState } from 'react';
import Button from '../../components/Button/Button';
import './LoginPage.css';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        sessionStorage.setItem("token", data.token);
sessionStorage.setItem("role", data.user.role);
sessionStorage.setItem("username", data.user.name);
 
        alert("Login successful!");

        if (data.user.role === "admin") window.location.href = "/admin/dashboard";
        else if (data.user.role === "instructor") window.location.href = "/instructor/dashboard";
        else if (data.user.role === "moderator") window.location.href = "/moderator/dashboard";
      } else {
        alert(data.error || "Invalid login");
      }
    } catch (err) {
      console.error(err);
      alert("Server error, please try again later.");
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
            <input
              type="text"
              className="form-control"
              placeholder="Email"
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
