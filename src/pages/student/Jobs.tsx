
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StudentLayout from '@/components/layouts/StudentLayout';
import JobCard from '@/components/student/JobCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useStudentProfile } from '@/hooks/useStudentProfile';
import { useJobApplications } from '@/hooks/useJobApplications';
import { JobPosting, JobPostingStatus } from '@/types/database.types';
import { 
  Briefcase, 
  Search, 
  MapPin, 
  Calendar, 
  Check, 
  X, 
  AlertCircle 
} from 'lucide-react';

const Jobs = () => {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<JobPosting[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [locations, setLocations] = useState<string[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [userCanApply, setUserCanApply] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { profile, isLoading: profileLoading } = useStudentProfile();
  const { applications, hasSelectedApplication, refreshData: refreshApplications } = useJobApplications();

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('job_postings')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Type-cast the data to ensure it matches the JobPosting type
      const typedJobs = data?.map(job => ({
        ...job,
        status: job.status as JobPostingStatus
      })) || [];
      
      setJobs(typedJobs);
      setFilteredJobs(typedJobs);
      
      // Extract unique locations
      const uniqueLocations = [...new Set(typedJobs.map(job => job.location))];
      setLocations(uniqueLocations);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load job listings',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (profile) {
      const canApply = checkIfUserCanApply();
      setUserCanApply(canApply);
    }
  }, [profile, applications]);

  const checkIfUserCanApply = () => {
    if (!profile) return false;
    
    // Check if student has a selected application
    if (hasSelectedApplication) {
      return false;
    }
    
    // Check if student is blocked
    if (profile.is_blocked) {
      return false;
    }
    
    // Check if student is verified
    if (!profile.is_verified) {
      return false;
    }
    
    // Check if student is interested in placement
    if (profile.placement_interest !== 'placement/internship') {
      return false;
    }
    
    // Check if student has agreed to policies
    if (!profile.agreed_to_policies) {
      return false;
    }
    
    return true;
  };

  const filterJobs = () => {
    let result = [...jobs];
    
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(job => 
        job.title.toLowerCase().includes(search) || 
        job.company_name.toLowerCase().includes(search) ||
        job.description.toLowerCase().includes(search)
      );
    }
    
    if (locationFilter) {
      result = result.filter(job => job.location === locationFilter);
    }
    
    setFilteredJobs(result);
  };

  useEffect(() => {
    filterJobs();
  }, [searchTerm, locationFilter, jobs]);

  const applyForJob = async (job: JobPosting) => {
    if (!userCanApply) {
      if (hasSelectedApplication) {
        setAlertMessage("You've already been selected for a position and cannot apply for more jobs.");
      } else if (profile?.is_blocked) {
        setAlertMessage("Your account has been blocked. Please contact the placement office.");
      } else if (!profile?.is_verified) {
        setAlertMessage("Your profile is not verified yet. Please wait for verification to apply for jobs.");
      } else if (profile?.placement_interest !== 'placement/internship') {
        setAlertMessage("You've opted out of placement. Please update your placement interest to apply for jobs.");
      } else if (!profile?.agreed_to_policies) {
        setAlertMessage("You need to agree to the placement policies before applying for jobs.");
      }
      setAlertOpen(true);
      return;
    }
    
    try {
      // Check eligibility
      if (job.min_class_x_marks || job.min_class_x_cgpa) {
        const { data: classXData } = await supabase
          .from('class_x_details')
          .select('*')
          .eq('student_id', profile?.id)
          .single();
          
        if (classXData) {
          if (job.min_class_x_marks && !classXData.is_cgpa && classXData.marks < job.min_class_x_marks) {
            toast({
              title: "Eligibility Issue",
              description: `Your Class X marks (${classXData.marks}%) do not meet the minimum requirement (${job.min_class_x_marks}%).`,
              variant: "destructive",
            });
            return;
          }
          
          if (job.min_class_x_cgpa && classXData.is_cgpa && classXData.marks < job.min_class_x_cgpa) {
            toast({
              title: "Eligibility Issue",
              description: `Your Class X CGPA (${classXData.marks}) does not meet the minimum requirement (${job.min_class_x_cgpa}).`,
              variant: "destructive",
            });
            return;
          }
        }
      }
      
      if (job.min_class_xii_marks || job.min_class_xii_cgpa) {
        const { data: classXIIData } = await supabase
          .from('class_xii_details')
          .select('*')
          .eq('student_id', profile?.id)
          .single();
          
        if (classXIIData) {
          if (job.min_class_xii_marks && !classXIIData.is_cgpa && classXIIData.marks < job.min_class_xii_marks) {
            toast({
              title: "Eligibility Issue",
              description: `Your Class XII marks (${classXIIData.marks}%) do not meet the minimum requirement (${job.min_class_xii_marks}%).`,
              variant: "warning",
            });
            return;
          }
          
          if (job.min_class_xii_cgpa && classXIIData.is_cgpa && classXIIData.marks < job.min_class_xii_cgpa) {
            toast({
              title: "Eligibility Issue",
              description: `Your Class XII CGPA (${classXIIData.marks}) does not meet the minimum requirement (${job.min_class_xii_cgpa}).`,
              variant: "warning",
            });
            return;
          }
        }
      }
      
      if (job.min_graduation_marks || job.min_graduation_cgpa || job.eligible_courses || job.eligible_passing_years) {
        const { data: gradData } = await supabase
          .from('graduation_details')
          .select('*')
          .eq('student_id', profile?.id)
          .single();
          
        if (gradData) {
          if (job.min_graduation_marks && !gradData.is_cgpa && gradData.marks < job.min_graduation_marks) {
            toast({
              title: "Eligibility Issue",
              description: `Your graduation marks (${gradData.marks}%) do not meet the minimum requirement (${job.min_graduation_marks}%).`,
              variant: "warning",
            });
            return;
          }
          
          if (job.min_graduation_cgpa && gradData.is_cgpa && gradData.marks < job.min_graduation_cgpa) {
            toast({
              title: "Eligibility Issue",
              description: `Your graduation CGPA (${gradData.marks}) does not meet the minimum requirement (${job.min_graduation_cgpa}).`,
              variant: "destructive",
            });
            return;
          }
          
          if (job.eligible_courses && job.eligible_courses.length > 0 && !job.eligible_courses.includes(gradData.course)) {
            toast({
              title: "Eligibility Issue",
              description: `Your course (${gradData.course}) is not eligible for this job.`,
              variant: "destructive",
            });
            return;
          }
          
          if (job.eligible_passing_years && job.eligible_passing_years.length > 0 && !job.eligible_passing_years.includes(gradData.passing_year)) {
            toast({
              title: "Eligibility Issue",
              description: `Your passing year (${gradData.passing_year}) is not eligible for this job.`,
              variant: "destructive",
            });
            return;
          }
          
          if (!job.allow_backlog && gradData.has_backlog) {
            toast({
              title: "Eligibility Issue",
              description: "This job does not allow students with backlogs.",
              variant: "destructive",
            });
            return;
          }
        }
      }
      
      // Submit application
      const { data, error } = await supabase
        .from('job_applications')
        .insert([
          { 
            job_id: job.id,
            student_id: profile?.id,
            status: 'applied'
          }
        ]);
      
      if (error) throw error;
      
      toast({
        title: "Application Submitted",
        description: `You have successfully applied for ${job.title} at ${job.company_name}.`,
      });
      
      refreshApplications();
      
    } catch (error) {
      console.error('Error applying for job:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit your application. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const openJobDetails = (job: JobPosting) => {
    setSelectedJob(job);
    setDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Job Listings</h1>
            <p className="text-muted-foreground">Browse and apply for available opportunities</p>
          </div>
          
          {!userCanApply && (
            <div className="flex items-center">
              {hasSelectedApplication && (
                <Badge className="bg-green-500">Selected for a position</Badge>
              )}
              {profile?.is_blocked && (
                <Badge className="bg-red-500">Account Blocked</Badge>
              )}
              {!profile?.is_verified && (
                <Badge variant="outline" className="border-amber-500 text-amber-500">Verification Pending</Badge>
              )}
              {profile?.placement_interest !== 'placement/internship' && (
                <Badge variant="outline" className="border-blue-500 text-blue-500">Opted Out of Placement</Badge>
              )}
              {!profile?.agreed_to_policies && (
                <Badge variant="outline" className="border-orange-500 text-orange-500">Policies Not Accepted</Badge>
              )}
            </div>
          )}
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Find Jobs</CardTitle>
            <CardDescription>Use filters to narrow down your search</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  placeholder="Search by title, company or keywords"
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="w-full md:w-64">
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Locations</SelectItem>
                    {locations.map((location) => (
                      <SelectItem key={location} value={location}>{location}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {locationFilter && (
                <Button variant="ghost" onClick={() => setLocationFilter('')}>
                  Clear Filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.length > 0 ? (
            filteredJobs.map((job) => (
              <JobCard 
                key={job.id as string} 
                job={job} 
                onApply={() => applyForJob(job)}
                isApplied={applications.some(app => app.job_id === job.id)}
                isProfileVerified={profile?.is_verified || false}
                isFlaggedProfile={!userCanApply}
              />
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-12">
              <Briefcase className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No jobs found</h3>
              <p className="text-gray-500 mt-1">Try adjusting your search filters</p>
            </div>
          )}
        </div>
      </div>
      
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl overflow-y-auto max-h-[90vh]">
          {selectedJob && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedJob.title}</DialogTitle>
                <DialogDescription>
                  <span className="font-medium text-primary">{selectedJob.company_name}</span> • {selectedJob.location}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 my-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <MapPin size={16} className="text-gray-500" />
                    <span>{selectedJob.location}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar size={16} className="text-gray-500" />
                    <span>Apply by {formatDate(selectedJob.application_deadline)}</span>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-1">Package</h3>
                  <p>{selectedJob.package}</p>
                </div>
                
                <div>
                  <h3 className="font-medium mb-1">Job Description</h3>
                  <div className="prose prose-sm max-w-none">
                    <p style={{ whiteSpace: 'pre-line' }}>{selectedJob.description}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-1">Eligibility Criteria</h3>
                  <div className="space-y-2">
                    {(selectedJob.min_class_x_marks || selectedJob.min_class_x_cgpa) && (
                      <div>
                        <span className="font-semibold">Class X: </span>
                        {selectedJob.min_class_x_marks && 
                          <span>Minimum {selectedJob.min_class_x_marks}% marks</span>}
                        {selectedJob.min_class_x_cgpa && 
                          <span>Minimum {selectedJob.min_class_x_cgpa} CGPA</span>}
                      </div>
                    )}
                    
                    {(selectedJob.min_class_xii_marks || selectedJob.min_class_xii_cgpa) && (
                      <div>
                        <span className="font-semibold">Class XII: </span>
                        {selectedJob.min_class_xii_marks && 
                          <span>Minimum {selectedJob.min_class_xii_marks}% marks</span>}
                        {selectedJob.min_class_xii_cgpa && 
                          <span>Minimum {selectedJob.min_class_xii_cgpa} CGPA</span>}
                      </div>
                    )}
                    
                    {(selectedJob.min_graduation_marks || selectedJob.min_graduation_cgpa) && (
                      <div>
                        <span className="font-semibold">Graduation: </span>
                        {selectedJob.min_graduation_marks && 
                          <span>Minimum {selectedJob.min_graduation_marks}% marks</span>}
                        {selectedJob.min_graduation_cgpa && 
                          <span>Minimum {selectedJob.min_graduation_cgpa} CGPA</span>}
                      </div>
                    )}
                    
                    {selectedJob.eligible_courses && selectedJob.eligible_courses.length > 0 && (
                      <div>
                        <span className="font-semibold">Eligible Courses: </span>
                        <span>{selectedJob.eligible_courses.join(', ')}</span>
                      </div>
                    )}
                    
                    {selectedJob.eligible_passing_years && selectedJob.eligible_passing_years.length > 0 && (
                      <div>
                        <span className="font-semibold">Eligible Passing Years: </span>
                        <span>{selectedJob.eligible_passing_years.join(', ')}</span>
                      </div>
                    )}
                    
                    <div>
                      <span className="font-semibold">Backlog Policy: </span>
                      {selectedJob.allow_backlog ? 
                        <span className="text-green-600 flex items-center"><Check size={16} className="mr-1" /> Students with backlog allowed</span> : 
                        <span className="text-red-600 flex items-center"><X size={16} className="mr-1" /> No backlog allowed</span>}
                    </div>
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="secondary" onClick={() => setDialogOpen(false)}>Close</Button>
                <Button onClick={() => applyForJob(selectedJob)} disabled={!userCanApply || applications.some(app => app.job_id === selectedJob.id)}>
                  {applications.some(app => app.job_id === selectedJob.id) ? 'Already Applied' : 'Apply Now'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-amber-500" />
              Application Restricted
            </AlertDialogTitle>
            <AlertDialogDescription>
              {alertMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Dismiss</AlertDialogCancel>
            {(profile?.placement_interest !== 'placement/internship' || !profile?.agreed_to_policies) && (
              <AlertDialogAction onClick={() => navigate('/student/profile')}>
                Update Profile
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </StudentLayout>
  );
};

export default Jobs;
