
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

const Register = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  // Personal Information
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Class X Fields
  const [xSchool, setXSchool] = useState('');
  const [xBoard, setXBoard] = useState('');
  const [xMarks, setXMarks] = useState('');
  const [xPassingYear, setXPassingYear] = useState('');
  const [xMarksheetFile, setXMarksheetFile] = useState<File | null>(null);
  
  // Class XII Fields
  const [xiiSchool, setXiiSchool] = useState('');
  const [xiiBoard, setXiiBoard] = useState('');
  const [xiiMarks, setXiiMarks] = useState('');
  const [xiiPassingYear, setXiiPassingYear] = useState('');
  const [xiiMarksheetFile, setXiiMarksheetFile] = useState<File | null>(null);
  
  // Graduation Fields
  const [gradCollege, setGradCollege] = useState('');
  const [gradCourse, setGradCourse] = useState('');
  const [gradYear, setGradYear] = useState('');
  const [gradMarks, setGradMarks] = useState('');
  const [hasBacklog, setHasBacklog] = useState(false);
  const [gradMarksheetFile, setGradMarksheetFile] = useState<File | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const steps = [
    { id: 'personal', label: 'Personal Information' },
    { id: 'education', label: 'Education Details' },
    { id: 'uploads', label: 'Document Uploads' },
  ];

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<File | null>>
  ) => {
    if (e.target.files && e.target.files.length > 0) {
      setter(e.target.files[0]);
    }
  };

  const validatePersonalInfo = () => {
    if (!name || !email || !phone || !dob || !gender || !password) {
      toast.error('Please fill all required fields');
      return false;
    }
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return false;
    }
    
    return true;
  };

  const validateEducationInfo = () => {
    if (!xSchool || !xBoard || !xMarks || !xPassingYear) {
      toast.error('Please fill all Class X details');
      return false;
    }
    
    if (!xiiSchool || !xiiBoard || !xiiMarks || !xiiPassingYear) {
      toast.error('Please fill all Class XII details');
      return false;
    }
    
    if (!gradCollege || !gradCourse || !gradYear || !gradMarks) {
      toast.error('Please fill all Graduation details');
      return false;
    }
    
    return true;
  };

  const validateUploads = () => {
    if (!xMarksheetFile || !xiiMarksheetFile || !gradMarksheetFile || !resumeFile) {
      toast.error('Please upload all required documents');
      return false;
    }
    
    return true;
  };

  const handleNext = () => {
    if (activeStep === 0 && !validatePersonalInfo()) return;
    if (activeStep === 1 && !validateEducationInfo()) return;
    
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateUploads()) return;
    
    setIsLoading(true);
    
    // In a real app, this would be an API call to register the user
    setTimeout(() => {
      setIsLoading(false);
      toast.success('Registration successful! Please log in after admin verification.');
      navigate('/login');
    }, 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8 px-4">
      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-3xl">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-shaurya-primary">Student Registration</h1>
          <p className="text-gray-600 mt-1">Join Shaurya Placement Portal</p>
        </div>

        <div className="mb-8">
          <div className="flex justify-between items-center">
            {steps.map((step, index) => (
              <div 
                key={step.id}
                className={`flex-1 flex flex-col items-center ${
                  index < steps.length - 1 ? 'relative' : ''
                }`}
              >
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    index <= activeStep 
                      ? 'bg-shaurya-primary text-white' 
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {index + 1}
                </div>
                <div className="text-xs mt-1 text-center">{step.label}</div>
                
                {index < steps.length - 1 && (
                  <div 
                    className={`absolute top-4 left-1/2 w-full h-px ${
                      index < activeStep ? 'bg-shaurya-primary' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {activeStep === 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name*</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email Address*</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone">Phone Number*</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter your phone number"
                  />
                </div>
                
                <div>
                  <Label htmlFor="dob">Date of Birth*</Label>
                  <Input
                    id="dob"
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="gender">Gender*</Label>
                  <select
                    id="gender"
                    className="form-input"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    placeholder="Enter your address"
                  />
                </div>
                
                <div>
                  <Label htmlFor="password">Password*</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a strong password"
                  />
                </div>
                
                <div>
                  <Label htmlFor="confirmPassword">Confirm Password*</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                  />
                </div>
              </div>
            </div>
          )}

          {activeStep === 1 && (
            <div>
              <Tabs defaultValue="class10" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="class10">Class X</TabsTrigger>
                  <TabsTrigger value="class12">Class XII</TabsTrigger>
                  <TabsTrigger value="graduation">Graduation</TabsTrigger>
                </TabsList>
                
                <TabsContent value="class10" className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="xSchool">School Name*</Label>
                      <Input
                        id="xSchool"
                        value={xSchool}
                        onChange={(e) => setXSchool(e.target.value)}
                        placeholder="Enter school name"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="xBoard">Board*</Label>
                      <Input
                        id="xBoard"
                        value={xBoard}
                        onChange={(e) => setXBoard(e.target.value)}
                        placeholder="Enter board name (e.g., CBSE)"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="xMarks">Marks (%/CGPA)*</Label>
                      <Input
                        id="xMarks"
                        value={xMarks}
                        onChange={(e) => setXMarks(e.target.value)}
                        placeholder="Enter percentage or CGPA"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="xPassingYear">Year of Passing*</Label>
                      <Input
                        id="xPassingYear"
                        value={xPassingYear}
                        onChange={(e) => setXPassingYear(e.target.value)}
                        placeholder="Enter year of passing"
                      />
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="class12" className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="xiiSchool">School Name*</Label>
                      <Input
                        id="xiiSchool"
                        value={xiiSchool}
                        onChange={(e) => setXiiSchool(e.target.value)}
                        placeholder="Enter school name"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="xiiBoard">Board*</Label>
                      <Input
                        id="xiiBoard"
                        value={xiiBoard}
                        onChange={(e) => setXiiBoard(e.target.value)}
                        placeholder="Enter board name (e.g., CBSE)"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="xiiMarks">Marks (%/CGPA)*</Label>
                      <Input
                        id="xiiMarks"
                        value={xiiMarks}
                        onChange={(e) => setXiiMarks(e.target.value)}
                        placeholder="Enter percentage or CGPA"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="xiiPassingYear">Year of Passing*</Label>
                      <Input
                        id="xiiPassingYear"
                        value={xiiPassingYear}
                        onChange={(e) => setXiiPassingYear(e.target.value)}
                        placeholder="Enter year of passing"
                      />
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="graduation" className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="gradCollege">College Name*</Label>
                      <Input
                        id="gradCollege"
                        value={gradCollege}
                        onChange={(e) => setGradCollege(e.target.value)}
                        placeholder="Enter college name"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="gradCourse">Course*</Label>
                      <Input
                        id="gradCourse"
                        value={gradCourse}
                        onChange={(e) => setGradCourse(e.target.value)}
                        placeholder="Enter course name (e.g., B.Tech)"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="gradYear">Graduation Year*</Label>
                      <Input
                        id="gradYear"
                        value={gradYear}
                        onChange={(e) => setGradYear(e.target.value)}
                        placeholder="Enter graduation year"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="gradMarks">Marks (%/CGPA)*</Label>
                      <Input
                        id="gradMarks"
                        value={gradMarks}
                        onChange={(e) => setGradMarks(e.target.value)}
                        placeholder="Enter percentage or CGPA"
                      />
                    </div>
                    
                    <div className="col-span-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="hasBacklog"
                          checked={hasBacklog}
                          onChange={(e) => setHasBacklog(e.target.checked)}
                          className="h-4 w-4 text-shaurya-primary rounded"
                        />
                        <Label htmlFor="hasBacklog">
                          I have an active backlog
                        </Label>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {activeStep === 2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="xMarksheet">Class X Marksheet*</Label>
                  <Input
                    id="xMarksheet"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange(e, setXMarksheetFile)}
                  />
                  <p className="text-xs text-gray-500">Upload PDF, JPG, or PNG (max 2MB)</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="xiiMarksheet">Class XII Marksheet*</Label>
                  <Input
                    id="xiiMarksheet"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange(e, setXiiMarksheetFile)}
                  />
                  <p className="text-xs text-gray-500">Upload PDF, JPG, or PNG (max 2MB)</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="gradMarksheet">Graduation Marksheet*</Label>
                  <Input
                    id="gradMarksheet"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange(e, setGradMarksheetFile)}
                  />
                  <p className="text-xs text-gray-500">Upload PDF, JPG, or PNG (max 2MB)</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="resume">Resume/CV*</Label>
                  <Input
                    id="resume"
                    type="file"
                    accept=".pdf,.docx"
                    onChange={(e) => handleFileChange(e, setResumeFile)}
                  />
                  <p className="text-xs text-gray-500">Upload PDF or DOCX (max 2MB)</p>
                </div>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
                <h3 className="text-sm font-medium text-yellow-800">Important Notice</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  All submitted documents will be verified by the admin. Your profile and 
                  job application eligibility depends on successful verification.
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-between mt-8">
            {activeStep > 0 && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleBack}
                className="border-shaurya-primary text-shaurya-primary"
              >
                Back
              </Button>
            )}
            
            {activeStep < steps.length - 1 ? (
              <Button 
                type="button" 
                onClick={handleNext}
                className="ml-auto bg-shaurya-primary hover:bg-shaurya-dark"
              >
                Next
              </Button>
            ) : (
              <Button 
                type="submit"
                className="ml-auto bg-shaurya-primary hover:bg-shaurya-dark"
                disabled={isLoading}
              >
                {isLoading ? 'Submitting...' : 'Submit Registration'}
              </Button>
            )}
          </div>
        </form>

        <div className="mt-6 text-center text-sm">
          <p className="text-gray-600">
            Already have an account?{' '}
            <a href="/login" className="text-shaurya-primary hover:underline">
              Login here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
