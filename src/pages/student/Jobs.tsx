
import React, { useState, useEffect } from 'react';
import StudentLayout from '@/components/layouts/StudentLayout';
import JobCard from '@/components/student/JobCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { JobPosting } from '@/types/database.types';
import { supabase } from '@/integrations/supabase/client';
import { useStudentProfile } from '@/hooks/useStudentProfile';
import { useJobApplications } from '@/hooks/useJobApplications';
import { Search, AlertTriangle, ShieldAlert, Info, CheckCircle2, FileWarning } from 'lucide-react';

const Jobs = () => {
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<JobPosting[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState<string[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [policyDialogOpen, setPolicyDialogOpen] = useState(false);
  
  const { profile, classX, classXII, graduation, resume } = useStudentProfile();
  const { applications, refreshData, hasSelectedApplication } = useJobApplications();
  const { toast } = useToast();
  
  useEffect(() => {
    const fetchJobPostings = async () => {
      try {
        setLoading(true);
        
        // Fetch active job postings
        const { data, error } = await supabase
          .from('job_postings')
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Get unique locations for filtering
        const locationSet = new Set<string>();
        data?.forEach(job => {
          if (job.location) {
            locationSet.add(job.location);
          }
        });
        
        setLocations(Array.from(locationSet).sort());
        setJobPostings(data || []);
        setFilteredJobs(data || []);
      } catch (error) {
        console.error('Error fetching job postings:', error);
        toast({
          title: 'Error',
          description: 'Failed to load job postings',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchJobPostings();
  }, []);
  
  useEffect(() => {
    let results = jobPostings;
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(
        job =>
          job.title.toLowerCase().includes(query) ||
          job.company_name.toLowerCase().includes(query) ||
          job.description.toLowerCase().includes(query)
      );
    }
    
    // Filter by location
    if (locationFilter) {
      results = results.filter(job => job.location === locationFilter);
    }
    
    setFilteredJobs(results);
  }, [searchQuery, locationFilter, jobPostings]);
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  const clearFilters = () => {
    setSearchQuery('');
    setLocationFilter('');
  };
  
  const openConfirmDialog = (job: JobPosting) => {
    setSelectedJob(job);
    
    // Check if profile is verified and not blocked
    if (!profile?.is_verified) {
      toast({
        title: 'Not Verified',
        description: 'Your profile must be verified before you can apply for jobs.',
        variant: 'destructive',
      });
      return;
    }
    
    if (profile?.is_blocked) {
      toast({
        title: 'Account Blocked',
        description: 'Your account has been blocked. Please contact the placement office.',
        variant: 'destructive',
      });
      return;
    }
    
    // Check if the student has selected a non-placement interest
    if (profile?.placement_interest && profile.placement_interest !== 'placement/internship') {
      toast({
        title: 'Not Eligible',
        description: 'Your profile indicates you are not interested in placements/internships.',
        variant: 'destructive',
      });
      return;
    }
    
    // Check if student has already been selected for another job
    if (hasSelectedApplication) {
      toast({
        title: 'Already Selected',
        description: 'You have already been selected for another job and cannot apply for more.',
        variant: 'destructive',
      });
      return;
    }
    
    // Check if the student has already applied to this job
    const alreadyApplied = applications.some(app => app.job_id === job.id);
    if (alreadyApplied) {
      toast({
        title: 'Already Applied',
        description: 'You have already applied for this job.',
        variant: 'destructive',
      });
      return;
    }
    
    // Check if student has agreed to policies
    if (!profile?.agreed_to_policies) {
      setPolicyDialogOpen(true);
      return;
    }
    
    // Check if the student meets eligibility criteria
    const isEligible = checkEligibility(job);
    if (!isEligible) {
      toast({
        title: 'Not Eligible',
        description: 'You do not meet the eligibility criteria for this job.',
        variant: 'destructive',
      });
      return;
    }
    
    // Check if student has resume uploaded
    if (!resume) {
      toast({
        title: 'Resume Required',
        description: 'Please upload your resume before applying for jobs.',
        variant: 'destructive',
      });
      return;
    }
    
    setConfirmDialogOpen(true);
  };
  
  const checkEligibility = (job: JobPosting): boolean => {
    // Check if profile is flagged in any section
    if (profile?.flagged_sections && profile.flagged_sections.length > 0) {
      return false;
    }
    
    // Check Class X marks requirement
    if (job.min_class_x_marks && classX) {
      if (classX.is_cgpa) {
        // Convert CGPA to percentage if CGPA scale is available
        if (job.min_class_x_cgpa && classX.cgpa_scale) {
          if ((classX.marks / classX.cgpa_scale) * 10 < job.min_class_x_cgpa) {
            return false;
          }
        }
      } else if (classX.marks < job.min_class_x_marks) {
        return false;
      }
    }
    
    // Check Class XII marks requirement
    if (job.min_class_xii_marks && classXII) {
      if (classXII.is_cgpa) {
        // Convert CGPA to percentage if CGPA scale is available
        if (job.min_class_xii_cgpa && classXII.cgpa_scale) {
          if ((classXII.marks / classXII.cgpa_scale) * 10 < job.min_class_xii_cgpa) {
            return false;
          }
        }
      } else if (classXII.marks < job.min_class_xii_marks) {
        return false;
      }
    }
    
    // Check Graduation marks requirement
    if (job.min_graduation_marks && graduation) {
      if (graduation.is_cgpa) {
        // Convert CGPA to percentage if CGPA scale is available
        if (job.min_graduation_cgpa && graduation.cgpa_scale) {
          if ((graduation.marks / graduation.cgpa_scale) * 10 < job.min_graduation_cgpa) {
            return false;
          }
        }
      } else if (graduation.marks < job.min_graduation_marks) {
        return false;
      }
    }
    
    // Check for backlog criteria
    if (!job.allow_backlog && graduation?.has_backlog) {
      return false;
    }
    
    // Check for eligible courses
    if (job.eligible_courses && job.eligible_courses.length > 0 && graduation) {
      if (!job.eligible_courses.includes(graduation.course)) {
        return false;
      }
    }
    
    // Check for eligible passing years
    if (job.eligible_passing_years && job.eligible_passing_years.length > 0 && graduation) {
      if (!job.eligible_passing_years.includes(graduation.passing_year)) {
        return false;
      }
    }
    
    return true;
  };
  
  const handleApply = async () => {
    if (!selectedJob || !profile) return;
    
    setIsApplying(true);
    
    try {
      // Create the application
      const { error } = await supabase.from('job_applications').insert({
        job_id: selectedJob.id,
        student_id: profile.id,
        status: 'applied',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      
      if (error) throw error;
      
      // Create notification for admin
      await supabase.from('notifications').insert({
        user_id: 'admin', // This could be a specific admin user ID in a real app
        title: 'New Job Application',
        message: `${profile.first_name} ${profile.last_name} has applied for ${selectedJob.title} at ${selectedJob.company_name}.`,
        is_read: false,
      });
      
      // Refresh applications list
      refreshData();
      
      toast({
        title: 'Application Submitted',
        description: `You have successfully applied for ${selectedJob.title} at ${selectedJob.company_name}.`,
      });
      
      setConfirmDialogOpen(false);
    } catch (error) {
      console.error('Error applying for job:', error);
      toast({
        title: 'Application Failed',
        description: 'There was an error submitting your application. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsApplying(false);
    }
  };
  
  const handleAgreeToPolicy = async () => {
    if (!profile) return;
    
    try {
      const { error } = await supabase
        .from('student_profiles')
        .update({ agreed_to_policies: true })
        .eq('id', profile.id);
      
      if (error) throw error;
      
      // Update local state
      if (selectedJob) {
        openConfirmDialog(selectedJob);
      }
      
      setPolicyDialogOpen(false);
    } catch (error) {
      console.error('Error updating policy agreement:', error);
      toast({
        title: 'Error',
        description: 'Failed to update policy agreement',
        variant: 'destructive',
      });
    }
  };
  
  const getProfileStatus = () => {
    if (!profile) return null;
    
    if (profile.is_blocked) {
      return (
        <Alert variant="destructive" className="mb-4">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Account Blocked</AlertTitle>
          <AlertDescription>
            Your account has been blocked by the administration. You cannot apply for jobs.
            Please contact the placement office for more information.
          </AlertDescription>
        </Alert>
      );
    }
    
    if (hasSelectedApplication) {
      return (
        <Alert variant="default" className="mb-4 bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertTitle>Selected for a Job</AlertTitle>
          <AlertDescription>
            Congratulations! You have been selected for a job. You cannot apply for additional jobs.
            Check your applications tab for details.
          </AlertDescription>
        </Alert>
      );
    }
    
    if (!profile.is_verified) {
      return (
        <Alert variant="warning" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Profile Not Verified</AlertTitle>
          <AlertDescription>
            Your profile has not been verified yet. You cannot apply for jobs until your profile is verified.
          </AlertDescription>
        </Alert>
      );
    }
    
    if (profile.placement_interest && profile.placement_interest !== 'placement/internship') {
      return (
        <Alert variant="warning" className="mb-4">
          <Info className="h-4 w-4" />
          <AlertTitle>Not Opted for Placement</AlertTitle>
          <AlertDescription>
            You have indicated interest in {profile.placement_interest.replace('_', ' ')} rather than placement/internship.
            You cannot apply for jobs until you update your preference in your profile.
          </AlertDescription>
        </Alert>
      );
    }
    
    if (profile.flagged_sections && profile.flagged_sections.length > 0) {
      return (
        <Alert variant="warning" className="mb-4">
          <FileWarning className="h-4 w-4" />
          <AlertTitle>Profile Issues</AlertTitle>
          <AlertDescription>
            Some sections of your profile have been flagged: {profile.flagged_sections.join(', ')}.
            This may affect your eligibility for certain jobs.
          </AlertDescription>
        </Alert>
      );
    }
    
    return null;
  };
  
  return (
    <StudentLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Job Listings</h1>
          <p className="text-gray-600">Browse and apply for available job opportunities</p>
        </div>
        
        {getProfileStatus()}
        
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Search by job title, company or description..."
              className="pl-10"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
          
          <div className="w-full md:w-64">
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Locations</SelectItem>
                {locations.map(location => (
                  <SelectItem key={location} value={location}>{location}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
        </div>
        
        <Tabs defaultValue="list" className="space-y-4">
          <TabsList>
            <TabsTrigger value="list">List View</TabsTrigger>
            <TabsTrigger value="cards">Card View</TabsTrigger>
          </TabsList>
          
          <TabsContent value="list">
            {loading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
              </div>
            ) : filteredJobs.length > 0 ? (
              <div className="space-y-4">
                {filteredJobs.map(job => (
                  <div key={job.id} className="border rounded-lg p-4 bg-white">
                    <div className="flex flex-col md:flex-row justify-between md:items-center">
                      <div>
                        <h3 className="text-lg font-semibold">{job.title}</h3>
                        <p className="text-gray-600">{job.company_name}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-2 md:mt-0">
                        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">{job.location}</Badge>
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-200">{job.package}</Badge>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <p className="line-clamp-2 text-gray-700">{job.description}</p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row justify-between mt-4 pt-3 border-t border-gray-100">
                      <div className="text-sm text-gray-500">
                        Deadline: {new Date(job.application_deadline).toLocaleDateString()}
                      </div>
                      <Button className="mt-2 sm:mt-0" onClick={() => openConfirmDialog(job)}>Apply Now</Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <div className="flex justify-center">
                  <Search className="h-12 w-12 text-gray-300" />
                </div>
                <h3 className="mt-4 text-lg font-medium">No jobs found</h3>
                <p className="mt-2 text-gray-500">Try changing your search filters or check back later.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="cards">
            {loading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
              </div>
            ) : filteredJobs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredJobs.map(job => (
                  <JobCard 
                    key={job.id} 
                    job={job} 
                    onApply={() => openConfirmDialog(job)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <div className="flex justify-center">
                  <Search className="h-12 w-12 text-gray-300" />
                </div>
                <h3 className="mt-4 text-lg font-medium">No jobs found</h3>
                <p className="mt-2 text-gray-500">Try changing your search filters or check back later.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Application</DialogTitle>
            <DialogDescription>
              Are you sure you want to apply for this position?
            </DialogDescription>
          </DialogHeader>
          
          {selectedJob && (
            <div className="py-4">
              <h3 className="font-semibold">{selectedJob.title}</h3>
              <p className="text-gray-600">{selectedJob.company_name} • {selectedJob.location}</p>
              <p className="mt-2 text-gray-700">Package: {selectedJob.package}</p>
              <p className="mt-1 text-sm text-gray-500">
                Application Deadline: {new Date(selectedJob.application_deadline).toLocaleDateString()}
              </p>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleApply} disabled={isApplying}>
              {isApplying ? 'Submitting...' : 'Submit Application'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={policyDialogOpen} onOpenChange={setPolicyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Policy Agreement Required</DialogTitle>
            <DialogDescription>
              You must agree to the placement policies before applying for jobs.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-gray-700">
              By clicking "I Agree" you confirm that you have read and agree to abide by the
              institution's placement policies.
            </p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setPolicyDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAgreeToPolicy}>
              I Agree
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </StudentLayout>
  );
};

export default Jobs;
