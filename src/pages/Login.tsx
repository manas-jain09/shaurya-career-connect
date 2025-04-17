
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AtSign, Lock, LogIn, Briefcase } from 'lucide-react';
import { toast } from 'sonner';

type UserRole = 'student' | 'admin';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      if (isAdmin) {
        navigate('/admin/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    }
  }, [isAuthenticated, isAdmin, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      toast.error('Please fill all fields');
      return;
    }

    setIsLoading(true);
    
    try {
      const success = await login(email, password, role);
      
      if (success) {
        toast.success('Login successful!');
        if (role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/student/dashboard');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (value: string) => {
    setRole(value as UserRole);
  };

  return (
    <div className="flex min-h-screen bg-gray-50 items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-shaurya-primary mb-2">Shaurya</h1>
          <p className="text-gray-600">Campus Placement Portal</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>
              Enter your credentials to access the platform
            </CardDescription>
          </CardHeader>
          
          <Tabs defaultValue="student" onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="student">Student</TabsTrigger>
              <TabsTrigger value="admin">Admin</TabsTrigger>
            </TabsList>
            
            <form onSubmit={handleSubmit}>
              <TabsContent value="student">
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <AtSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        className="pl-10"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        className="pl-10"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </TabsContent>
              
              <TabsContent value="admin">
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="adminEmail">Email</Label>
                    <div className="relative">
                      <AtSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="adminEmail"
                        type="email"
                        placeholder="Enter admin email"
                        className="pl-10"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adminPassword">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="adminPassword"
                        type="password"
                        placeholder="Enter admin password"
                        className="pl-10"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </TabsContent>

              <CardFooter className="flex flex-col">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Loading...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <LogIn className="mr-2 h-4 w-4" />
                      Sign In
                    </span>
                  )}
                </Button>

                <div className="mt-4 text-center text-sm">
                  <span className="text-gray-600">Don't have an account? </span>
                  <a href="/register" className="text-shaurya-primary hover:underline">
                    Register here
                  </a>
                </div>

                <div className="mt-6 flex items-center justify-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>

                <div className="mt-6 flex justify-center">
                  <a 
                    href="/company-login" 
                    className="flex items-center text-gray-700 hover:text-shaurya-primary transition-colors"
                  >
                    <Briefcase className="h-4 w-4 mr-2" />
                    <span>Company Login</span>
                  </a>
                </div>
              </CardFooter>
            </form>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default Login;
