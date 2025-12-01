import React, { lazy, Suspense, useContext } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, AuthContext } from "./components/AuthProvider";
import RequireAuth from "./components/RequireAuth";
import "./App.css";

// Lazy load components
const Login = lazy(() => import("./pages/auth/LoginPage"));
const Register = lazy(() => import("./pages/auth/RegisterPage"));
const ModeratorDashboard = lazy(() => import("./pages/moderator/Dashboard"));

// Admin components
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const DashboardHome = lazy(() => import("./pages/admin/Dashboard"));
const AdminCourses = lazy(() => import("./pages/admin/Courses"));
const AdminCO = lazy(() => import("./pages/admin/COs"));
const ModerationList = lazy(() => import("./pages/admin/moderation/ModerationList"));
const ModReport = lazy(() => import("./pages/admin/moderation/ModReport"));
const QuestionList = lazy(() => import("./pages/admin/moderation/QuestionList"));

// Instructor components
const InstructorLayout = lazy(() => import("./pages/instructor/InstructorLayout"));
const InstructorDashboard = lazy(() => import("./pages/instructor/Dashboard"));
const InstructorCourses = lazy(() => import("./pages/instructor/Courses"));
const InstructorCO = lazy(() => import("./pages/instructor/COs"));
const InstructorQuestionCreate = lazy(() => import("./pages/instructor/QuestionCreate"));
const InstructorQuestionPaperList = lazy(() => import("./pages/instructor/questionpaper/InstructorQuestionPapers"));
const InstructorQuestionPaperForm = lazy(() => import("./pages/instructor/questionpaper/QuestionPaperForm"));
const InstructorQuestionEditModal = lazy(() => import("./pages/instructor/questionpaper/QuestionEditModal"));
const InstructorPaperQuestionManager = lazy(() => import("./pages/instructor/questionpaper/PaperQuestionsManager"));
const InstructorModReportManager = lazy(() => import("./pages/instructor/questionpaper/ModerationReportModal"));

// moderator components
const ModDashboard = lazy(() => import("./pages/moderator/Dashboard"));
const ModCourses = lazy(() => import("./pages/moderator/Courses"));
const ModCO = lazy(() => import("./pages/moderator/COs"));
const ModPaperList = lazy(() => import("./pages/moderator/moderation/PaperList"));
const ModPaperModeration = lazy(() => import("./pages/moderator/moderation/PaperModeration"));
const ModReportModal = lazy(() => import("./pages/moderator/moderation/ModReportModal"));
const ModQuestions = lazy(() => import("./pages/moderator/moderation/QuestionModeration"));

const Loading = () => <div style={{ padding: 24 }}>Loading…</div>;

function AppRoutes() {
  const auth = useContext(AuthContext);

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

            {/* Admin routes with nested layout */}
            <Route
              path="/admin"
              element={
                <RequireAuth requireRole="admin">
                  <AdminLayout />
                </RequireAuth>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<DashboardHome />} />
              <Route path="courses" element={<AdminCourses />} />
              <Route path="cos" element={<AdminCO />} />
              
              {/* Moderation nested routes */}
              <Route path="moderation">
                <Route index element={<Navigate to="list" replace />} />
                <Route path="list" element={<ModerationList />} />
                <Route path="report" element={<ModReport />} />
                <Route path="questions" element={<QuestionList />} />
              </Route>
            </Route>

            {/* Instructor routes with nested layout */}
            <Route
              path="/instructor"
              element={
                <RequireAuth requireRole="instructor">
                  <InstructorLayout />
                </RequireAuth>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<InstructorDashboard />} />
              <Route path="courses" element={<InstructorCourses />} />
              <Route path="cos" element={<InstructorCO />} />
              <Route path="questions/create" element={<InstructorQuestionCreate />} />
              
              {/* Question Papers nested routes */}
              <Route path="question-papers">
                <Route index element={<InstructorQuestionPaperList />} />
                <Route path="create" element={<InstructorQuestionPaperForm />} />
                <Route path="edit/:id" element={<InstructorQuestionEditModal />} />
                <Route path="manage/:id" element={<InstructorPaperQuestionManager />} />
                <Route path="moderation/:id" element={<InstructorModReportManager />} />
              </Route>
            </Route>

            {/* Moderator routes (if they need layout too) */}
            <Route
              path="/moderator"
              element={
                <RequireAuth requireRole="moderator">
                  <ModeratorDashboard />
                </RequireAuth>
              }
            />

            {/* Alternative routes for backward compatibility */}
            <Route
              path="/admin/dashboard"
              element={
                <RequireAuth requireRole="admin">
                  <Navigate to="/admin/dashboard" replace />
                </RequireAuth>
              }
            />
            <Route
              path="/instructor/dashboard"
              element={
                <RequireAuth requireRole="instructor">
                  <Navigate to="/instructor/dashboard" replace />
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
  <Navigate to="/moderator" replace />
                  ) : (
                    <div style={{ padding: 24 }}>Unknown role: {auth.user?.role}</div>
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
                <div style={{ padding: 24, textAlign: "center" }}>
                  <h2>Page Not Found</h2>
                  <button onClick={() => window.history.back()}>Go Back</button>
                </div>
              }
            />
          </Routes>
        </Suspense>
      </main>
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