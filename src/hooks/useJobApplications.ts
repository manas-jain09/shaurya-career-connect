
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
    internshipPlusPpo: number;
  };
  hasSelectedApplication: boolean;
}

export const useJobApplications = (): JobApplicationData => {
  const { user } = useAuth();
  const { profile } = useStudentProfile();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hasSelectedApplication, setHasSelectedApplication] = useState<boolean>(false);
  const [counts, setCounts] = useState({
    total: 0,
    applied: 0,
    underReview: 0,
    shortlisted: 0,
    rejected: 0,
    selected: 0,
    internshipPlusPpo: 0
  });

  const fetchApplications = async () => {
    if (!profile) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
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
      
      // Check if student has a selected or internship+ppo application
      const hasSelected = typedApplications.some(app => 
        app.status === 'selected' || app.status === 'internship_plus_ppo'
      );
      setHasSelectedApplication(hasSelected);
      
      // Calculate counts
      if (typedApplications.length > 0) {
        const total = typedApplications.length;
        const applied = typedApplications.filter(app => app.status === 'applied').length;
        const underReview = typedApplications.filter(app => app.status === 'under_review').length;
        const shortlisted = typedApplications.filter(app => app.status === 'shortlisted').length;
        const rejected = typedApplications.filter(app => app.status === 'rejected').length;
        const selected = typedApplications.filter(app => app.status === 'selected').length;
        const internshipPlusPpo = typedApplications.filter(app => app.status === 'internship_plus_ppo').length;
        
        setCounts({
          total,
          applied,
          underReview,
          shortlisted,
          rejected,
          selected,
          internshipPlusPpo
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
  }, [profile]);

  return {
    applications,
    isLoading,
    error,
    refreshData: fetchApplications,
    counts,
    hasSelectedApplication
  };
};
