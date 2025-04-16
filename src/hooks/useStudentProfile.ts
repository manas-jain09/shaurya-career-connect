
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { StudentProfile, ClassXDetails, ClassXIIDetails, GraduationDetails, Resume } from '@/types/database.types';
import { useAuth } from '@/contexts/AuthContext';
import { isFinalStatus } from '@/utils/statusHelpers';

interface StudentProfileData {
  profile: StudentProfile | null;
  classX: ClassXDetails | null;
  classXII: ClassXIIDetails | null;
  graduation: GraduationDetails | null;
  resume: Resume | null;
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  isEligibleForJobs: boolean;
  isProfileLocked: boolean;
  acceptedJobInfo: { company?: string; position?: string; status?: string } | null;
}

export const useStudentProfile = (profileId?: string): StudentProfileData => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [classX, setClassX] = useState<ClassXDetails | null>(null);
  const [classXII, setClassXII] = useState<ClassXIIDetails | null>(null);
  const [graduation, setGraduation] = useState<GraduationDetails | null>(null);
  const [resume, setResume] = useState<Resume | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isEligibleForJobs, setIsEligibleForJobs] = useState<boolean>(false);
  const [isProfileLocked, setIsProfileLocked] = useState<boolean>(false);
  const [acceptedJobInfo, setAcceptedJobInfo] = useState<{ company?: string; position?: string; status?: string } | null>(null);

  // Use the provided profileId or get it from the user
  const studentProfileId = profileId || user?.profileId;

  const fetchProfileData = async () => {
    if (!studentProfileId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('student_profiles')
        .select('*')
        .eq('id', studentProfileId)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Check if student has a job offer accepted (selected, internship, ppo, or placement status)
      const { data: jobApplications, error: appError } = await supabase
        .from('job_applications')
        .select(`
          status,
          job:job_id(title, company_name)
        `)
        .eq('student_id', studentProfileId)
        .filter('status', 'in', '(selected,internship,ppo,placement)');

      if (!appError && jobApplications && jobApplications.length > 0) {
        // Student has an accepted job offer - their profile should be locked
        setIsProfileLocked(true);
        
        const acceptedJob = jobApplications[0];
        setAcceptedJobInfo({
          company: acceptedJob.job?.company_name,
          position: acceptedJob.job?.title,
          status: acceptedJob.status
        });
      } else {
        setIsProfileLocked(false);
        setAcceptedJobInfo(null);
      }

      // Determine job eligibility based on verification status and placement interest
      // The student is eligible for jobs if they are verified AND they have chosen placement/internship
      // AND they don't already have an accepted job offer
      const isVerified = profileData.is_verified || false;
      const placementInterest = profileData.placement_interest || '';
      
      const isEligible = isVerified && 
                        placementInterest === 'placement/internship' && 
                        !isProfileLocked;
                        
      setIsEligibleForJobs(isEligible);
      
      console.log('Eligibility check:', { isVerified, placementInterest, isProfileLocked, isEligible });

      // Fetch Class X details
      const { data: classXData, error: classXError } = await supabase
        .from('class_x_details')
        .select('*')
        .eq('student_id', studentProfileId)
        .single();

      if (!classXError) setClassX(classXData);

      // Fetch Class XII details
      const { data: classXIIData, error: classXIIError } = await supabase
        .from('class_xii_details')
        .select('*')
        .eq('student_id', studentProfileId)
        .single();

      if (!classXIIError) setClassXII(classXIIData);

      // Fetch Graduation details with explicit error handling
      const { data: graduationData, error: graduationError } = await supabase
        .from('graduation_details')
        .select('*')
        .eq('student_id', studentProfileId)
        .single();

      if (!graduationError) {
        setGraduation(graduationData);
      } else {
        console.log('No graduation details found or error:', graduationError);
        setGraduation(null);
      }

      // Fetch Resume
      const { data: resumeData, error: resumeError } = await supabase
        .from('resumes')
        .select('*')
        .eq('student_id', studentProfileId)
        .single();

      if (!resumeError) setResume(resumeData);
    } catch (err) {
      console.error('Error fetching profile data:', err);
      setError('Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [studentProfileId]);

  return {
    profile,
    classX,
    classXII,
    graduation,
    resume,
    isLoading,
    error,
    refreshData: fetchProfileData,
    isEligibleForJobs,
    isProfileLocked,
    acceptedJobInfo
  };
};
