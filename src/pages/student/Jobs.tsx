import React, { useEffect, useState } from 'react';
import StudentLayout from '@/components/layouts/StudentLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { JobPosting, JobApplication, JobPostingStatus, JobApplicationStatus } from '@/types/database.types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useStudentProfile } from '@/hooks/useStudentProfile';
import { Calendar, MapPin, Building, CheckCircle, XCircle, Search, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

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
      
      // Check eligibility for each job
      if (profile) {
        const eligibilityPromises = typedJobs.map(async (job) => {
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
      toast.error('Failed to load job listings');
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
                  const isApplicationDeadlinePassed = new Date(job.application_deadline) < new Date();
                  
                  return (
                    <Card key={job.id} className="relative overflow-hidden">
                      {isDeadlineNear(job.application_deadline) && !isApplicationDeadlinePassed && (
                        <div className="absolute top-0 right-0 bg-yellow-100 px-2 py-1 text-xs text-yellow-800 font-medium rounded-bl-md">
                          Deadline Soon
                        </div>
                      )}
                      <CardContent className="p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                          <div className="lg:col-span-2">
                            <h3 className="font-semibold text-lg text-gray-900">{job.title}</h3>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-gray-600 text-sm">
                              <div className="flex items-center">
                                <Building size={16} className="mr-1" />
                                {job.company_name}
                              </div>
                              <div className="flex items-center">
                                <MapPin size={16} className="mr-1" />
                                {job.location}
                              </div>
                              <div className="flex items-center">
                                <Calendar size={16} className="mr-1" />
                                Deadline: {formatDate(job.application_deadline)}
                              </div>
                            </div>
                            
                            <div className="mt-4">
                              <p className="text-sm text-gray-600 line-clamp-2">{job.description}</p>
                            </div>
                            
                            <div className="mt-4 flex flex-wrap gap-2">
                              {applicationStatus && (
                                <Badge className={
                                  applicationStatus === 'shortlisted' ? 'bg-green-100 text-green-800' :
                                  applicationStatus === 'rejected' ? 'bg-red-100 text-red-800' : 
                                  'bg-blue-100 text-blue-800'
                                }>
                                  {applicationStatus.replace('_', ' ').charAt(0).toUpperCase() + applicationStatus.replace('_', ' ').slice(1)}
                                </Badge>
                              )}
                              
                              <Badge className={isEligible ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                {isEligible ? 'Eligible' : 'Not Eligible'}
                              </Badge>
                              
                              {isApplicationDeadlinePassed && (
                                <Badge variant="outline" className="border-red-200 text-red-700">
                                  Deadline Passed
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex flex-col justify-between lg:items-end">
                            <div className="text-right">
                              <div className="font-semibold text-lg text-shaurya-primary">{job.package}</div>
                              <div className="text-sm text-gray-500">Package</div>
                            </div>
                            
                            <div className="flex justify-end mt-4 lg:mt-0">
                              <Dialog open={openDialog && selectedJob?.id === job.id} onOpenChange={setOpenDialog}>
                                <DialogTrigger asChild>
                                  <Button 
                                    onClick={() => setSelectedJob(job)}
                                    disabled={!!applicationStatus || !isEligible || isApplicationDeadlinePassed}
                                  >
                                    {applicationStatus ? 'Applied' : 'Apply Now'}
                                  </Button>
                                </DialogTrigger>
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
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
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
    </StudentLayout>
  );
};

export default JobsPage;
