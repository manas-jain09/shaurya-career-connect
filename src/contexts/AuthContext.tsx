
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import bcrypt from 'bcryptjs';
import { toast } from 'sonner';

type UserRole = 'student' | 'admin' | null;

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isVerified: boolean;
  profileId?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: UserRole) => Promise<boolean>;
  register: (email: string, password: string, role: UserRole) => Promise<string | null>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
}

const defaultContext: AuthContextType = {
  user: null,
  login: async () => false,
  register: async () => null,
  logout: () => {},
  isAuthenticated: false,
  isAdmin: false,
  isLoading: true,
};

const AuthContext = createContext<AuthContextType>(defaultContext);

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored session on mount
    const storedUser = localStorage.getItem('shaurya_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('shaurya_user');
      }
    }
    setIsLoading(false);
  }, []);

  const register = async (email: string, password: string, role: UserRole): Promise<string | null> => {
    try {
      // Check if email already exists
      const { data: existingUsers } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .limit(1);

      if (existingUsers && existingUsers.length > 0) {
        toast.error('Email already registered');
        return null;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert new user
      const { data: newUser, error } = await supabase
        .from('users')
        .insert([{ email, password: hashedPassword, role }])
        .select('id')
        .single();

      if (error || !newUser) {
        console.error('Registration error:', error);
        toast.error('Registration failed');
        return null;
      }

      return newUser.id;
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Registration failed');
      return null;
    }
  };

  const login = async (email: string, password: string, role: UserRole): Promise<boolean> => {
    try {
      // Get user with matching email and role
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('role', role)
        .limit(1);

      if (error) {
        console.error('Login query error:', error);
        toast.error('Failed to authenticate. Please try again.');
        return false;
      }

      if (!users || users.length === 0) {
        toast.error(`No ${role} account found with this email`);
        return false;
      }

      const userRecord = users[0];

      // Verify password
      const passwordMatch = await bcrypt.compare(password, userRecord.password);
      if (!passwordMatch) {
        toast.error('Invalid password');
        return false;
      }

      let userName = '';
      let isVerified = false;
      let profileId = undefined;

      // Ensure role is a valid UserRole type
      const userRole: UserRole = (userRecord.role === 'student' || userRecord.role === 'admin') 
        ? userRecord.role 
        : null;

      // If student, get profile info
      if (userRole === 'student') {
        const { data: profileData } = await supabase
          .from('student_profiles')
          .select('*')
          .eq('user_id', userRecord.id)
          .limit(1)
          .single();

        if (profileData) {
          userName = `${profileData.first_name} ${profileData.last_name}`;
          isVerified = profileData.is_verified;
          profileId = profileData.id;
        } else {
          userName = 'New Student';
          isVerified = false;
        }
      } else {
        // Admin user
        userName = 'Admin User';
        isVerified = true;
      }

      // Set user in state and localStorage
      const userObj: User = {
        id: userRecord.id,
        name: userName,
        email: userRecord.email,
        role: userRole,
        isVerified,
        profileId,
      };

      setUser(userObj);
      localStorage.setItem('shaurya_user', JSON.stringify(userObj));

      return true;
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed. Please try again.');
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('shaurya_user');
    toast.success('Logged out successfully');
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        login, 
        register, 
        logout, 
        isAuthenticated, 
        isAdmin, 
        isLoading 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
