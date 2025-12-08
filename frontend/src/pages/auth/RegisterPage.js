// src/pages/auth/RegisterPage.js
import React, { useState, useContext } from 'react';
import './AuthPages.css';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../../components/AuthProvider';
import logo from '../../assets/images/logo.png';

// Import Material-UI icons
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import SchoolIcon from '@mui/icons-material/School';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonIcon from '@mui/icons-material/Person';
import BadgeIcon from '@mui/icons-material/Badge';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import DashboardIcon from '@mui/icons-material/Dashboard';
import DescriptionIcon from '@mui/icons-material/Description';
import ChecklistIcon from '@mui/icons-material/Checklist';
import AnalyticsIcon from '@mui/icons-material/Analytics';

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.role) {
      newErrors.role = 'Please select a role';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters long';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    }

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
      let result;
      
      if (auth.register) {
        result = await auth.register({
          role: formData.role,
          name: formData.name,
          email: formData.email,
          password: formData.password,
        });
      } else {
        const authAPI = await import('../../api/auth.api');
        result = await authAPI.default.register({
          role: formData.role,
          name: formData.name,
          email: formData.email,
          password: formData.password,
        });
      }

      if (result && result.ok === false) {
        const errorMsg = result.error?.response?.data?.error || 
                        result.error?.message || 
                        'Registration failed';
        setErrors({ submit: errorMsg });
        setIsSubmitting(false);
        return;
      }

      if (auth.login) {
        const loginResult = await auth.login({
          email: formData.email,
          password: formData.password,
        });

        if (loginResult.ok) {
          const user = auth.user;
          const role = user?.role?.toLowerCase();
          const dashboardPaths = {
            admin: '/admin/dashboard',
            instructor: '/instructor/dashboard',
            moderator: '/moderator/queue'
          };
          navigate(dashboardPaths[role] || '/');
        } else {
          navigate('/auth/login');
        }
      } else {
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

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
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
            Comprehensive platform for managing, moderating, and generating courses and question papers
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
              <PersonAddIcon />
            </div>
            <h1>Create Account</h1>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {/* Role Selection */}
            <div className="form-group">
              <label htmlFor="role">
                <BadgeIcon className="input-icon" />
                <span>Select Role *</span>
              </label>
              <div className="input-wrapper">
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
              </div>
              {errors.role && <span className="error-message">{errors.role}</span>}
            </div>

            {/* Name Field */}
            <div className="form-group">
              <label htmlFor="name">
                <PersonIcon className="input-icon" />
                <span>Full Name *</span>
              </label>
              <div className="input-wrapper">
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className={errors.name ? 'error' : ''}
                />
              </div>
              {errors.name && <span className="error-message">{errors.name}</span>}
            </div>

            {/* Email Field */}
            <div className="form-group">
              <label htmlFor="email">
                <EmailIcon className="input-icon" />
                <span>Email Address *</span>
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

            {/* Password Field */}
            <div className="form-group">
              <label htmlFor="password">
                <LockIcon className="input-icon" />
                <span>Password *</span>
              </label>
              <div className="input-wrapper password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password (min. 8 characters)"
                  className={errors.password ? 'error' : ''}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={togglePasswordVisibility}
                  tabIndex="-1"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {errors.password && <span className="error-message">{errors.password}</span>}
            </div>

            {/* Confirm Password Field */}
            <div className="form-group">
              <label htmlFor="confirmPassword">
                <LockIcon className="input-icon" />
                <span>Confirm Password *</span>
              </label>
              <div className="input-wrapper password-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  className={errors.confirmPassword ? 'error' : ''}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={toggleConfirmPasswordVisibility}
                  tabIndex="-1"
                >
                  {showConfirmPassword ? 'Hide' : 'Show'}
                </button>
              </div>
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
              <PersonAddIcon className="btn-icon" />
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </button>

            {errors.submit && (
              <div className="error-message submit-error">
                <span className="error-icon">!</span>
                {errors.submit}
              </div>
            )}
          </form>

          <div className="auth-footer">
            <p className="login-prompt">
              Already have an account?{' '}
              <button
                type="button"
                className="login-link"
                onClick={handleSwitchToLogin}
              >
                Sign In
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;