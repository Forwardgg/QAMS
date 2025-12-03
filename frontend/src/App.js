// src/App.js
import AuthContext from "./components/AuthProvider";
import React, { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./components/AuthProvider";
import RequireAuth from "./components/requireAuth";
import "./App.css";

// Lazy load components
const Login = lazy(() => import("./pages/auth/LoginPage"));
const Register = lazy(() => import("./pages/auth/RegisterPage"));

// Moderator components
const ModeratorLayout = lazy(() => import("./pages/moderator/ModeratorLayout"));
const ModDashboard = lazy(() => import("./pages/moderator/Dashboard"));
const ModCourses = lazy(() => import("./pages/moderator/Courses"));
const ModCO = lazy(() => import("./pages/moderator/COs"));
const ModPaperList = lazy(() => import("./pages/moderator/moderation/PaperList"));
const ModPaperModeration = lazy(() => import("./pages/moderator/moderation/PaperModeration"));
const ModReportModal = lazy(() => import("./pages/moderator/moderation/ModReportModal"));
const ModQuestions = lazy(() => import("./pages/moderator/moderation/QuestionModeration"));

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

const Loading = () => <div style={{ padding: 24 }}>Loading…</div>;

export default function App() {
  return (
    <AuthProvider>
      <div className="App">
        <main>
          <Suspense fallback={<Loading />}>
            <Routes>
              {/* Public routes */}
              <Route path="/auth/login" element={<Login />} />
              <Route path="/auth/register" element={<Register />} />

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

              {/* Moderator routes with nested layout */}
              <Route
                path="/moderator"
                element={
                  <RequireAuth requireRole="moderator">
                    <ModeratorLayout />
                  </RequireAuth>
                }
              >
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<ModDashboard />} />
                <Route path="courses" element={<ModCourses />} />
                <Route path="cos" element={<ModCO />} />
                
                {/* Moderation nested routes */}
                <Route path="moderation">
                  <Route index element={<Navigate to="papers" replace />} />
                  <Route path="papers" element={<ModPaperList />} />
                  <Route path="paper/:id" element={<ModPaperModeration />} />
                  <Route path="questions" element={<ModQuestions />} />
                  <Route path="report/:id" element={<ModReportModal />} />
                </Route>
              </Route>

              {/* Alternative direct dashboard routes */}
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
              <Route
                path="/moderator/dashboard"
                element={
                  <RequireAuth requireRole="moderator">
                    <Navigate to="/moderator/dashboard" replace />
                  </RequireAuth>
                }
              />

              {/* Root route - Simple redirect to login */}
              <Route
                path="/"
                element={<Navigate to="/auth/login" replace />}
              />

              {/* Dashboard redirect route */}
              <Route
                path="/dashboard"
                element={
                  <RequireAuth>
                    <DashboardRedirect />
                  </RequireAuth>
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
    </AuthProvider>
  );
}

// Dashboard redirect component - MUST return JSX, not a function
function DashboardRedirect() {
  return (
    <RequireAuth>
      <InnerDashboardRedirect />
    </RequireAuth>
  );
}

// Inner component that uses context
function InnerDashboardRedirect() {
  const auth = React.useContext(AuthContext);
  
  if (auth.isInitializing) {
    return <Loading />;
  }

  const userRole = (auth.user?.role || "").toLowerCase();
  
  switch(userRole) {
    case "admin":
      return <Navigate to="/admin/dashboard" replace />;
    case "instructor":
      return <Navigate to="/instructor/dashboard" replace />;
    case "moderator":
      return <Navigate to="/moderator/dashboard" replace />;
    default:
      return <Navigate to="/" replace />;
  }
}
