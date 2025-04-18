
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { JobPosting, JobPostingStatus } from '@/types/database.types';
import { supabase } from '@/integrations/supabase/client';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { X, Code } from 'lucide-react';

interface JobFormProps {
  job?: JobPosting | null;
  onSave: () => void;
  onCancel: () => void;
}

const JobForm: React.FC<JobFormProps> = ({ job, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Partial<JobPosting>>({
    title: '',
    company_name: '',
    location: '',
    package: '',
    description: '',
    application_deadline: '',
    min_class_x_marks: null,
    min_class_xii_marks: null,
    min_graduation_marks: null,
    min_class_x_cgpa: null,
    min_class_xii_cgpa: null,
    min_graduation_cgpa: null,
    cgpa_scale: null,
    eligible_courses: [],
    eligible_passing_years: [],
    allow_backlog: false,
    status: 'active',
    company_code: undefined,
    company_id: undefined,
  });

  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [courseInput, setCourseInput] = useState('');
  const [yearInput, setYearInput] = useState<string>('');

  const courseOptions = [
    "Mechanical Engineering",
    "Electrical and Electronics Engineering (EEE)",
    "Computer Engineering and Technology(Core)",
    "Computer Engineering and Technology - AIDS",
    "Computer Engineering and Technology - Cyber Security",
    "Computer Engineering and Technology - CSBS"
  ];

  const currentYear = new Date().getFullYear();
  const graduationYears = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

  useEffect(() => {
    if (job) {
      const formattedDate = job.application_deadline 
        ? new Date(job.application_deadline).toISOString().split('T')[0]
        : '';

      setFormData({
        ...job,
        application_deadline: formattedDate,
      });
    }
  }, [job]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleStatusChange = (value: JobPostingStatus) => {
    setFormData({ ...formData, status: value });
  };

  const handleBacklogChange = (checked: boolean) => {
    setFormData({ ...formData, allow_backlog: checked });
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numberValue = value === '' ? null : parseFloat(value);
    setFormData({ ...formData, [name]: numberValue });
  };

  const handleScaleChange = (value: string) => {
    setFormData({ ...formData, cgpa_scale: value ? parseInt(value) : null });
  };

  const addCourse = (course: string) => {
    if (!course) return;
    
    const currentCourses = formData.eligible_courses || [];
    if (!currentCourses.includes(course)) {
      setFormData({ 
        ...formData, 
        eligible_courses: [...currentCourses, course] 
      });
    }
    setCourseInput('');
  };

  const removeCourse = (courseToRemove: string) => {
    const currentCourses = formData.eligible_courses || [];
    setFormData({
      ...formData,
      eligible_courses: currentCourses.filter(course => course !== courseToRemove)
    });
  };

  const addYear = () => {
    if (!yearInput) return;
    
    const year = parseInt(yearInput);
    const currentYears = formData.eligible_passing_years || [];
    
    if (!currentYears.includes(year)) {
      setFormData({
        ...formData,
        eligible_passing_years: [...currentYears, year]
      });
    }
    setYearInput('');
  };

  const removeYear = (yearToRemove: number) => {
    const currentYears = formData.eligible_passing_years || [];
    setFormData({
      ...formData,
      eligible_passing_years: currentYears.filter(year => year !== yearToRemove)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      if (!formData.title || !formData.company_name || !formData.location || 
          !formData.package || !formData.description || !formData.application_deadline) {
        toast({
          title: 'Error',
          description: 'Please fill all required fields',
          variant: 'destructive',
        });
        return;
      }

      console.log("Attempting to save job data:", formData);

      const jobData = {
        ...formData,
        eligible_courses: formData.eligible_courses || [],
        eligible_passing_years: formData.eligible_passing_years || [],
        updated_at: new Date().toISOString()
      };

      if (job?.id) {
        const { error } = await supabase
          .from('job_postings')
          .update(jobData)
          .eq('id', job.id);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Job posting updated successfully'
        });
      } else {
        const newJobData = {
          title: formData.title,
          company_name: formData.company_name,
          location: formData.location,
          package: formData.package,
          description: formData.description,
          application_deadline: formData.application_deadline,
          min_class_x_marks: formData.min_class_x_marks,
          min_class_xii_marks: formData.min_class_xii_marks,
          min_graduation_marks: formData.min_graduation_marks,
          min_class_x_cgpa: formData.min_class_x_cgpa,
          min_class_xii_cgpa: formData.min_class_xii_cgpa,
          min_graduation_cgpa: formData.min_graduation_cgpa,
          cgpa_scale: formData.cgpa_scale,
          eligible_courses: formData.eligible_courses || [],
          eligible_passing_years: formData.eligible_passing_years || [],
          allow_backlog: formData.allow_backlog,
          status: formData.status,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        console.log("Inserting new job:", newJobData);
        const { error, data } = await supabase
          .from('job_postings')
          .insert(newJobData)
          .select();

        if (error) throw error;

        console.log("Job created successfully:", data);
        toast({
          title: 'Success',
          description: 'Job posting created successfully'
        });
      }

      onSave();
    } catch (error) {
      console.error('Error saving job:', error);
      toast({
        title: 'Error',
        description: 'Failed to save job posting',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollArea className="h-[80vh]">
      <div className="space-y-6 pr-4">
        <div>
          <h2 className="text-xl font-bold">{job ? 'Edit Job Posting' : 'Create New Job Posting'}</h2>
          <p className="text-gray-600">Fill in the details for this job opportunity</p>
        </div>

        {job?.company_code && (
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <div className="flex items-center space-x-2">
              <Code size={18} className="text-gray-500" />
              <div>
                <h3 className="text-sm font-medium">Company Access Code</h3>
                <p className="text-xs text-gray-500">Companies can use this code to access their job posts</p>
              </div>
              <div className="ml-auto">
                <span className="font-mono text-sm bg-white px-3 py-1 rounded border">
                  {job.company_code}
                </span>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Job Basic Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Job Title *</Label>
              <Input 
                id="title" 
                name="title" 
                value={formData.title} 
                onChange={handleInputChange}
                placeholder="e.g. Software Engineer"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="company_name">Company Name *</Label>
              <Input 
                id="company_name" 
                name="company_name" 
                value={formData.company_name} 
                onChange={handleInputChange}
                placeholder="e.g. Tech Innovations Inc."
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Input 
                id="location" 
                name="location" 
                value={formData.location} 
                onChange={handleInputChange}
                placeholder="e.g. Bangalore, India"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="package">Package/Salary *</Label>
              <Input 
                id="package" 
                name="package" 
                value={formData.package} 
                onChange={handleInputChange}
                placeholder="e.g. ₹8-10 LPA"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Job Description *</Label>
            <Textarea 
              id="description" 
              name="description" 
              value={formData.description} 
              onChange={handleInputChange}
              placeholder="Provide details about the job role, responsibilities, requirements, etc."
              rows={6}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="application_deadline">Application Deadline *</Label>
            <Input 
              id="application_deadline" 
              name="application_deadline" 
              type="date" 
              value={formData.application_deadline || ''} 
              onChange={handleInputChange}
              required
            />
          </div>

          <Separator className="my-6" />

          {/* Eligibility Criteria */}
          <div className="border rounded-md p-4 space-y-6">
            <h3 className="font-medium">Eligibility Criteria</h3>
            
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Class X Requirements</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min_class_x_marks">Minimum Class X Marks (%)</Label>
                  <Input 
                    id="min_class_x_marks" 
                    name="min_class_x_marks" 
                    type="number" 
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.min_class_x_marks || ''} 
                    onChange={handleNumberChange}
                    placeholder="e.g. 70"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="min_class_x_cgpa">Minimum Class X CGPA</Label>
                  <Input 
                    id="min_class_x_cgpa" 
                    name="min_class_x_cgpa" 
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.min_class_x_cgpa || ''} 
                    onChange={handleNumberChange}
                    placeholder="e.g. 7.5"
                  />
                </div>
              </div>

              <h4 className="text-sm font-medium">Class XII Requirements</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min_class_xii_marks">Minimum Class XII Marks (%)</Label>
                  <Input 
                    id="min_class_xii_marks" 
                    name="min_class_xii_marks" 
                    type="number"
                    min="0"
                    max="100" 
                    step="0.01"
                    value={formData.min_class_xii_marks || ''} 
                    onChange={handleNumberChange}
                    placeholder="e.g. 70"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="min_class_xii_cgpa">Minimum Class XII CGPA</Label>
                  <Input 
                    id="min_class_xii_cgpa" 
                    name="min_class_xii_cgpa" 
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.min_class_xii_cgpa || ''} 
                    onChange={handleNumberChange}
                    placeholder="e.g. 7.5"
                  />
                </div>
              </div>

              <h4 className="text-sm font-medium">Graduation Requirements</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min_graduation_marks">Minimum Graduation Marks (%)</Label>
                  <Input 
                    id="min_graduation_marks" 
                    name="min_graduation_marks" 
                    type="number"
                    min="0"
                    max="100" 
                    step="0.01"
                    value={formData.min_graduation_marks || ''} 
                    onChange={handleNumberChange}
                    placeholder="e.g. 65"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="min_graduation_cgpa">Minimum Graduation CGPA</Label>
                  <Input 
                    id="min_graduation_cgpa" 
                    name="min_graduation_cgpa" 
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.min_graduation_cgpa || ''} 
                    onChange={handleNumberChange}
                    placeholder="e.g. 7.5"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cgpa_scale">CGPA Scale</Label>
                <Select
                  value={formData.cgpa_scale?.toString() || ''}
                  onValueChange={handleScaleChange}
                >
                  <SelectTrigger id="cgpa_scale">
                    <SelectValue placeholder="Select Scale" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Eligible Courses</h4>
              
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Select value={courseInput} onValueChange={setCourseInput}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select Course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courseOptions.map(course => (
                        <SelectItem key={course} value={course}>
                          {course}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Button 
                    type="button" 
                    onClick={() => addCourse(courseInput)}
                    disabled={!courseInput}
                  >
                    Add
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {(formData.eligible_courses || []).map(course => (
                    <Badge key={course} variant="secondary" className="flex items-center gap-1 px-3 py-1">
                      {course}
                      <X 
                        size={14} 
                        className="cursor-pointer ml-1" 
                        onClick={() => removeCourse(course)}
                      />
                    </Badge>
                  ))}
                  
                  {(formData.eligible_courses || []).length === 0 && (
                    <p className="text-sm text-gray-500">No courses selected. All courses will be eligible.</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Eligible Graduation Years</h4>
              
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Select value={yearInput} onValueChange={setYearInput}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select Year" />
                    </SelectTrigger>
                    <SelectContent>
                      {graduationYears.map(year => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Button 
                    type="button" 
                    onClick={addYear}
                    disabled={!yearInput}
                  >
                    Add
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {(formData.eligible_passing_years || []).map(year => (
                    <Badge key={year} variant="secondary" className="flex items-center gap-1 px-3 py-1">
                      {year}
                      <X 
                        size={14} 
                        className="cursor-pointer ml-1" 
                        onClick={() => removeYear(year)}
                      />
                    </Badge>
                  ))}
                  
                  {(formData.eligible_passing_years || []).length === 0 && (
                    <p className="text-sm text-gray-500">No years selected. All graduation years will be eligible.</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="allow_backlog" 
                checked={formData.allow_backlog} 
                onCheckedChange={handleBacklogChange}
              />
              <Label htmlFor="allow_backlog">Allow students with backlog to apply</Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Job Status</Label>
            <RadioGroup 
              value={formData.status} 
              onValueChange={(value) => handleStatusChange(value as JobPostingStatus)}
              className="flex flex-col space-y-1"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="active" id="active" />
                <Label htmlFor="active">Active (visible to students)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="closed" id="closed" />
                <Label htmlFor="closed">Closed (no longer accepting applications)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="draft" id="draft" />
                <Label htmlFor="draft">Draft (not visible to students)</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : (job ? 'Update Job' : 'Create Job')}
            </Button>
          </div>
        </form>
      </div>
    </ScrollArea>
  );
};

export default JobForm;
