
import React, { useState, useEffect } from 'react';
import StudentLayout from '@/components/layouts/StudentLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Search, AlertCircle, Lock, CheckCircle2 } from 'lucide-react';
import JobCard from '@/components/student/JobCard';
import { JobPosting } from '@/types/database.types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useStudentProfile } from '@/hooks/useStudentProfile';
import { useJobApplications } from '@/hooks/useJobApplications';
import { checkJobEligibility } from '@/utils/eligibilityChecks';

const Jobs = () => {
  const { user } = useAuth();
  const { profile, isEligibleForJobs } = useStudentProfile();
  const { applications, refreshData: refreshApplications } = useJobApplications();
  
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<JobPosting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Track job eligibility
  const [jobEligibility, setJobEligibility] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    if (profile) {
      fetchJobs();
    }
  }, [profile]);

  const fetchJobs = async () => {
    if (!profile) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('job_postings')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const jobsData = data as JobPosting[];
      setJobs(jobsData);
      setFilteredJobs(jobsData);
      
      // Check eligibility for each job
      const eligibilityMap: {[key: string]: boolean} = {};
      
      for (const job of jobsData) {
        const { isEligible } = await checkJobEligibility(profile.id as string, job);
        console.log(`Job ${job.title} eligibility:`, isEligible);
        eligibilityMap[job.id as string] = isEligible;
      }
      
      setJobEligibility(eligibilityMap);
    } catch (err) {
      console.error('Error fetching jobs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Filter jobs based on search term
    if (!searchTerm.trim()) {
      setFilteredJobs(jobs);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredJobs(
        jobs.filter(
          job =>
            job.title.toLowerCase().includes(term) ||
            job.company_name.toLowerCase().includes(term) ||
            job.location.toLowerCase().includes(term) ||
            job.description.toLowerCase().includes(term)
        )
      );
    }
  }, [searchTerm, jobs]);

  const isJobApplied = (jobId: string | undefined) => {
    if (!jobId) return false;
    return applications.some(app => app.job_id === jobId);
  };

  const handleApplySuccess = () => {
    refreshApplications();
  };

  // Check if the profile is not verified or doesn't have placement interest
  const isProfileNotVerified = profile ? !profile.is_verified : true;
  const hasNoPlacementInterest = profile ? profile.placement_interest !== 'placement/internship' : true;
  const hasFlaggedSections = profile?.flagged_sections && profile.flagged_sections.length > 0;
  const isBlocked = profile?.is_blocked || false;
  const isFrozen = profile?.is_frozen || false;

  if (isProfileNotVerified || hasNoPlacementInterest) {
    return (
      <StudentLayout>
        <div className="py-8">
          <Card>
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <AlertCircle className="h-12 w-12 text-amber-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-700">
                {isProfileNotVerified 
                  ? "Your profile is not verified yet" 
                  : "You haven't opted for placements"}
              </h3>
              <p className="text-gray-500 mt-2 max-w-md">
                {isProfileNotVerified 
                  ? "Your profile needs to be verified by the placement cell before you can view job opportunities. Please complete your profile and wait for verification." 
                  : "You need to opt for placements in your profile settings to view job opportunities."}
              </p>
              <Button 
                className="mt-4" 
                onClick={() => window.location.href = '/student/profile'}
              >
                Go to Profile
              </Button>
            </CardContent>
          </Card>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Job Opportunities</h1>
          <p className="text-gray-600">Explore and apply for available job opportunities</p>
        </div>
        
        {isBlocked && (
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-4 flex items-center space-x-3">
              <Lock className="h-5 w-5 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-700">Your account is blocked</h3>
                <p className="text-sm text-red-600">
                  Your account has been blocked by the administrator. You cannot apply for jobs until this restriction is lifted.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
        
        {isFrozen && !isBlocked && (
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="p-4 flex items-center space-x-3">
              <CheckCircle2 className="h-5 w-5 text-amber-600" />
              <div>
                <h3 className="font-semibold text-amber-700">Your profile is frozen</h3>
                <p className="text-sm text-amber-600">
                  You have been selected for a position. Your profile is now frozen and you cannot apply for more jobs.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
        
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            className="pl-10"
            placeholder="Search by job title, company, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-shaurya-primary border-t-transparent rounded-full"></div>
          </div>
        ) : filteredJobs.length === 0 ? (
          <Card>
            <CardContent className="p-6 flex flex-col items-center justify-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-700">No Jobs Found</h3>
              <p className="text-gray-500 text-center mt-2">
                {searchTerm
                  ? "No jobs match your search criteria. Try different keywords."
                  : "There are no active job postings at this time. Check back later."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                isApplied={isJobApplied(job.id)}
                isProfileVerified={!isProfileNotVerified}
                isFlaggedProfile={hasFlaggedSections || isBlocked || isFrozen}
                onApply={handleApplySuccess}
                isEligible={!isBlocked && !isFrozen && (jobEligibility[job.id as string] || false)}
              />
            ))}
          </div>
        )}
      </div>
    </StudentLayout>
  );
};

export default Jobs;
