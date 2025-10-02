import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/Button/Button";
import "./SignupPage.css";

const SignupPage = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSignup = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match!");
      return;
    }

    if (!role) {
      setErrorMsg("Please select a role.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email: email.toLowerCase(),
          password,
          role: role.toLowerCase(),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Signup successful! Please login.");
        navigate("/auth");
      } else {
        setErrorMsg(data.error || "Signup failed");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Server error, please try again later.");
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
          {errorMsg && <div className="error-msg">{errorMsg}</div>}

          <div className="form-group">
            <select
              id="signup-role-select"
              className="form-control"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
            >
              <option value="" disabled>
                Select Your Role
              </option>
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
              placeholder="Password (min 8 chars)"
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

          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? "Signing Up..." : "SIGN UP"}
          </Button>

          <a href="/auth" className="login-link">
            Already have an account? Login
          </a>
        </form>
      </div>
    </div>
  );
};

export default SignupPage;
