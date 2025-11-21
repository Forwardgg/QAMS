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
 *  - If AuthProvider is still initializing, returns null (you can replace with a spinner)
 *  - If not authenticated -> redirects to /auth/login and stores original location in state
 *  - If requireRole provided and user doesn't have it -> shows simple unauthorized message
 */
const RequireAuth = ({ children, requireRole = null }) => {
  const auth = useContext(AuthContext);
  const location = useLocation();

  // While auth is being initialized on app load, show nothing (or spinner)
  if (auth?.isInitializing) {
    return null; // replace with a spinner component if you have one
  }

  if (!auth?.isAuthenticated) {
    // redirect to login, preserve attempted location
    return <Navigate to="/auth/login" replace state={{ from: location }} />;
  }

  // Role checks
  if (requireRole) {
    const userRole = (auth.user?.role || "").toLowerCase();
    if (Array.isArray(requireRole)) {
      const normalized = requireRole.map((r) => (r || "").toLowerCase());
      if (!normalized.includes(userRole)) {
        return <div style={{ padding: 24 }}>Unauthorized — you do not have access to this page.</div>;
      }
    } else {
      if ((requireRole || "").toLowerCase() !== userRole) {
        return <div style={{ padding: 24 }}>Unauthorized — you do not have access to this page.</div>;
      }
    }
  }

  return children;
};

export default RequireAuth;
