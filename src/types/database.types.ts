
export interface StudentProfile {
  id?: string;
  user_id: string;
  first_name: string;
  last_name: string;
  dob: string;
  gender: string;
  phone: string;
  address?: string;
  is_verified: boolean;
  verification_status: string;
  verification_notes?: string;
  flagged_sections?: string[];
  placement_interest?: string;
  agreed_to_policies?: boolean;
  is_blocked?: boolean;
  created_at?: string;
  updated_at?: string;
  department?: string;
  is_frozen?: boolean;
  is_eligible?: boolean;
  is_selected?: boolean;
}

export interface ClassXDetails {
  id?: string;
  student_id: string;
  school_name: string;
  board: string;
  marks: number;
  is_cgpa: boolean;
  cgpa_scale?: number;
  passing_year: number;
  marksheet_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ClassXIIDetails {
  id?: string;
  student_id: string;
  school_name: string;
  board: string;
  marks: number;
  is_cgpa: boolean;
  cgpa_scale?: number;
  passing_year: number;
  marksheet_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface GraduationDetails {
  id?: string;
  student_id: string;
  college_name: string;
  course: string;
  division?: string;
  marks: number;
  is_cgpa: boolean;
  cgpa_scale?: number;
  passing_year: number;
  has_backlog: boolean;
  marksheet_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Resume {
  id?: string;
  student_id: string;
  file_url: string;
  created_at?: string;
  updated_at?: string;
}

export type JobPostingStatus = 'active' | 'closed' | 'draft';

export interface JobPosting {
  id?: string;
  title: string;
  company_name: string;
  description: string;
  location: string;
  package: string;
  application_deadline: string;
  min_class_x_marks?: number | null;
  min_class_xii_marks?: number | null;
  min_graduation_marks?: number | null;
  min_class_x_cgpa?: number | null;
  min_class_xii_cgpa?: number | null;
  min_graduation_cgpa?: number | null;
  cgpa_scale?: number | null;
  eligible_courses?: string[] | null;
  eligible_passing_years?: number[] | null;
  allow_backlog: boolean;
  status: JobPostingStatus;
  created_at?: string;
  updated_at?: string;
  application_count?: number;
  selected_count?: number;
  company_code?: string;
  company_id?: string;
}

export type JobApplicationStatus = 'applied' | 'under_review' | 'shortlisted' | 'rejected' | 'selected' | 'internship' | 'ppo' | 'placement';

export interface JobApplication {
  id?: string;
  job_id: string;
  student_id: string;
  status: JobApplicationStatus;
  admin_notes?: string;
  created_at?: string;
  updated_at?: string;
  job?: {
    title: string;
    company_name: string;
    location: string;
    package: string;
  };
  student_profile?: {
    first_name: string;
    last_name: string;
    phone: string;
    is_verified: boolean;
    department?: string;
  };
  graduation_details?: {
    course?: string;
    passing_year?: number;
    college_name?: string;
  };
}

export interface Notification {
  id?: string;
  user_id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at?: string;
}
