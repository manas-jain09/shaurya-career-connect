
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Home, User, Briefcase, Bell, LogOut } from 'lucide-react';

const StudentLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navLinks = [
    { name: 'Dashboard', path: '/student/dashboard', icon: Home },
    { name: 'My Profile', path: '/student/profile', icon: User },
    { name: 'Job Listings', path: '/student/jobs', icon: Briefcase },
    { name: 'Notifications', path: '/student/notifications', icon: Bell },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="shaurya-container py-4 flex justify-between items-center">
          <Link to="/student/dashboard" className="flex items-center gap-2">
            <span className="text-xl font-bold text-shaurya-primary">Shaurya</span>
            <span className="text-sm bg-shaurya-light text-shaurya-primary px-2 py-0.5 rounded">
              Student
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              Welcome, <span className="font-medium">{user?.name || 'Student'}</span>
            </div>
            <button onClick={logout} className="flex items-center text-gray-600 hover:text-red-500">
              <LogOut size={18} className="mr-1" /> Logout
            </button>
          </div>
        </div>
      </header>

      <div className="shaurya-container py-6">
        <div className="flex flex-col md:flex-row gap-6">
          <aside className="w-full md:w-64 shrink-0">
            <nav className="bg-white shadow rounded-lg p-4">
              <ul className="space-y-2">
                {navLinks.map((link) => (
                  <li key={link.path}>
                    <Link
                      to={link.path}
                      className={`flex items-center p-2 rounded-md ${
                        isActive(link.path)
                          ? 'bg-shaurya-light text-shaurya-primary font-medium'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <link.icon size={18} className="mr-2" />
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
              
              {user && !user.isVerified && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex items-start">
                    <div className="text-yellow-700 text-sm">
                      <p className="font-medium">Profile Unverified</p>
                      <p className="mt-1">Your profile is pending verification by admin.</p>
                    </div>
                  </div>
                </div>
              )}
            </nav>
          </aside>

          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
};

export default StudentLayout;
