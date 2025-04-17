
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { BuildingIcon, Lock, KeyIcon, LogIn } from 'lucide-react';
import { toast } from 'sonner';

const CompanyLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [companyCode, setCompanyCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { companyLogin, isAuthenticated, isCompany } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && isCompany) {
      navigate('/company/dashboard');
    }
  }, [isAuthenticated, isCompany, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim() || !companyCode.trim()) {
      toast.error('Please fill all fields');
      return;
    }

    setIsLoading(true);
    
    try {
      const success = await companyLogin(username, password, companyCode);
      
      if (success) {
        toast.success('Login successful!');
        navigate('/company/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-shaurya-primary mb-2">Shaurya</h1>
          <p className="text-gray-600">Company Portal</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Company Login</CardTitle>
            <CardDescription>
              Enter your credentials to access the company portal
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Company Username</Label>
                <div className="relative">
                  <BuildingIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    className="pl-10"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company-code">Company Code</Label>
                <div className="relative">
                  <KeyIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="company-code"
                    type="text"
                    placeholder="Enter your company code"
                    className="pl-10"
                    value={companyCode}
                    onChange={(e) => setCompanyCode(e.target.value)}
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
                <a href="/" className="text-shaurya-primary hover:underline">
                  Return to Student Login
                </a>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default CompanyLogin;
