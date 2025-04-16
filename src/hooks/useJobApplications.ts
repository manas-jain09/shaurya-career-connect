
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { JobApplication, JobApplicationStatus } from '@/types/database.types';
import { useAuth } from '@/contexts/AuthContext';
import { useStudentProfile } from './useStudentProfile';

interface JobApplicationData {
  applications: JobApplication[];
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  counts: {
    total: number;
    applied: number;
    underReview: number;
    shortlisted: number;
    rejected: number;
    selected: number;
  };
  canApply: boolean;
}

export const useJobApplications = (): JobApplicationData => {
  const { user } = useAuth();
  const { profile, isEligibleForJobs } = useStudentProfile();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [counts, setCounts] = useState({
    total: 0,
    applied: 0,
    underReview: 0,
    shortlisted: 0,
    rejected: 0,
    selected: 0
  });
  const [canApply, setCanApply] = useState(false);

  const fetchApplications = async () => {
    if (!profile) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Set canApply based on profile eligibility
      setCanApply(isEligibleForJobs);
      
      // Fetch applications with job details
      const { data, error: fetchError } = await supabase
        .from('job_applications')
        .select(`
          *,
          job:job_id (
            title,
            company_name,
            location,
            package
          )
        `)
        .eq('student_id', profile.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      
      // Process and type-cast the data
      const typedApplications: JobApplication[] = data?.map(app => ({
        ...app,
        status: app.status as JobApplicationStatus,
        job: app.job
      })) || [];
      
      setApplications(typedApplications);
      
      // Calculate counts
      if (typedApplications.length > 0) {
        const total = typedApplications.length;
        const applied = typedApplications.filter(app => app.status === 'applied').length;
        const underReview = typedApplications.filter(app => app.status === 'under_review').length;
        const shortlisted = typedApplications.filter(app => app.status === 'shortlisted').length;
        const rejected = typedApplications.filter(app => app.status === 'rejected').length;
        const selected = typedApplications.filter(app => app.status === 'selected').length;
        
        setCounts({
          total,
          applied,
          underReview,
          shortlisted,
          rejected,
          selected
        });
      }
    } catch (err) {
      console.error('Error fetching job applications:', err);
      setError('Failed to load job applications');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (profile) {
      fetchApplications();
    }
  }, [profile, isEligibleForJobs]);

  return {
    applications,
    isLoading,
    error,
    refreshData: fetchApplications,
    counts,
    canApply
  };
};
