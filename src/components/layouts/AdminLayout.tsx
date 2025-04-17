
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Home, 
  Users, 
  Briefcase, 
  FileCheck, 
  BarChart, 
  LogOut,
  ClipboardList,
  Bell
} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { Badge } from '@/components/ui/badge';

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { unreadCount } = useNotifications();

  const navLinks = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: Home },
    { name: 'Profile Verification', path: '/admin/verification', icon: FileCheck },
    { name: 'Job Management', path: '/admin/jobs', icon: Briefcase },
    { name: 'Applications', path: '/admin/applications', icon: ClipboardList },
    { name: 'Students', path: '/admin/students', icon: Users },
    { name: 'Reports', path: '/admin/reports', icon: BarChart },
    { name: 'Notifications', path: '/admin/notifications', icon: Bell },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="shaurya-container py-4 flex justify-between items-center">
          <Link to="/admin/dashboard" className="flex items-center gap-2">
            <span className="text-xl font-bold text-shaurya-primary">Shaurya</span>
            <span className="text-sm bg-shaurya-light text-shaurya-primary px-2 py-0.5 rounded">
              Admin
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              Welcome, <span className="font-medium">{user?.name || 'Admin'}</span>
            </div>
            <Link to="/admin/notifications" className="relative">
              <Bell size={20} className="text-gray-600 hover:text-shaurya-primary" />
              {unreadCount > 0 && (
                <Badge 
                  className="absolute -top-2 -right-2 bg-red-500 text-white h-5 w-5 flex items-center justify-center p-0 text-xs"
                  variant="destructive"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </Link>
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
                      {link.name === 'Notifications' && unreadCount > 0 && (
                        <Badge 
                          className="ml-auto bg-red-500 text-white h-5 min-w-5 flex items-center justify-center p-0 text-xs"
                          variant="destructive"
                        >
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
