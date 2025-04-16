
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Checkbox } from "@/components/ui/checkbox";
import { format } from 'date-fns';
import { CalendarIcon, ExternalLink, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const Register = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    gender: '',
    phone: '',
    dob: null as Date | null,
    address: '',
    placementInterest: 'placement/internship',
    agreedToPolicies: false
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [policyDialogOpen, setPolicyDialogOpen] = useState(false);
  const [policyUrl, setPolicyUrl] = useState('');
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setFormData(prev => ({ ...prev, dob: date }));
    }
  };
  
  const handleAgreementChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, agreedToPolicies: checked }));
  };
  
  const validateStep1 = () => {
    if (!formData.email || !formData.password || !formData.confirmPassword) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Password Mismatch',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      return false;
    }
    
    if (formData.password.length < 6) {
      toast({
        title: 'Password Too Short',
        description: 'Password must be at least 6 characters',
        variant: 'destructive',
      });
      return false;
    }
    
    return true;
  };
  
  const validateStep2 = () => {
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.gender ||
      !formData.phone ||
      !formData.dob
    ) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return false;
    }
    
    // Basic phone validation
    if (!/^\d{10}$/.test(formData.phone)) {
      toast({
        title: 'Invalid Phone',
        description: 'Please enter a valid 10-digit phone number',
        variant: 'destructive',
      });
      return false;
    }
    
    return true;
  };
  
  const nextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      handleFetchPlacementPolicy();
      setStep(3);
    }
  };
  
  const prevStep = () => {
    setStep(step - 1);
  };
  
  const handleFetchPlacementPolicy = async () => {
    try {
      const { data, error } = await supabase.storage
        .from('placement_policies')
        .list('', { limit: 1 });
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const { data: urlData } = supabase.storage
          .from('placement_policies')
          .getPublicUrl(data[0].name);
        
        setPolicyUrl(urlData.publicUrl);
      }
    } catch (error) {
      console.error('Error fetching placement policy:', error);
    }
  };
  
  const openPlacementPolicy = () => {
    if (policyUrl) {
      window.open(policyUrl, '_blank');
    } else {
      setPolicyDialogOpen(true);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.placementInterest) {
      toast({
        title: 'Missing Information',
        description: 'Please select your placement interest',
        variant: 'destructive',
      });
      return;
    }
    
    if (formData.placementInterest === 'placement/internship' && !formData.agreedToPolicies) {
      toast({
        title: 'Policy Agreement Required',
        description: 'You must agree to the placement policies to continue',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Register user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });
      
      if (authError) throw authError;
      
      if (!authData.user) {
        throw new Error('User registration failed');
      }
      
      // Create custom user in our users table
      const { error: userError } = await supabase.from('users').insert({
        id: authData.user.id,
        email: formData.email,
        password: formData.password, // This would normally be hashed, but we're storing for demo
        role: 'student',
      });
      
      if (userError) throw userError;
      
      // Create student profile
      const { error: profileError } = await supabase.from('student_profiles').insert({
        user_id: authData.user.id,
        first_name: formData.firstName,
        last_name: formData.lastName,
        gender: formData.gender,
        dob: format(formData.dob!, 'yyyy-MM-dd'),
        phone: formData.phone,
        address: formData.address,
        verification_status: 'pending',
        is_verified: false,
        placement_interest: formData.placementInterest,
        agreed_to_policies: formData.agreedToPolicies
      });
      
      if (profileError) throw profileError;
      
      toast({
        title: 'Registration Successful',
        description: 'Your account has been created. Please verify your email and log in.',
      });
      
      navigate('/login');
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: 'Registration Failed',
        description: error.message || 'There was an error creating your account',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const renderStep1 = () => (
    <>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="your@email.com"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
        </div>
      </div>
      
      <Button className="w-full mt-6" onClick={nextStep}>
        Next
      </Button>
    </>
  );
  
  const renderStep2 = () => (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
          />
        </div>
      </div>
      
      <div className="space-y-2 mt-4">
        <Label htmlFor="gender">Gender</Label>
        <Select 
          value={formData.gender} 
          onValueChange={(value) => handleSelectChange('gender', value)}
        >
          <SelectTrigger id="gender">
            <SelectValue placeholder="Select gender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="male">Male</SelectItem>
            <SelectItem value="female">Female</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2 mt-4">
        <Label htmlFor="dob">Date of Birth</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formData.dob ? format(formData.dob, 'PPP') : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={formData.dob || undefined}
              onSelect={handleDateChange}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
      
      <div className="space-y-2 mt-4">
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="10-digit mobile number"
          required
        />
      </div>
      
      <div className="space-y-2 mt-4">
        <Label htmlFor="address">Address (Optional)</Label>
        <Input
          id="address"
          name="address"
          value={formData.address}
          onChange={handleChange}
        />
      </div>
      
      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={prevStep}>
          Back
        </Button>
        <Button onClick={nextStep}>
          Next
        </Button>
      </div>
    </>
  );
  
  const renderStep3 = () => (
    <>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="placementInterest">Interested In</Label>
          <Select 
            value={formData.placementInterest} 
            onValueChange={(value) => handleSelectChange('placementInterest', value)}
          >
            <SelectTrigger id="placementInterest">
              <SelectValue placeholder="Select your interest" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="placement/internship">Placement/Internship</SelectItem>
              <SelectItem value="higher_studies">Higher Studies</SelectItem>
              <SelectItem value="family_business">Family Business</SelectItem>
              <SelectItem value="entrepreneurship">Entrepreneurship</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {formData.placementInterest === 'placement/internship' && (
          <div className="flex items-start space-x-2 mt-4">
            <Checkbox 
              id="agreedToPolicies" 
              checked={formData.agreedToPolicies}
              onCheckedChange={handleAgreementChange}
            />
            <div className="grid gap-1.5 leading-none">
              <label
                htmlFor="agreedToPolicies"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I agree to the placement policies of the institution
              </label>
              <p className="text-sm text-muted-foreground">
                <Button 
                  variant="link" 
                  className="h-auto p-0 text-blue-600" 
                  onClick={openPlacementPolicy}
                >
                  View Placement Policy <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              </p>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={prevStep}>
          Back
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? 'Registering...' : 'Register'}
        </Button>
      </div>
    </>
  );
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
          <CardDescription>
            Step {step} of 3: {step === 1 ? 'Account Details' : step === 2 ? 'Personal Information' : 'Preferences'}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={(e) => e.preventDefault()}>
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
          </form>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-center text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-800">
              Sign in
            </Link>
          </div>
        </CardFooter>
      </Card>
      
      <Dialog open={policyDialogOpen} onOpenChange={setPolicyDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Placement Policy</DialogTitle>
            <DialogDescription>
              No placement policy file has been uploaded yet by the administrator.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-6">
            <FileText size={64} className="text-gray-300" />
          </div>
          <p className="text-center text-sm text-gray-500">
            Please contact the placement office for more information.
          </p>
          <div className="flex justify-end mt-4">
            <Button onClick={() => setPolicyDialogOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Register;
