
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import Index from './pages/Index';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/admin/Dashboard';
import Verification from './pages/admin/Verification';
import VerificationDetail from './pages/admin/VerificationDetail';
import Jobs from './pages/admin/Jobs';
import Students from './pages/admin/Students';
import Reports from './pages/admin/Reports';
import StudentDashboard from './pages/student/Dashboard';
import Profile from './pages/student/Profile';
import StudentJobs from './pages/student/Jobs';
import StudentApplications from './pages/student/Applications';
import Notifications from './pages/student/Notifications';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import Applications from './pages/admin/Applications';
import CompanyDashboard from './pages/company/Dashboard';
import CompanyJobs from './pages/company/Jobs';
import CompanyApplications from './pages/company/Applications';

function App() {
  const theme = localStorage.getItem('theme') || 'light';

  return (
    <AuthProvider>
      <ThemeProvider initialTheme={theme as 'light' | 'dark'}>
        <Router>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route path="/admin/dashboard" element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/verification" element={
              <ProtectedRoute requiredRole="admin">
                <Verification />
              </ProtectedRoute>
            } />
            <Route path="/admin/verification/:id" element={
              <ProtectedRoute requiredRole="admin">
                <VerificationDetail />
              </ProtectedRoute>
            } />
            <Route path="/admin/jobs" element={
              <ProtectedRoute requiredRole="admin">
                <Jobs />
              </ProtectedRoute>
            } />
            <Route path="/admin/applications" element={
              <ProtectedRoute requiredRole="admin">
                <Applications />
              </ProtectedRoute>
            } />
            <Route path="/admin/students" element={
              <ProtectedRoute requiredRole="admin">
                <Students />
              </ProtectedRoute>
            } />
            <Route path="/admin/reports" element={
              <ProtectedRoute requiredRole="admin">
                <Reports />
              </ProtectedRoute>
            } />
            
            <Route path="/student/dashboard" element={
              <ProtectedRoute requiredRole="student">
                <StudentDashboard />
              </ProtectedRoute>
            } />
            <Route path="/student/profile" element={
              <ProtectedRoute requiredRole="student">
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/student/jobs" element={
              <ProtectedRoute requiredRole="student">
                <StudentJobs />
              </ProtectedRoute>
            } />
            <Route path="/student/applications" element={
              <ProtectedRoute requiredRole="student">
                <StudentApplications />
              </ProtectedRoute>
            } />
            <Route path="/student/notifications" element={
              <ProtectedRoute requiredRole="student">
                <Notifications />
              </ProtectedRoute>
            } />
            
            <Route path="/company/dashboard" element={
              <ProtectedRoute requiredRole="company">
                <CompanyDashboard />
              </ProtectedRoute>
            } />
            <Route path="/company/jobs" element={
              <ProtectedRoute requiredRole="company">
                <CompanyJobs />
              </ProtectedRoute>
            } />
            <Route path="/company/applications" element={
              <ProtectedRoute requiredRole="company">
                <CompanyApplications />
              </ProtectedRoute>
            } />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
