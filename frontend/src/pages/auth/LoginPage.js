// src/pages/auth/LoginPage.js
import React, { useState, useContext } from 'react';
import './AuthPages.css';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../../components/AuthProvider';
import { getDefaultRoute } from '../../services/roleService';
import logo from '../../assets/images/logo.png';

// Import Material-UI icons
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import SchoolIcon from '@mui/icons-material/School';
import LoginIcon from '@mui/icons-material/Login';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SendIcon from '@mui/icons-material/Send';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import DashboardIcon from '@mui/icons-material/Dashboard';
import DescriptionIcon from '@mui/icons-material/Description';
import ChecklistIcon from '@mui/icons-material/Checklist';
import AnalyticsIcon from '@mui/icons-material/Analytics';

const LoginPage = () => {
  const navigate = useNavigate();
  const auth = useContext(AuthContext);

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await auth.login({
        email: formData.email,
        password: formData.password,
      });

      if (!result.ok) {
        const err = result.error;
        const serverMsg = err?.response?.data?.error || err?.message || 'Login failed';
        setErrors({ submit: serverMsg });
        setIsSubmitting(false);
        return;
      }

      const user = result.data?.user;
      
      if (user?.role) {
        const dashboardPath = getDefaultRoute(user.role);
        navigate(dashboardPath);
      } else {
        navigate('/');
      }

    } catch (err) {
      setErrors({ submit: 'An unexpected error occurred' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e?.preventDefault();
    setForgotMessage(null);
    setForgotLoading(true);
    setErrors({});

    const emailToUse = formData.email;
    if (!emailToUse || !/\S+@\S+\.\S+/.test(emailToUse)) {
      setErrors({ email: 'Enter a valid email to receive reset link' });
      setForgotLoading(false);
      return;
    }

    try {
      const authAPI = await import('../../api/auth.api');
      await authAPI.default.forgotPassword(emailToUse);
      setForgotMessage('If that email exists, a reset link has been sent.');
    } catch (err) {
      const serverMsg = err?.response?.data?.error || err?.message || 'Could not send reset link';
      setErrors({ submit: serverMsg });
    } finally {
      setForgotLoading(false);
    }
  };

  const handleSwitchToRegister = () => {
    navigate('/auth/register');
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="auth-page">
      <div className="auth-left-panel">
        <div className="university-info">
          <img src={logo} alt="Tezpur University" className="university-logo" />
          <div className="university-details">
            <h1>Tezpur University</h1>
            <h2>Question Authoring and Moderation System</h2>
          </div>
        </div>
        <div className="auth-left-content">
          <p className="system-description">
            <br>
            </br> <br>
            </br> <br>
            </br> <br>
            </br> <br>
            </br> <br>
            </br>
            A comprehensive platform for managing, moderating, and generating question papers
            with analytics and reporting capabilities.
          </p>
          <div className="features-list">
            <div className="feature">
              <div className="feature-icon">
                <DashboardIcon />
              </div>
              <span>Course Outcome Mapping</span>
            </div>
            <div className="feature">
              <div className="feature-icon">
                <DescriptionIcon />
              </div>
              <span>Question Paper Generation</span>
            </div>
            <div className="feature">
              <div className="feature-icon">
                <ChecklistIcon />
              </div>
              <span>Moderation System</span>
            </div>
            <div className="feature">
              <div className="feature-icon">
                <AnalyticsIcon />
              </div>
              <span>Analytics & Reports</span>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-right-panel">
        <div className="auth-container">
          <div className="auth-header">
            <div className="auth-header-icon">
              <LoginIcon />
            </div>
            <h1>Welcome Back</h1>
            <p>Sign in to continue to QAMS</p>
          </div>

          {!showForgotPassword ? (
            <>
              <form onSubmit={handleSubmit} className="auth-form">
                <div className="form-group">
                  <label htmlFor="email">
                    <EmailIcon className="input-icon" />
                    <span>Email Address</span>
                  </label>
                  <div className="input-wrapper">
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter your email"
                      className={errors.email ? 'error' : ''}
                    />
                  </div>
                  {errors.email && <span className="error-message">{errors.email}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="password">
                    <LockIcon className="input-icon" />
                    <span>Password</span>
                  </label>
                  <div className="input-wrapper password-wrapper">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter your password"
                      className={errors.password ? 'error' : ''}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={togglePasswordVisibility}
                      tabIndex="-1"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </button>
                  </div>
                  {errors.password && <span className="error-message">{errors.password}</span>}
                </div>

                <div className="form-options">
                  <button
                    type="button"
                    className="forgot-password-btn"
                    onClick={() => {
                      setShowForgotPassword(true);
                      setForgotMessage(null);
                    }}
                  >
                    Forgot Password?
                  </button>
                </div>

                <button
                  type="submit"
                  className="submit-btn"
                  disabled={isSubmitting}
                >
                  <LoginIcon className="btn-icon" />
                  {isSubmitting ? 'Signing In...' : 'Sign In'}
                </button>

                {errors.submit && (
                  <div className="error-message submit-error">
                    <span className="error-icon">!</span>
                    {errors.submit}
                  </div>
                )}
              </form>

              <div className="auth-footer">
                <p className="register-prompt">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    className="register-link"
                    onClick={handleSwitchToRegister}
                  >
                    Create Account
                  </button>
                </p>
              </div>
            </>
          ) : (
            <div className="forgot-password-section">
              <button
                type="button"
                className="back-btn"
                onClick={() => {
                  setShowForgotPassword(false);
                  setForgotMessage(null);
                }}
              >
                <ArrowBackIcon className="back-icon" />
                Back to Login
              </button>

              <div className="forgot-password-header">
                <div className="forgot-password-icon">
                  <LockIcon />
                </div>
                <h2>Reset Your Password</h2>
                <p>Enter your email address and we'll send you a link to reset your password.</p>
              </div>

              <div className="form-group">
                <label htmlFor="resetEmail">
                  <EmailIcon className="input-icon" />
                  <span>Email Address</span>
                </label>
                <div className="input-wrapper">
                  <input
                    type="email"
                    id="resetEmail"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData(prev => ({ ...prev, email: e.target.value }))
                    }
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <button
                className="submit-btn"
                onClick={handleForgotPassword}
                disabled={forgotLoading}
              >
                <SendIcon className="btn-icon" />
                {forgotLoading ? 'Sending...' : 'Send Reset Link'}
              </button>

              {forgotMessage && (
                <div className="success-message">
                  <span className="success-icon">✓</span>
                  {forgotMessage}
                </div>
              )}
              {errors.submit && (
                <div className="error-message submit-error">
                  <span className="error-icon">!</span>
                  {errors.submit}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;