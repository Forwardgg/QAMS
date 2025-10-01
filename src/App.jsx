import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthContainerPage from './pages/AuthContainerPage/AuthContainerPage';
import AdminDashboard from './pages/AdminDashboard/AdminDashboard';
import AdminCourseManagement from './pages/AdminCourseManagement/AdminCourseManagement'; 
import AdminUserManagement from './pages/AdminUserManagement/AdminUserManagement';
import AdminUserLogs from './pages/AdminUserLogs/AdminUserLogs';
import InstructorDashboard from './pages/InstructorDashboard/InstructorDashboard';
import InstructorMyQuestions from './pages/InstructorMyQuestions/InstructorMyQuestions';
import InstructorMyCourses from './pages/InstructorMyCourses/InstructorMyCourses';
import ModeratorDashboard from './pages/ModeratorDashboard/ModeratorDashboard';
import ModeratorPending from './pages/ModeratorPending/ModeratorPending';
import ForgotPassword from './pages/ForgotPassword/ForgotPassword';
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";

function App() {
  const getDefaultDashboardPath = (role) => {
    switch (role) {
      case 'admin':
        return '/admin/dashboard';
      case 'instructor':
        return '/instructor/dashboard';
      case 'moderator':
        return '/moderator/dashboard';
      default:
        return '/auth';
    }
  };

  return (
    <Router>
      <Routes>
        {/* Public/Auth Routes */}
        <Route path="/auth" element={<AuthContainerPage />} />
        <Route path="/login" element={<Navigate to="/auth" replace />} />
        <Route path="/signup" element={<Navigate to="/auth" replace />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/courses"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminCourseManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminUserManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/logs"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminUserLogs />
            </ProtectedRoute>
          }
        />

        {/* Instructor Routes */}
        <Route
          path="/instructor/dashboard"
          element={
            <ProtectedRoute allowedRoles={["instructor"]}>
              <InstructorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/instructor/my-questions"
          element={
            <ProtectedRoute allowedRoles={["instructor"]}>
              <InstructorMyQuestions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/instructor/my-courses"
          element={
            <ProtectedRoute allowedRoles={["instructor"]}>
              <InstructorMyCourses />
            </ProtectedRoute>
          }
        />

        {/* Moderator Routes */}
        <Route
          path="/moderator/dashboard"
          element={
            <ProtectedRoute allowedRoles={["moderator"]}>
              <ModeratorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/moderator/pending"
          element={
            <ProtectedRoute allowedRoles={["moderator"]}>
              <ModeratorPending />
            </ProtectedRoute>
          }
        />

        {/* Root Redirect */}
        <Route
          path="/"
          element={
            localStorage.getItem("role")
              ? <Navigate to={getDefaultDashboardPath(localStorage.getItem("role"))} replace />
              : <Navigate to="/auth" replace />
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
