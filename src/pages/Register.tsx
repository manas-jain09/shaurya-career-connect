import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { uploadFile } from '@/utils/helpers';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  Checkbox,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  // Personal Information
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Class X Fields
  const [xSchool, setXSchool] = useState('');
  const [xBoard, setXBoard] = useState('');
  const [xMarks, setXMarks] = useState('');
  const [xPassingYear, setXPassingYear] = useState('');
  const [xIsCGPA, setXIsCGPA] = useState(false);
  const [xCGPAScale, setXCGPAScale] = useState<string>('');
  const [xMarksheetFile, setXMarksheetFile] = useState<File | null>(null);
  
  // Class XII Fields
  const [xiiSchool, setXiiSchool] = useState('');
  const [xiiBoard, setXiiBoard] = useState('');
  const [xiiMarks, setXiiMarks] = useState('');
  const [xiiPassingYear, setXiiPassingYear] = useState('');
  const [xiiIsCGPA, setXiiIsCGPA] = useState(false);
  const [xiiCGPAScale, setXiiCGPAScale] = useState<string>('');
  const [xiiMarksheetFile, setXiiMarksheetFile] = useState<File | null>(null);
  
  // Graduation Fields
  const [gradCollege, setGradCollege] = useState('');
  const [gradCourse, setGradCourse] = useState('');
  const [gradDivision, setGradDivision] = useState('');
  const [gradYear, setGradYear] = useState('');
  const [gradMarks, setGradMarks] = useState('');
  const [gradIsCGPA, setGradIsCGPA] = useState(false);
  const [gradCGPAScale, setGradCGPAScale] = useState<string>('');
  const [hasBacklog, setHasBacklog] = useState(false);
  const [gradMarksheetFile, setGradMarksheetFile] = useState<File | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  // Course and Division Options
  const courseOptions = [
    "Mechanical Engineering",
    "Electrical and Electronics Engineering (EEE)",
    "Computer Engineering and Technology(Core)",
    "Computer Engineering and Technology - AIDS",
    "Computer Engineering and Technology - Cyber Security",
    "Computer Engineering and Technology - CSBS"
  ];

  // Division options based on course
  const getDivisionOptions = (course: string) => {
    if (course.includes("Electrical and Electronics")) {
      return [
        "ECE_AIML_Div_A",
        "ECE_AIML_Div_B",
        "ECE_Core_Div_A",
        "ECE_Core_Div_B",
        "E&CE"
      ];
    } else if (course.includes("Mechanical")) {
      return [
        "Mechanical - Div A",
        "Mechanical - Div B",
        "Mechanical - Div C",
        "Robotics & Automation - Div A",
        "Robotics & Automation - Div B"
      ];
    } else if (course.includes("Computer Engineering")) {
      return ["Div A", "Div B", "Div C", "Div D", "Div E", "Div F", "Div G", "Div H", "Div I", "Div J"];
    }
    return [];
  };

  // Reset division when course changes
  useEffect(() => {
    setGradDivision('');
  }, [gradCourse]);

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
    
    // Validate division if course is selected
    if (gradCourse && getDivisionOptions(gradCourse).length > 0 && !gradDivision) {
      toast.error('Please select a division for your course');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateUploads()) return;
    
    setIsLoading(true);
    
    try {
      // Step 1: Register user in users table
      const userId = await register(email, password, 'student');
      if (!userId) {
        setIsLoading(false);
        return;
      }

      // Parse name into first and last name
      const nameParts = name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Step 2: Create student profile
      const { data: profileData, error: profileError } = await supabase
        .from('student_profiles')
        .insert({
          user_id: userId,
          first_name: firstName,
          last_name: lastName,
          dob,
          gender,
          phone,
          address,
          is_verified: false,
          verification_status: 'pending'
        })
        .select('id')
        .single();

      if (profileError || !profileData) {
        throw new Error(profileError?.message || 'Failed to create student profile');
      }

      const studentId = profileData.id;

      // Upload files and get URLs
      const uploadPromises = [];

      // Upload Class X marksheet
      if (xMarksheetFile) {
        uploadPromises.push(
          uploadFile(xMarksheetFile, 'student_documents', `${studentId}/class_x`)
            .then(async (fileUrl) => {
              if (!fileUrl) throw new Error('Failed to upload Class X marksheet');
              
              await supabase.from('class_x_details').insert({
                student_id: studentId,
                school_name: xSchool,
                board: xBoard,
                marks: parseFloat(xMarks),
                is_cgpa: xIsCGPA,
                cgpa_scale: xIsCGPA ? parseInt(xCGPAScale) : null,
                passing_year: parseInt(xPassingYear),
                marksheet_url: fileUrl
              });
            })
        );
      }

      // Upload Class XII marksheet
      if (xiiMarksheetFile) {
        uploadPromises.push(
          uploadFile(xiiMarksheetFile, 'student_documents', `${studentId}/class_xii`)
            .then(async (fileUrl) => {
              if (!fileUrl) throw new Error('Failed to upload Class XII marksheet');
              
              await supabase.from('class_xii_details').insert({
                student_id: studentId,
                school_name: xiiSchool,
                board: xiiBoard,
                marks: parseFloat(xiiMarks),
                is_cgpa: xiiIsCGPA,
                cgpa_scale: xiiIsCGPA ? parseInt(xiiCGPAScale) : null,
                passing_year: parseInt(xiiPassingYear),
                marksheet_url: fileUrl
              });
            })
        );
      }

      // Upload Graduation marksheet
      if (gradMarksheetFile) {
        uploadPromises.push(
          uploadFile(gradMarksheetFile, 'student_documents', `${studentId}/graduation`)
            .then(async (fileUrl) => {
              if (!fileUrl) throw new Error('Failed to upload Graduation marksheet');
              
              await supabase.from('graduation_details').insert({
                student_id: studentId,
                college_name: gradCollege,
                course: gradCourse,
                division: gradDivision || null,
                marks: parseFloat(gradMarks),
                is_cgpa: gradIsCGPA,
                cgpa_scale: gradIsCGPA ? parseInt(gradCGPAScale) : null,
                passing_year: parseInt(gradYear),
                has_backlog: hasBacklog,
                marksheet_url: fileUrl
              });
            })
        );
      }

      // Upload Resume
      if (resumeFile) {
        uploadPromises.push(
          uploadFile(resumeFile, 'student_documents', `${studentId}/resume`)
            .then(async (fileUrl) => {
              if (!fileUrl) throw new Error('Failed to upload Resume');
              
              await supabase.from('resumes').insert({
                student_id: studentId,
                file_url: fileUrl
              });
            })
        );
      }

      // Wait for all uploads and database insertions to complete
      await Promise.all(uploadPromises);

      // Create notification for admin
      await supabase.from('notifications').insert({
        user_id: userId,
        title: 'New Student Registration',
        message: `${name} has registered and awaiting profile verification.`,
        is_read: false
      });

      setIsLoading(false);
      toast.success('Registration successful! Please log in after admin verification.');
      navigate('/login');
    } catch (error) {
      console.error('Registration error:', error);
      setIsLoading(false);
      toast.error('Failed to complete registration. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8 px-4">
      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-3xl">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-blue-600">Student Registration</h1>
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
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {index + 1}
                </div>
                <div className="text-xs mt-1 text-center">{step.label}</div>
                
                {index < steps.length - 1 && (
                  <div 
                    className={`absolute top-4 left-1/2 w-full h-px ${
                      index < activeStep ? 'bg-blue-600' : 'bg-gray-200'
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
                  <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger id="gender">
                      <SelectValue placeholder="Select Gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
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
                      <div className="flex items-center space-x-2 mb-2">
                        <Checkbox
                          id="xIsCGPA"
                          checked={xIsCGPA}
                          onCheckedChange={(checked) => setXIsCGPA(checked === true)}
                        />
                        <Label htmlFor="xIsCGPA">CGPA (instead of percentage)</Label>
                      </div>
                      <Label htmlFor="xMarks">{xIsCGPA ? "CGPA*" : "Percentage*"}</Label>
                      <Input
                        id="xMarks"
                        value={xMarks}
                        onChange={(e) => setXMarks(e.target.value)}
                        placeholder={xIsCGPA ? "Enter CGPA" : "Enter percentage"}
                        type="number"
                        step={xIsCGPA ? "0.1" : "0.01"}
                      />
                    </div>
                    
                    {xIsCGPA && (
                      <div>
                        <Label htmlFor="xCGPAScale">CGPA Scale*</Label>
                        <Select value={xCGPAScale} onValueChange={setXCGPAScale}>
                          <SelectTrigger id="xCGPAScale">
                            <SelectValue placeholder="Select Scale" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="10">10</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    
                    <div className={xIsCGPA ? "col-span-2" : ""}>
                      <Label htmlFor="xPassingYear">Year of Passing*</Label>
                      <Input
                        id="xPassingYear"
                        value={xPassingYear}
                        onChange={(e) => setXPassingYear(e.target.value)}
                        placeholder="Enter year of passing"
                        type="number"
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
                      <div className="flex items-center space-x-2 mb-2">
                        <Checkbox
                          id="xiiIsCGPA"
                          checked={xiiIsCGPA}
                          onCheckedChange={(checked) => setXiiIsCGPA(checked === true)}
                        />
                        <Label htmlFor="xiiIsCGPA">CGPA (instead of percentage)</Label>
                      </div>
                      <Label htmlFor="xiiMarks">{xiiIsCGPA ? "CGPA*" : "Percentage*"}</Label>
                      <Input
                        id="xiiMarks"
                        value={xiiMarks}
                        onChange={(e) => setXiiMarks(e.target.value)}
                        placeholder={xiiIsCGPA ? "Enter CGPA" : "Enter percentage"}
                        type="number"
                        step={xiiIsCGPA ? "0.1" : "0.01"}
                      />
                    </div>
                    
                    {xiiIsCGPA && (
                      <div>
                        <Label htmlFor="xiiCGPAScale">CGPA Scale*</Label>
                        <Select value={xiiCGPAScale} onValueChange={setXiiCGPAScale}>
                          <SelectTrigger id="xiiCGPAScale">
                            <SelectValue placeholder="Select Scale" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="10">10</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    
                    <div className={xiiIsCGPA ? "col-span-2" : ""}>
                      <Label htmlFor="xiiPassingYear">Year of Passing*</Label>
                      <Input
                        id="xiiPassingYear"
                        value={xiiPassingYear}
                        onChange={(e) => setXiiPassingYear(e.target.value)}
                        placeholder="Enter year of passing"
                        type="number"
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
                      <Select value={gradCourse} onValueChange={setGradCourse}>
                        <SelectTrigger id="gradCourse">
                          <SelectValue placeholder="Select Course" />
                        </SelectTrigger>
                        <SelectContent>
                          {courseOptions.map((course) => (
                            <SelectItem key={course} value={course}>
                              {course}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {getDivisionOptions(gradCourse).length > 0 && (
                      <div>
                        <Label htmlFor="gradDivision">Division*</Label>
                        <Select value={gradDivision} onValueChange={setGradDivision}>
                          <SelectTrigger id="gradDivision">
                            <SelectValue placeholder="Select Division" />
                          </SelectTrigger>
                          <SelectContent>
                            {getDivisionOptions(gradCourse).map((division) => (
                              <SelectItem key={division} value={division}>
                                {division}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <Checkbox
                          id="gradIsCGPA"
                          checked={gradIsCGPA}
                          onCheckedChange={(checked) => setGradIsCGPA(checked === true)}
                        />
                        <Label htmlFor="gradIsCGPA">CGPA (instead of percentage)</Label>
                      </div>
                      <Label htmlFor="gradMarks">{gradIsCGPA ? "CGPA*" : "Percentage*"}</Label>
                      <Input
                        id="gradMarks"
                        value={gradMarks}
                        onChange={(e) => setGradMarks(e.target.value)}
                        placeholder={gradIsCGPA ? "Enter CGPA" : "Enter percentage"}
                        type="number"
                        step={gradIsCGPA ? "0.1" : "0.01"}
                      />
                    </div>
                    
                    {gradIsCGPA && (
                      <div>
                        <Label htmlFor="gradCGPAScale">CGPA Scale*</Label>
                        <Select value={gradCGPAScale} onValueChange={setGradCGPAScale}>
                          <SelectTrigger id="gradCGPAScale">
                            <SelectValue placeholder="Select Scale" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="10">10</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    
                    <div>
                      <Label htmlFor="gradYear">Graduation Year*</Label>
                      <Input
                        id="gradYear"
                        value={gradYear}
                        onChange={(e) => setGradYear(e.target.value)}
                        placeholder="Enter graduation year"
                        type="number"
                      />
                    </div>
                    
                    <div className="col-span-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="hasBacklog"
                          checked={hasBacklog}
                          onCheckedChange={(checked) => setHasBacklog(checked === true)}
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
                className="border-blue-600 text-blue-600"
              >
                Back
              </Button>
            )}
            
            {activeStep < steps.length - 1 ? (
              <Button 
                type="button" 
                onClick={handleNext}
                className="ml-auto bg-blue-600 hover:bg-blue-700"
              >
                Next
              </Button>
            ) : (
              <Button 
                type="submit"
                className="ml-auto bg-blue-600 hover:bg-blue-700"
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
            <a href="/login" className="text-blue-600 hover:underline">
              Login here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
