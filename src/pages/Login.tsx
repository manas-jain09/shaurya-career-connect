
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'student' | 'admin'>('student');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simple validation
    if (!email || !password) {
      toast.error('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    // Attempt login
    const isSuccessful = login(email, password, role);
    
    setTimeout(() => {
      setIsLoading(false);
      
      if (isSuccessful) {
        toast.success(`Logged in successfully as ${role}`);
        // Redirect based on role
        navigate(role === 'admin' ? '/admin/dashboard' : '/student/dashboard');
      } else {
        toast.error('Invalid email or password');
      }
    }, 1000); // Artificial delay for UX
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="auth-card">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-shaurya-primary">Shaurya</h1>
          <p className="text-gray-600">Placement Automation Platform</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Login As</Label>
            <RadioGroup 
              value={role} 
              onValueChange={(value) => setRole(value as 'student' | 'admin')}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="student" id="student" />
                <Label htmlFor="student" className="cursor-pointer">Student</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="admin" id="admin" />
                <Label htmlFor="admin" className="cursor-pointer">Admin</Label>
              </div>
            </RadioGroup>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-shaurya-primary hover:bg-shaurya-dark"
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <a href="/register" className="text-shaurya-primary hover:underline">
              Register here
            </a>
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-gray-500">
            <div>
              <div className="font-medium mb-1">Demo Student</div>
              <div>Email: student@example.com</div>
              <div>Password: password</div>
            </div>
            <div>
              <div className="font-medium mb-1">Demo Admin</div>
              <div>Email: admin@example.com</div>
              <div>Password: password</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
