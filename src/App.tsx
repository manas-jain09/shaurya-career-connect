import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/Login';
import StudentRegistrationPage from './pages/StudentRegistration';
import AdminRegistrationPage from './pages/AdminRegistration';
import StudentDashboard from './pages/student/Dashboard';
import AdminDashboard from './pages/admin/Dashboard';
import Profile from './pages/student/Profile';
import Jobs from './pages/student/Jobs';
import Applications from './pages/student/Applications';
import Verification from './pages/admin/Verification';
import VerificationDetail from './pages/admin/VerificationDetail';
import JobManagement from './pages/admin/JobManagement';
import JobDetail from './pages/admin/JobDetail';
import StudentManagement from './pages/admin/StudentManagement';
import Reports from './pages/admin/Reports';
import ApplicationsManagement from './pages/admin/ApplicationsManagement';
import Notifications from './pages/admin/Notifications';

const ProtectedRoute = ({ children, role }: { children: React.ReactNode, role: string }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (user.role !== role) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register/student" element={<StudentRegistrationPage />} />
          <Route path="/register/admin" element={<AdminRegistrationPage />} />
          <Route path="/unauthorized" element={<div className="text-center mt-10">Unauthorized</div>} />

          {/* Student Routes */}
          <Route path="/student/dashboard" element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>} />
          <Route path="/student/profile" element={<ProtectedRoute role="student"><Profile /></ProtectedRoute>} />
          <Route path="/student/jobs" element={<ProtectedRoute role="student"><Jobs /></ProtectedRoute>} />
          <Route path="/student/applications" element={<ProtectedRoute role="student"><Applications /></ProtectedRoute>} />

          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/verification" element={<ProtectedRoute role="admin"><Verification /></ProtectedRoute>} />
          <Route path="/admin/verification/:id" element={<ProtectedRoute role="admin"><VerificationDetail /></ProtectedRoute>} />
          <Route path="/admin/jobs" element={<ProtectedRoute role="admin"><JobManagement /></ProtectedRoute>} />
          <Route path="/admin/jobs/:id" element={<ProtectedRoute role="admin"><JobDetail /></ProtectedRoute>} />
          <Route path="/admin/students" element={<ProtectedRoute role="admin"><StudentManagement /></ProtectedRoute>} />
          <Route path="/admin/reports" element={<ProtectedRoute role="admin"><Reports /></ProtectedRoute>} />
          <Route path="/admin/applications" element={<ProtectedRoute role="admin"><ApplicationsManagement /></ProtectedRoute>} />
          <Route path="/admin/notifications" element={<ProtectedRoute role="admin"><Notifications /></ProtectedRoute>} />

          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
