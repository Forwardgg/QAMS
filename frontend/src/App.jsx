import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthContainerPage from './pages/AuthContainerPage/AuthContainerPage';
import AdminDashboard from './pages/AdminDashboard/AdminDashboard';
import AdminCourseManagement from './pages/AdminCourseManagement/AdminCourseManagement'; 
import AdminUserManagement from './pages/AdminUserManagement/AdminUserManagement';
import AdminUserLogs from './pages/AdminUserLogs/AdminUserLogs';
import InstructorDashboard from './pages/InstructorDashboard/InstructorDashboard';
import InstructorMyQuestions from './pages/InstructorMyQuestions/InstructorMyQuestions';
import ModeratorDashboard from './pages/ModeratorDashboard/ModeratorDashboard';
import ModeratorPending from './pages/ModeratorPending/ModeratorPending';
import InstructorMyCourses from './pages/InstructorMyCourses/InstructorMyCourses';
import ForgotPassword from './pages/ForgotPassword/ForgotPassword';
function App() {
  // For now, we'll simulate a logged-in state and role
  const isAuthenticated = true; // Set to true to see dashboard, false to see auth pages
  const userRole = "admin"; // 'admin', 'instructor', 'moderator'
  //const userRole = "instructor";
   const getDefaultDashboardPath = (role) => {
    switch (role) {
      case 'admin':
        return '/admin/dashboard';
      case 'instructor':
        return '/instructor/dashboard';
      case 'moderator':
        return '/moderator/dashboard';
      default:
        return '/auth'; // Fallback if role is not recognized
    }
  };
  return (
    
    <Router>
      
      <Routes>
        {/* Public/Auth Routes */}
        <Route path="/auth" element={<AuthContainerPage />} />
        <Route path="/login" element={<Navigate to="/auth" replace />} />
        <Route path="/signup" element={<Navigate to="/auth" replace />} />

        <Route path="/forgot-password" element={<ForgotPassword/>} />
        {/* Protected Routes - Example for Admin Dashboard */}
        <Route
          path="/admin/dashboard"
          element={
            isAuthenticated && userRole === 'admin' ? (
              <AdminDashboard />
            ) : (
              <Navigate to="/auth" replace /> // Redirect if not authenticated or not admin
            )
          }
        />
      <Route
  path="/admin/dashboard"
  element={
    isAuthenticated && userRole === 'admin' ? (
      <AdminDashboard />
    ) : (
      <Navigate to="/auth" replace />
    )
  }
/>
<Route // <--- ADD THIS NEW ROUTE
  path="/admin/courses"
  element={
    isAuthenticated && userRole === 'admin' ? (
      <AdminCourseManagement />
    ) : (
      <Navigate to="/auth" replace />
    )
  }
/>
<Route // <--- ADD THIS NEW ROUTE
         path="/admin/users"
          element={
            isAuthenticated && userRole === 'admin' ? (
              <AdminUserManagement />
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />
        <Route // <--- ADD THIS NEW ROUTE
          path="/admin/logs"
          element={
            isAuthenticated && userRole === 'admin' ? (
              <AdminUserLogs />
            ) : (
              <Navigate to="/auth" replace />
           )
         }
        />
        <Route // <--- ADD THIS NEW ROUTE
          path="/instructor/dashboard"
          element={
            isAuthenticated && userRole === 'instructor' ? (
              <InstructorDashboard />
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />
         <Route // <--- ADD THIS NEW ROUTE
          path="/instructor/my-questions"
          element={
            isAuthenticated && userRole === 'instructor' ? (
              <InstructorMyQuestions />
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />
         {/* Moderator Routes */}
+        <Route // <--- ADD THIS NEW ROUTE
          path="/moderator/dashboard"
          element={
            isAuthenticated && userRole === 'moderator' ? (
              <ModeratorDashboard />
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />
        <Route // <--- ADD THIS NEW ROUTE
         path="/moderator/pending"
         element={
           isAuthenticated && userRole === 'moderator' ? (
             <ModeratorPending />
           ) : (
             <Navigate to="/auth" replace />
           )
         }
       />
        <Route // <--- ADD THIS NEW ROUTE
         path="/instructor/my-courses"
         element={
           isAuthenticated && userRole === 'instructor' ? (
             <InstructorMyCourses />
           ) : (
             <Navigate to="/auth" replace />
           )
         }
       />
       +       <Route
         path="/"
         element={
           isAuthenticated ? (
             <Navigate to={getDefaultDashboardPath(userRole)} replace />
           ) : (
             <Navigate to="/auth" replace />
           )
         }
      />

        {/* Default Route */}
        <Route path="/" element={<Navigate to={isAuthenticated ? "/admin/dashboard" : "/auth"} replace />} />

      </Routes>
    </Router>
  );
}

export default App;