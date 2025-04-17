import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { JobPosting } from '@/types/database.types';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  Form,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CoursesInput,
  YearsInput
} from './JobFormComponents';

// Define the form schema
const formSchema = z.object({
  title: z.string().min(1, 'Job title is required'),
  company_name: z.string().min(1, 'Company name is required'),
  company_code: z.string().min(1, 'Company code is required'),
  location: z.string().min(1, 'Location is required'),
  package: z.string().min(1, 'Package is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  application_deadline: z.date(),
  min_class_x_marks: z.number().nullable(),
  min_class_xii_marks: z.number().nullable(),
  min_graduation_marks: z.number().nullable(),
  min_class_x_cgpa: z.number().nullable(),
  min_class_xii_cgpa: z.number().nullable(),
  min_graduation_cgpa: z.number().nullable(),
  cgpa_scale: z.number().nullable(),
  eligible_courses: z.array(z.string()).nullable(),
  eligible_passing_years: z.array(z.number()).nullable(),
  allow_backlog: z.boolean().default(false),
  status: z.enum(['active', 'closed', 'draft']),
});

type FormValues = z.infer<typeof formSchema>;

interface JobFormProps {
  job?: JobPosting | null;
  onSave: () => void;
  onCancel: () => void;
}

const JobForm: React.FC<JobFormProps> = ({ job, onSave, onCancel }) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companies, setCompanies] = useState<{id: string, username: string, company_code: string}[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);

  const defaultValues: FormValues = {
    title: job?.title || '',
    company_name: job?.company_name || '',
    company_code: job?.company_code || '',
    location: job?.location || '',
    package: job?.package || '',
    description: job?.description || '',
    application_deadline: job?.application_deadline ? new Date(job.application_deadline) : new Date(),
    min_class_x_marks: job?.min_class_x_marks || null,
    min_class_xii_marks: job?.min_class_xii_marks || null,
    min_graduation_marks: job?.min_graduation_marks || null,
    min_class_x_cgpa: job?.min_class_x_cgpa || null,
    min_class_xii_cgpa: job?.min_class_xii_cgpa || null,
    min_graduation_cgpa: job?.min_graduation_cgpa || null,
    cgpa_scale: job?.cgpa_scale || 10,
    eligible_courses: job?.eligible_courses || [],
    eligible_passing_years: job?.eligible_passing_years || [],
    allow_backlog: job?.allow_backlog || false,
    status: job?.status || 'draft',
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  useEffect(() => {
    // Fetch companies
    const fetchCompanies = async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('id, username, company_code');
      
      if (error) {
        console.error('Error fetching companies:', error);
        return;
      }
      
      setCompanies(data || []);
      
      // If editing a job with company_id, set the selected company
      if (job?.company_id) {
        setSelectedCompany(job.company_id);
      }
    };
    
    fetchCompanies();
  }, [job]);

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const jobData = {
        ...values,
        // Convert Date to string format for database
        application_deadline: format(values.application_deadline, 'yyyy-MM-dd'),
        // Find the company_id if a company was selected
        company_id: selectedCompany || null,
      };

      if (job?.id) {
        // Update existing job
        const { error } = await supabase
          .from('job_postings')
          .update(jobData)
          .eq('id', job.id);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Job posting updated successfully',
        });
      } else {
        // Create new job
        const { error } = await supabase
          .from('job_postings')
          .insert([jobData]);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Job posting created successfully',
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
      setIsSubmitting(false);
    }
  };

  const handleCompanySelect = (companyId: string) => {
    setSelectedCompany(companyId);
    
    // Find the selected company details
    const company = companies.find(c => c.id === companyId);
    
    if (company) {
      // Update company name and code in the form
      form.setValue('company_name', company.username);
      form.setValue('company_code', company.company_code);
    }
  };

  return (
    <div className="max-h-[80vh] overflow-y-auto pr-1">
      <DialogHeader>
        <DialogTitle>{job ? 'Edit Job Posting' : 'Create New Job Posting'}</DialogTitle>
        <DialogDescription>
          {job ? 'Update the details of this job posting' : 'Add a new job posting to the system'}
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Software Engineer" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {companies.length > 0 && (
              <div className="space-y-1">
                <label className="text-sm font-medium">Select Company (Optional)</label>
                <Select
                  value={selectedCompany || ''}
                  onValueChange={handleCompanySelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a company" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No company selected</SelectItem>
                    {companies.map(company => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.username} ({company.company_code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500">
                  Selecting a company will auto-fill company details
                </p>
              </div>
            )}

            <FormField
              control={form.control}
              name="company_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Acme Inc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="company_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Code</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. ACME123" {...field} />
                  </FormControl>
                  <FormDescription>
                    Unique code for company access
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Bangalore, India" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="package"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Package</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 10-12 LPA" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="application_deadline"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Application Deadline</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter details about the job role, responsibilities, and requirements..."
                    className="min-h-32"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Eligibility Criteria</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <FormField
                  control={form.control}
                  name="min_class_x_marks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Class X Percentage</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g. 60"
                          {...field}
                          value={field.value === null ? '' : field.value}
                          onChange={(e) => {
                            const value = e.target.value === '' ? null : parseFloat(e.target.value);
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormDescription>Leave empty if not applicable</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div>
                <FormField
                  control={form.control}
                  name="min_class_x_cgpa"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Class X CGPA</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g. 6.0"
                          {...field}
                          value={field.value === null ? '' : field.value}
                          onChange={(e) => {
                            const value = e.target.value === '' ? null : parseFloat(e.target.value);
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormDescription>Leave empty if not applicable</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <FormField
                  control={form.control}
                  name="min_class_xii_marks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Class XII Percentage</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g. 60"
                          {...field}
                          value={field.value === null ? '' : field.value}
                          onChange={(e) => {
                            const value = e.target.value === '' ? null : parseFloat(e.target.value);
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormDescription>Leave empty if not applicable</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div>
                <FormField
                  control={form.control}
                  name="min_class_xii_cgpa"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Class XII CGPA</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g. 6.0"
                          {...field}
                          value={field.value === null ? '' : field.value}
                          onChange={(e) => {
                            const value = e.target.value === '' ? null : parseFloat(e.target.value);
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormDescription>Leave empty if not applicable</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <FormField
                  control={form.control}
                  name="min_graduation_marks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Graduation Percentage</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g. 65"
                          {...field}
                          value={field.value === null ? '' : field.value}
                          onChange={(e) => {
                            const value = e.target.value === '' ? null : parseFloat(e.target.value);
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormDescription>Leave empty if not applicable</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div>
                <FormField
                  control={form.control}
                  name="min_graduation_cgpa"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Graduation CGPA</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g. 6.5"
                          {...field}
                          value={field.value === null ? '' : field.value}
                          onChange={(e) => {
                            const value = e.target.value === '' ? null : parseFloat(e.target.value);
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormDescription>Leave empty if not applicable</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <FormField
                  control={form.control}
                  name="cgpa_scale"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CGPA Scale</FormLabel>
                      <Select
                        value={field.value?.toString() || '10'}
                        onValueChange={(value) => field.onChange(parseInt(value))}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select CGPA scale" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="4">4.0</SelectItem>
                          <SelectItem value="5">5.0</SelectItem>
                          <SelectItem value="10">10.0</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>Scale used for CGPA calculations</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div>
                <FormField
                  control={form.control}
                  name="allow_backlog"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-6">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Allow Backlog</FormLabel>
                        <FormDescription>
                          Allow students with backlog to apply
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Controller
              control={form.control}
              name="eligible_courses"
              render={({ field }) => (
                <CoursesInput
                  value={field.value || []}
                  onChange={field.onChange}
                />
              )}
            />

            <Controller
              control={form.control}
              name="eligible_passing_years"
              render={({ field }) => (
                <YearsInput
                  value={field.value || []}
                  onChange={field.onChange}
                />
              )}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : (job ? 'Update' : 'Create')}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </div>
  );
};

export default JobForm;
