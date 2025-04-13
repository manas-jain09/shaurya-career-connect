
import React, { createContext, useState, useContext, ReactNode } from 'react';

type UserRole = 'student' | 'admin' | null;

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isVerified: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: UserRole) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const defaultContext: AuthContextType = {
  user: null,
  login: () => false,
  logout: () => {},
  isAuthenticated: false,
  isAdmin: false,
};

const AuthContext = createContext<AuthContextType>(defaultContext);

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

// Mock user data (in a real app, this would be fetched from an API)
const mockUsers = [
  {
    id: 'student-1',
    name: 'John Student',
    email: 'student@example.com',
    password: 'password',
    role: 'student' as UserRole,
    isVerified: true,
  },
  {
    id: 'admin-1',
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'password',
    role: 'admin' as UserRole,
    isVerified: true,
  },
];

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = (email: string, password: string, role: UserRole): boolean => {
    const foundUser = mockUsers.find(
      (u) => u.email === email && u.password === password && u.role === role
    );

    if (foundUser) {
      // Remove password before setting user to state
      const { password, ...userWithoutPassword } = foundUser;
      setUser(userWithoutPassword);
      // In a real app, you would set a token in localStorage/cookies here
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    // In a real app, you would remove the token from localStorage/cookies here
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};
