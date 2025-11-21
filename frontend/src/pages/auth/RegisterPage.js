// src/pages/auth/RegisterPage.js
import React, { useState, useContext } from 'react';
import './AuthPages.css';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../../components/AuthProvider';

const RegisterPage = () => {
  const navigate = useNavigate();
  const auth = useContext(AuthContext);

  const [formData, setFormData] = useState({
    role: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Role validation
    if (!formData.role) {
      newErrors.role = 'Please select a role';
    }

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters long';
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    // Password validation - Backend requires at least 8 characters
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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
      // Use AuthContext register if available, otherwise use authAPI directly
      let result;
      
      if (auth.register) {
        // If AuthProvider has a register method
        result = await auth.register({
          role: formData.role,
          name: formData.name,
          email: formData.email,
          password: formData.password,
        });
      } else {
        // Fallback to direct API call
        const authAPI = await import('../../api/auth.api');
        result = await authAPI.default.register({
          role: formData.role,
          name: formData.name,
          email: formData.email,
          password: formData.password,
        });
      }

      // If we have a result with ok: false, it's an error
      if (result && result.ok === false) {
        const errorMsg = result.error?.response?.data?.error || 
                        result.error?.message || 
                        'Registration failed';
        setErrors({ submit: errorMsg });
        setIsSubmitting(false);
        return;
      }

      // Registration successful - Auto-login the user
      if (auth.login) {
        const loginResult = await auth.login({
          email: formData.email,
          password: formData.password,
        });

        if (loginResult.ok) {
          // Redirect based on role
          const user = auth.user;
          const role = user?.role?.toLowerCase();
          const dashboardPaths = {
            admin: '/admin/dashboard',
            instructor: '/instructor/dashboard',
            moderator: '/moderator/queue'
          };
          navigate(dashboardPaths[role] || '/');
        } else {
          // Login failed after registration - redirect to login
          navigate('/auth/login');
        }
      } else {
        // No auto-login, just go to login page
        navigate('/auth/login');
      }

    } catch (error) {
      console.error('Registration error:', error);
      const serverMsg = error?.response?.data?.error ||
                       error?.response?.data?.message ||
                       error?.message ||
                       'Registration failed. Please try again.';
      setErrors({ submit: serverMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSwitchToLogin = () => {
    navigate('/auth/login');
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>Create Account</h1>
          <p>Join QAMS - Tezpur University</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {/* Role Selection */}
          <div className="form-group">
            <label htmlFor="role">Select Role *</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className={errors.role ? 'error' : ''}
            >
              <option value="">Choose your role</option>
              <option value="instructor">Instructor</option>
              <option value="moderator">Moderator</option>
            </select>
            {errors.role && <span className="error-message">{errors.role}</span>}
          </div>

          {/* Name Field */}
          <div className="form-group">
            <label htmlFor="name">Full Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              className={errors.name ? 'error' : ''}
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>

          {/* Email Field */}
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

          {/* Password Field */}
          <div className="form-group">
            <label htmlFor="password">Password *</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a password (min. 8 characters)"
              className={errors.password ? 'error' : ''}
            />
            {errors.password && <span className="error-message">{errors.password}</span>}
            <small className="password-hint">Minimum 8 characters required</small>
          </div>

          {/* Confirm Password Field */}
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password *</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              className={errors.confirmPassword ? 'error' : ''}
            />
            {errors.confirmPassword && (
              <span className="error-message">{errors.confirmPassword}</span>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating Account...' : 'Create Account'}
          </button>

          {errors.submit && (
            <div className="error-message submit-error">{errors.submit}</div>
          )}
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <button type="button" className="link-btn" onClick={handleSwitchToLogin}>
              Sign In
            </button>
          </p>
        </div>

        <div className="auth-info">
          <p><strong>Note:</strong> Admin accounts are created by system administrators only.</p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;