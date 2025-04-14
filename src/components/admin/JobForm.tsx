
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
    allow_backlog: false,
    status: 'active',
  });

  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (job) {
      // Format the date to YYYY-MM-DD for the input
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      // Validate required fields
      if (!formData.title || !formData.company_name || !formData.location || 
          !formData.package || !formData.description || !formData.application_deadline) {
        toast({
          title: 'Error',
          description: 'Please fill all required fields',
          variant: 'destructive',
        });
        return;
      }

      // Check if editing or creating new job
      if (job?.id) {
        // Update existing job
        const { error } = await supabase
          .from('job_postings')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', job.id);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Job posting updated successfully'
        });
      } else {
        // Create new job
        const { error } = await supabase
          .from('job_postings')
          .insert([{
            ...formData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);

        if (error) throw error;

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
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">{job ? 'Edit Job Posting' : 'Create New Job Posting'}</h2>
        <p className="text-gray-600">Fill in the details for this job opportunity</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
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

        <div className="border rounded-md p-4 space-y-4">
          <h3 className="font-medium">Eligibility Criteria</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
  );
};

export default JobForm;
