
import React, { useEffect, useState } from 'react';
import StudentLayout from '@/components/layouts/StudentLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { JobPosting, JobApplication, JobPostingStatus, JobApplicationStatus } from '@/types/database.types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useStudentProfile } from '@/hooks/useStudentProfile';
import { Calendar, MapPin, Building, CheckCircle, XCircle, Search, AlertCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import JobCard from '@/components/student/JobCard';

const JobsPage = () => {
  const { user } = useAuth();
  const { profile } = useStudentProfile();
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [eligibilityStatus, setEligibilityStatus] = useState<Record<string, boolean>>({});
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [applying, setApplying] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 5;
  const [hasFlaggedSections, setHasFlaggedSections] = useState(false);

  // Fetch jobs
  const fetchJobs = async () => {
    try {
      setLoading(true);
      
      // Get job postings that are active
      const { data: jobData, error: jobError } = await supabase
        .from('job_postings')
        .select('*')
        .eq('status', 'active')
        .order('application_deadline', { ascending: true });
        
      if (jobError) throw jobError;

      // Get student's job applications
      const { data: applicationData, error: applicationError } = await supabase
        .from('job_applications')
        .select('*')
        .eq('student_id', profile?.id || '');
        
      if (applicationError) throw applicationError;
      
      // Type-cast the data
      const typedJobs: JobPosting[] = jobData?.map(job => ({
        ...job,
        status: job.status as JobPostingStatus
      })) || [];
      
      const typedApplications: JobApplication[] = applicationData?.map(app => ({
        ...app,
        status: app.status as JobApplicationStatus
      })) || [];
      
      setJobs(typedJobs);
      setApplications(typedApplications);
      
      // Check for flagged sections
      if (profile && profile.flagged_sections && profile.flagged_sections.length > 0) {
        setHasFlaggedSections(true);
      } else {
        setHasFlaggedSections(false);
      }

      // Check eligibility for each job
      if (profile) {
        const eligibilityPromises = typedJobs.map(async (job) => {
          // Only check eligibility if profile is verified and has no flagged sections
          if (profile.is_verified && !hasFlaggedSections) {
            // Use the database function to check eligibility
            const { data, error } = await supabase
              .rpc('check_job_eligibility', {
                p_student_id: profile.id,
                p_job_id: job.id
              });
              
            if (error) {
              console.error('Error checking eligibility:', error);
              return { jobId: job.id, eligible: false };
            }
            
            return { jobId: job.id, eligible: data };
          } else {
            // If profile is not verified or has flagged sections, student is not eligible
            return { jobId: job.id, eligible: false };
          }
        });
        
        const eligibilityResults = await Promise.all(eligibilityPromises);
        const eligibilityMap = eligibilityResults.reduce((acc, curr) => {
          acc[curr.jobId as string] = curr.eligible;
          return acc;
        }, {} as Record<string, boolean>);
        
        setEligibilityStatus(eligibilityMap);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast('Failed to load job listings');
    } finally {
      setLoading(false);
    }
  };

  // Handle job application
  const handleApply = async () => {
    if (!selectedJob || !profile) return;
    
    try {
      setApplying(true);
      
      // Check if already applied
      const isApplied = applications.some(app => app.job_id === selectedJob.id);
      if (isApplied) {
        toast.error('You have already applied for this job');
        setOpenDialog(false);
        return;
      }
      
      // Check eligibility
      const isEligible = eligibilityStatus[selectedJob.id || ''];
      if (!isEligible) {
        toast.error('You are not eligible for this job');
        setOpenDialog(false);
        return;
      }
      
      // Create application
      const { error } = await supabase
        .from('job_applications')
        .insert({
          job_id: selectedJob.id,
          student_id: profile.id,
          status: 'applied'
        });
      
      if (error) throw error;
      
      // Create notification for the student
      await supabase
        .from('notifications')
        .insert({
          user_id: user?.id || '',
          title: 'Job Application Submitted',
          message: `You have successfully applied for ${selectedJob.title} at ${selectedJob.company_name}.`
        });
      
      toast.success('Job application submitted successfully');
      fetchJobs(); // Refresh data
      setOpenDialog(false);
    } catch (error) {
      console.error('Error applying for job:', error);
      toast.error('Failed to submit application');
    } finally {
      setApplying(false);
    }
  };

  // Get application status for a job
  const getApplicationStatus = (jobId: string): JobApplicationStatus | null => {
    const application = applications.find(app => app.job_id === jobId);
    return application ? application.status : null;
  };

  // Filter jobs based on search term
  const filteredJobs = jobs.filter(job => {
    const searchLower = searchTerm.toLowerCase();
    return (
      job.title.toLowerCase().includes(searchLower) ||
      job.company_name.toLowerCase().includes(searchLower) ||
      job.location.toLowerCase().includes(searchLower)
    );
  });

  // Pagination
  const indexOfLastJob = currentPage * jobsPerPage;
  const indexOfFirstJob = indexOfLastJob - jobsPerPage;
  const currentJobs = filteredJobs.slice(indexOfFirstJob, indexOfLastJob);
  const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Check if deadline is near (less than 5 days)
  const isDeadlineNear = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 5 && diffDays > 0;
  };

  useEffect(() => {
    if (profile) {
      fetchJobs();
    }
  }, [profile]);

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Job Listings</h1>
          <p className="text-gray-600">Browse and apply for available job opportunities</p>
        </div>
        
        {!profile?.is_verified && (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-4">
            <div className="flex items-start">
              <AlertTriangle className="text-amber-500 mr-2 mt-0.5" size={20} />
              <div>
                <h3 className="font-medium text-amber-800">Profile Not Verified</h3>
                <p className="text-amber-700 text-sm mt-1">
                  Your profile needs to be verified before you can apply for jobs. Please complete your profile and wait for admin verification.
                </p>
              </div>
            </div>
          </div>
        )}

        {profile?.is_verified && hasFlaggedSections && (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-4">
            <div className="flex items-start">
              <AlertTriangle className="text-amber-500 mr-2 mt-0.5" size={20} />
              <div>
                <h3 className="font-medium text-amber-800">Profile Has Flagged Sections</h3>
                <p className="text-amber-700 text-sm mt-1">
                  Some sections of your profile have been flagged during verification. This may limit your eligibility for job applications.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input 
              placeholder="Search jobs by title, company or location..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {/* Job Listings */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <div className="animate-spin w-8 h-8 border-4 border-shaurya-primary border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <>
            {currentJobs.length > 0 ? (
              <div className="space-y-4">
                {currentJobs.map((job) => {
                  const applicationStatus = getApplicationStatus(job.id || '');
                  const isEligible = eligibilityStatus[job.id || ''] === true;
                  
                  return (
                    <JobCard 
                      key={job.id}
                      job={job}
                      isApplied={!!applicationStatus}
                      isProfileVerified={!!profile?.is_verified}
                      isFlaggedProfile={hasFlaggedSections}
                      onApply={fetchJobs}
                    />
                  );
                })}
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                        />
                      </PaginationItem>
                      {Array.from({ length: totalPages }).map((_, index) => (
                        <PaginationItem key={index}>
                          <PaginationLink
                            isActive={currentPage === index + 1}
                            onClick={() => setCurrentPage(index + 1)}
                          >
                            {index + 1}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="p-6 text-center">
                  <div className="flex flex-col items-center justify-center py-10">
                    <div className="rounded-full bg-gray-100 p-3 mb-4">
                      <Search className="h-6 w-6 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">No jobs found</h3>
                    <p className="text-gray-500 mt-1">
                      {searchTerm ? 'Try a different search term' : 'There are no active job listings at the moment'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      {/* Apply Job Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply for {selectedJob?.title}</DialogTitle>
            <DialogDescription>
              You are about to apply for the position of {selectedJob?.title} at {selectedJob?.company_name}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 my-4">
            <div className="flex flex-col">
              <span className="font-medium">Company:</span>
              <span>{selectedJob?.company_name}</span>
            </div>
            <div className="flex flex-col">
              <span className="font-medium">Location:</span>
              <span>{selectedJob?.location}</span>
            </div>
            <div className="flex flex-col">
              <span className="font-medium">Package:</span>
              <span>{selectedJob?.package}</span>
            </div>
            <div className="flex flex-col">
              <span className="font-medium">Application Deadline:</span>
              <span>{selectedJob?.application_deadline ? formatDate(selectedJob.application_deadline) : ''}</span>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-md">
              <div className="flex items-start">
                <AlertCircle className="text-yellow-500 mr-2 mt-0.5" size={18} />
                <div>
                  <p className="font-medium text-yellow-700">Important:</p>
                  <p className="text-sm text-yellow-600">
                    By applying, you confirm that all information in your profile is accurate and complete.
                    Your application and details will be shared with the company.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setOpenDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleApply}
              disabled={applying}
            >
              {applying ? 'Submitting...' : 'Confirm Application'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </StudentLayout>
  );
};

export default JobsPage;
