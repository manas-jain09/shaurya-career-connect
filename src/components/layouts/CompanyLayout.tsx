
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Home, 
  Briefcase, 
  Users,
  LogOut
} from 'lucide-react';

const CompanyLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navLinks = [
    { name: 'Dashboard', path: '/company/dashboard', icon: Home },
    { name: 'Job Postings', path: '/company/jobs', icon: Briefcase },
    { name: 'Applications', path: '/company/applications', icon: Users },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="shaurya-container py-4 flex justify-between items-center">
          <Link to="/company/dashboard" className="flex items-center gap-2">
            <span className="text-xl font-bold text-shaurya-primary">Shaurya</span>
            <span className="text-sm bg-shaurya-light text-shaurya-primary px-2 py-0.5 rounded">
              Company
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              Welcome, <span className="font-medium">{user?.name || 'Company'}</span>
            </div>
            <div className="text-sm text-gray-600">
              Code: <span className="font-mono font-medium">{user?.companyCode}</span>
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
            </nav>
          </aside>

          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
};

export default CompanyLayout;
