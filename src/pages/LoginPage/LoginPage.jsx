import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/Button/Button";
import "./LoginPage.css";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    try {
      setLoading(true);
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase(), password }),
      });

      const data = await res.json();

      if (res.ok) {
        sessionStorage.setItem("token", data.token);
        sessionStorage.setItem("role", data.user.role);
        sessionStorage.setItem("username", data.user.name);

        if (data.user.role === "admin") navigate("/admin/dashboard");
        else if (data.user.role === "instructor") navigate("/instructor/dashboard");
        else if (data.user.role === "moderator") navigate("/moderator/dashboard");
      } else {
        setErrorMsg(data.error || "Invalid login");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Server error, please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-form-wrapper">
      <div className="card login-card">
        <img src="/logo.png" alt="University Logo" className="login-logo" />
        <h2>TEZPUR UNIVERSITY</h2>
        <h3>QAMS - Login</h3>
        <form onSubmit={handleLogin} className="login-form">
          {errorMsg && <div className="error-msg">{errorMsg}</div>}
          <div className="form-group">
            <input
              type="email"
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
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? "Logging in..." : "LOGIN"}
          </Button>
          <a href="/auth/forgot-password" className="forgot-password">
            Forgot Password?
          </a>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
