
import { JobPosting } from '@/types/database.types';
import { supabase } from '@/integrations/supabase/client';

/**
 * Checks if a student is eligible for a job based on their education details and job requirements
 */
export const checkJobEligibility = async (
  studentId: string, 
  job: JobPosting
): Promise<{ isEligible: boolean; reasons: string[] }> => {
  try {
    const reasons: string[] = [];

    // Fetch education details
    const { data: classX } = await supabase
      .from('class_x_details')
      .select('*')
      .eq('student_id', studentId)
      .single();

    const { data: classXII } = await supabase
      .from('class_xii_details')
      .select('*')
      .eq('student_id', studentId)
      .single();

    const { data: graduation } = await supabase
      .from('graduation_details')
      .select('*')
      .eq('student_id', studentId)
      .single();

    // Check Class X marks
    if (job.min_class_x_marks && classX && classX.marks < job.min_class_x_marks) {
      reasons.push(`Class X marks (${classX.marks}%) below required ${job.min_class_x_marks}%`);
    }

    // Check Class XII marks
    if (job.min_class_xii_marks && classXII && classXII.marks < job.min_class_xii_marks) {
      reasons.push(`Class XII marks (${classXII.marks}%) below required ${job.min_class_xii_marks}%`);
    }

    // Check Graduation marks
    if (job.min_graduation_marks && graduation && graduation.marks < job.min_graduation_marks) {
      reasons.push(`Graduation marks (${graduation.marks}%) below required ${job.min_graduation_marks}%`);
    }

    // Check CGPA if that's what the job requires
    if (job.min_class_x_cgpa && classX && classX.is_cgpa && classX.marks < job.min_class_x_cgpa) {
      reasons.push(`Class X CGPA (${classX.marks}) below required ${job.min_class_x_cgpa}`);
    }

    if (job.min_class_xii_cgpa && classXII && classXII.is_cgpa && classXII.marks < job.min_class_xii_cgpa) {
      reasons.push(`Class XII CGPA (${classXII.marks}) below required ${job.min_class_xii_cgpa}`);
    }

    if (job.min_graduation_cgpa && graduation && graduation.is_cgpa && graduation.marks < job.min_graduation_cgpa) {
      reasons.push(`Graduation CGPA (${graduation.marks}) below required ${job.min_graduation_cgpa}`);
    }

    // Check backlog status
    if (job.allow_backlog === false && graduation && graduation.has_backlog === true) {
      reasons.push('Backlog not allowed for this job');
    }

    // Check eligible courses
    if (
      job.eligible_courses && 
      job.eligible_courses.length > 0 && 
      graduation && 
      !job.eligible_courses.includes(graduation.course)
    ) {
      reasons.push(`Your course (${graduation.course}) is not among eligible courses`);
    }

    // Check eligible passing years
    if (
      job.eligible_passing_years && 
      job.eligible_passing_years.length >.0 && 
      graduation && 
      !job.eligible_passing_years.includes(graduation.passing_year)
    ) {
      reasons.push(`Your passing year (${graduation.passing_year}) is not among eligible years`);
    }

    return {
      isEligible: reasons.length === 0,
      reasons
    };
  } catch (error) {
    console.error('Error checking job eligibility:', error);
    return {
      isEligible: false,
      reasons: ['Error checking eligibility']
    };
  }
};

// Utility to create notification for job eligibility
export const notifyEligibleJob = async (userId: string, studentId: string, job: JobPosting) => {
  try {
    const { isEligible } = await checkJobEligibility(studentId, job);
    
    if (isEligible) {
      // Create a notification for this eligible job
      await supabase.from('notifications').insert({
        user_id: userId,
        title: 'New Job Opportunity',
        message: `A new job matching your profile has been posted: ${job.title} at ${job.company_name}`,
        is_read: false
      });
      
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error creating job notification:', error);
    return false;
  }
};
