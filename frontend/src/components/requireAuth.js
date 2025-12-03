// src/components/RequireAuth.js
import React, { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import AuthContext from "./AuthProvider";

/**
 * RequireAuth
 *
 * Usage:
 *  <RequireAuth>
 *    <ProtectedComponent />
 *  </RequireAuth>
 *
 * Props:
 *  - requireRole (optional): string or array of roles. Example: "admin" or ["admin","instructor"]
 *
 * Behavior:
 *  - If AuthProvider is still initializing, shows loading spinner
 *  - If not authenticated -> redirects to /auth/login and stores original location in state
 *  - If requireRole provided and user doesn't have it -> redirects to appropriate dashboard
 */
const RequireAuth = ({ children, requireRole = null }) => {
  const auth = useContext(AuthContext);
  const location = useLocation();

  // While auth is being initialized on app load, show spinner
  if (auth?.isInitializing) {
    return <div className="loading-spinner">Loading...</div>;
  }

  if (!auth?.isAuthenticated) {
    // redirect to login, preserve attempted location
    return <Navigate to="/auth/login" replace state={{ from: location }} />;
  }

  // Role checks - REDIRECT instead of showing message
  if (requireRole) {
    const userRole = (auth.user?.role || "").toLowerCase();
    let hasRole = false;
    
    if (Array.isArray(requireRole)) {
      const normalized = requireRole.map((r) => (r || "").toLowerCase());
      hasRole = normalized.includes(userRole);
    } else {
      hasRole = (requireRole || "").toLowerCase() === userRole;
    }
    
    if (!hasRole) {
      // Redirect to user's default dashboard based on role
      let redirectPath = "/";
      
      switch(userRole) {
        case "admin":
          redirectPath = "/admin/dashboard";
          break;
        case "instructor":
          redirectPath = "/instructor/dashboard";
          break;
        case "moderator":
          redirectPath = "/moderator/dashboard";
          break;
        default:
          redirectPath = "/";
      }
      
      return <Navigate to={redirectPath} replace />;
    }
  }

  return children;
};

export default RequireAuth;