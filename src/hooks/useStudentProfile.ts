
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { StudentProfile, ClassXDetails, ClassXIIDetails, GraduationDetails, Resume } from '@/types/database.types';
import { useAuth } from '@/contexts/AuthContext';

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
  is_frozen: boolean;
  flaggedSections: string[];
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
  const [is_frozen, setIs_frozen] = useState<boolean>(false);
  const [flaggedSections, setFlaggedSections] = useState<string[]>([]);

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

      // Set frozen status from profile data
      const isFrozen = profileData.is_frozen || false;
      setIs_frozen(isFrozen);
      
      // Use the is_eligible field from the database
      setIsEligibleForJobs(profileData.is_eligible !== null ? profileData.is_eligible : true);
      
      // Set flagged sections if available
      setFlaggedSections(profileData.flagged_sections || []);
      
      console.log('Profile data:', profileData);

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
    is_frozen,
    flaggedSections
  };
};
