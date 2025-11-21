import React, { lazy, Suspense, useContext } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, AuthContext } from "./components/AuthProvider";
import RequireAuth from "./components/RequireAuth";
import { checkHealth } from "./services/healthService";
import "./App.css";

// Lazy load only existing components
const Login = lazy(() => import("./pages/auth/LoginPage"));
const Register = lazy(() => import("./pages/auth/RegisterPage"));
const InstructorDashboard = lazy(() => import("./pages/instructor/Dashboard"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const ModeratorDashboard = lazy(() => import("./pages/moderator/Dashboard"));

const Loading = () => <div style={{ padding: 24 }}>Loading…</div>;

function AppRoutes() {
  const auth = useContext(AuthContext);
  const [backendStatus, setBackendStatus] = React.useState("Checking backend...");

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await checkHealth();
        if (mounted) setBackendStatus("✅ Backend connected");
      } catch (err) {
        if (mounted) setBackendStatus("❌ Cannot reach backend");
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (auth.isInitializing) {
    return <Loading />;
  }

  return (
    <div className="App">
      <main>
        <Suspense fallback={<Loading />}>
          <Routes>
            {/* Public routes */}
            <Route 
              path="/auth/login" 
              element={auth.isAuthenticated ? <Navigate to="/" replace /> : <Login />} 
            />
            <Route 
              path="/auth/register" 
              element={auth.isAuthenticated ? <Navigate to="/" replace /> : <Register />} 
            />

            {/* Dashboard routes */}
            <Route 
              path="/admin/dashboard" 
              element={
                <RequireAuth requireRole="admin">
                  <AdminDashboard />
                </RequireAuth>
              } 
            />
            <Route 
              path="/instructor/dashboard" 
              element={
                <RequireAuth requireRole="instructor">
                  <InstructorDashboard />
                </RequireAuth>
              } 
            />
            <Route 
              path="/moderator/dashboard" 
              element={
                <RequireAuth requireRole="moderator">
                  <ModeratorDashboard />
                </RequireAuth>
              } 
            />

            {/* Root route - redirect to appropriate dashboard */}
            <Route 
              path="/" 
              element={
                auth.isAuthenticated ? (
                  auth.user?.role === "admin" ? (
                    <Navigate to="/admin/dashboard" replace />
                  ) : auth.user?.role === "instructor" ? (
                    <Navigate to="/instructor/dashboard" replace />
                  ) : auth.user?.role === "moderator" ? (
                    <Navigate to="/moderator/dashboard" replace />
                  ) : (
                    <div style={{ padding: 24 }}>
                      Unknown role: {auth.user?.role}
                    </div>
                  )
                ) : (
                  <Navigate to="/auth/login" replace />
                )
              } 
            />

            {/* Fallback for unknown routes */}
            <Route 
              path="*" 
              element={
                <div style={{ padding: 24, textAlign: 'center' }}>
                  <h2>Page Not Found</h2>
                  <button onClick={() => window.history.back()}>
                    Go Back
                  </button>
                </div>
              } 
            />
          </Routes>
        </Suspense>
      </main>

      <footer style={{ padding: 12, textAlign: "center", opacity: 0.8 }}>
        Backend status: {backendStatus}
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}