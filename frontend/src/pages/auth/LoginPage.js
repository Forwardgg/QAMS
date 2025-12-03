// src/pages/auth/LoginPage.js
import React, { useState, useContext } from 'react';
import './AuthPages.css';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../../components/AuthProvider';
import { getDefaultRoute } from '../../services/roleService';

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

      // Get user from result (backend returns {token, user})
      const user = result.data?.user;
      
      // Navigate based on user role
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
      // Import authAPI dynamically to avoid circular dependency
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

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>Welcome Back</h1>
          <p>Sign in to QAMS - Tezpur University</p>
        </div>

        {!showForgotPassword ? (
          <>
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="email">Email Address *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  className={errors.email ? 'error' : ''}
                />
                {errors.email && <span className="error-message">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="password">Password *</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className={errors.password ? 'error' : ''}
                />
                {errors.password && <span className="error-message">{errors.password}</span>}
              </div>

              <div className="forgot-password">
                <button
                  type="button"
                  className="link-btn"
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
                {isSubmitting ? 'Signing In...' : 'Sign In'}
              </button>

              {errors.submit && (
                <div className="error-message submit-error">{errors.submit}</div>
              )}
            </form>

            <div className="auth-footer">
              <p>
                Don't have an account?{' '}
                <button
                  type="button"
                  className="link-btn"
                  onClick={handleSwitchToRegister}
                >
                  Create Account
                </button>
              </p>
            </div>
          </>
        ) : (
          <div className="forgot-password-section">
            <h3>Reset Your Password</h3>
            <p>Enter your email address and we'll send you a link to reset your password.</p>

            <div className="form-group">
              <label htmlFor="resetEmail">Email Address</label>
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

            <div style={{ marginTop: 12 }}>
              <button
                className="submit-btn"
                onClick={handleForgotPassword}
                disabled={forgotLoading}
              >
                {forgotLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
              <button
                type="button"
                className="link-btn back-to-login"
                onClick={() => {
                  setShowForgotPassword(false);
                  setForgotMessage(null);
                }}
                style={{ marginLeft: 12 }}
              >
                Back to Login
              </button>
            </div>

            {forgotMessage && (
              <div style={{ marginTop: 12, color: 'green' }}>{forgotMessage}</div>
            )}
            {errors.submit && (
              <div className="error-message submit-error">{errors.submit}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;