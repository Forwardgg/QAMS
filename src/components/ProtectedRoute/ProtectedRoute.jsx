// src/components/ProtectedRoute/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = sessionStorage.getItem("token");
const role = sessionStorage.getItem("role");

  // Not logged in → go to /auth
  if (!token) {
    return <Navigate to="/auth" replace />;
  }

  // Role restricted → go to /unauthorized
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Authorized → render page
  return children;
};

export default ProtectedRoute;
