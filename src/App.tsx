
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/Login';
import StudentRegistrationPage from './pages/Register';
import AdminRegistrationPage from './pages/Register';
import StudentDashboard from './pages/student/Dashboard';
import AdminDashboard from './pages/admin/Dashboard';
import Profile from './pages/student/Profile';
import Jobs from './pages/student/Jobs';
import Applications from './pages/student/Applications';
import Verification from './pages/admin/Verification';
import VerificationDetail from './pages/admin/VerificationDetail';
import JobManagement from './pages/admin/Jobs';
import JobDetail from './pages/admin/Jobs';
import StudentManagement from './pages/admin/Students';
import Reports from './pages/admin/Reports';
import ApplicationsManagement from './pages/admin/Applications';
import Notifications from './pages/admin/Notifications';
import ProtectedRoute from './components/ProtectedRoute';

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
          <Route path="/student/dashboard" element={<ProtectedRoute requiredRole="student"><StudentDashboard /></ProtectedRoute>} />
          <Route path="/student/profile" element={<ProtectedRoute requiredRole="student"><Profile /></ProtectedRoute>} />
          <Route path="/student/jobs" element={<ProtectedRoute requiredRole="student"><Jobs /></ProtectedRoute>} />
          <Route path="/student/applications" element={<ProtectedRoute requiredRole="student"><Applications /></ProtectedRoute>} />

          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/verification" element={<ProtectedRoute requiredRole="admin"><Verification /></ProtectedRoute>} />
          <Route path="/admin/verification/:id" element={<ProtectedRoute requiredRole="admin"><VerificationDetail /></ProtectedRoute>} />
          <Route path="/admin/jobs" element={<ProtectedRoute requiredRole="admin"><JobManagement /></ProtectedRoute>} />
          <Route path="/admin/jobs/:id" element={<ProtectedRoute requiredRole="admin"><JobDetail /></ProtectedRoute>} />
          <Route path="/admin/students" element={<ProtectedRoute requiredRole="admin"><StudentManagement /></ProtectedRoute>} />
          <Route path="/admin/reports" element={<ProtectedRoute requiredRole="admin"><Reports /></ProtectedRoute>} />
          <Route path="/admin/applications" element={<ProtectedRoute requiredRole="admin"><ApplicationsManagement /></ProtectedRoute>} />
          <Route path="/admin/notifications" element={<ProtectedRoute requiredRole="admin"><Notifications /></ProtectedRoute>} />

          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
