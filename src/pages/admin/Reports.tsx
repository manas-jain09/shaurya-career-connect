
import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  Download, 
  Users, 
  Briefcase, 
  FileSpreadsheet,
  Filter,
  Search,
  CalendarIcon,
  ArrowUpDown,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { format } from 'date-fns';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { CSVLink } from 'react-csv';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { JobApplication, JobApplicationStatus, StudentProfile, JobPosting } from '@/types/database.types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Slider } from '@/components/ui/slider';

const Reports = () => {
  const [activeTab, setActiveTab] = useState('students');
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  
  // Shared filter data
  const [courses, setCourses] = useState<string[]>([]);
  const [passingYears, setPassingYears] = useState<number[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  
  // Students data
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentProfile[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentVerificationFilter, setStudentVerificationFilter] = useState('all');
  const [studentCourseFilter, setStudentCourseFilter] = useState<string[]>([]);
  const [studentPassingYearFilter, setStudentPassingYearFilter] = useState<string[]>([]);
  const [studentDepartmentFilter, setStudentDepartmentFilter] = useState<string[]>([]);
  const [studentSelectionFilter, setStudentSelectionFilter] = useState('all');
  const [studentSortField, setStudentSortField] = useState<string>('name');
  const [studentSortDirection, setStudentSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Applications data
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<JobApplication[]>([]);
  const [applicationSearch, setApplicationSearch] = useState('');
  const [applicationStatusFilter, setApplicationStatusFilter] = useState<string[]>([]);
  const [applicationDateFilter, setApplicationDateFilter] = useState<Date | undefined>(undefined);
  const [applicationCourseFilter, setApplicationCourseFilter] = useState<string[]>([]);
  const [applicationPassingYearFilter, setApplicationPassingYearFilter] = useState<string[]>([]);
  const [applicationDepartmentFilter, setApplicationDepartmentFilter] = useState<string[]>([]);
  const [minPackage, setMinPackage] = useState<number>(0);
  const [maxPackage, setMaxPackage] = useState<number>(100);
  const [packageRange, setPackageRange] = useState<[number, number]>([0, 100]);
  const [applicationSortField, setApplicationSortField] = useState<string>('date');
  const [applicationSortDirection, setApplicationSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Jobs data
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<JobPosting[]>([]);
  const [jobSearch, setJobSearch] = useState('');
  const [jobStatusFilter, setJobStatusFilter] = useState<string[]>([]);
  const [jobDeadlineFilter, setJobDeadlineFilter] = useState<Date | undefined>(undefined);
  const [jobLocationFilter, setJobLocationFilter] = useState<string[]>([]);
  const [selectedStudentsFilter, setSelectedStudentsFilter] = useState<[number, number]>([0, 100]);
  const [maxSelectedStudents, setMaxSelectedStudents] = useState(100);
  const [jobSortField, setJobSortField] = useState<string>('title');
  const [jobSortDirection, setJobSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    if (activeTab === 'students') {
      fetchStudentsData();
    } else if (activeTab === 'applications') {
      fetchApplicationsData();
    } else if (activeTab === 'jobs') {
      fetchJobsData();
    }
  }, [activeTab]);

  const fetchStudentsData = async () => {
    setLoading(true);
    try {
      // First, fetch all student profiles
      const { data: studentsData, error: studentsError } = await supabase
        .from('student_profiles')
        .select('*');

      if (studentsError) throw studentsError;

      // Then fetch graduation details separately
      const { data: gradData, error: gradError } = await supabase
        .from('graduation_details')
        .select('*');

      if (gradError) throw gradError;

      // Fetch all job applications to check selection status
      const { data: applicationsData, error: applicationsError } = await supabase
        .from('job_applications')
        .select('*')
        .in('status', ['selected', 'internship', 'ppo']);

      if (applicationsError) throw applicationsError;

      // Map graduation data to student profiles
      const studentsWithGraduation = studentsData.map(student => {
        const gradDetails = gradData.find(g => g.student_id === student.id) || null;
        // Check if student is selected in any job
        const isSelected = applicationsData.some(app => app.student_id === student.id);
        
        return {
          ...student,
          graduation: gradDetails,
          is_selected: isSelected
        };
      });

      // Get unique courses, passing years, and departments for filters
      const allCourses = new Set<string>();
      const allPassingYears = new Set<number>();
      const allDepartments = new Set<string>();
      
      gradData.forEach(grad => {
        if (grad.course) {
          allCourses.add(grad.course);
        }
        if (grad.passing_year) {
          allPassingYears.add(grad.passing_year);
        }
      });
      
      studentsData.forEach(student => {
        if (student.department) {
          allDepartments.add(student.department);
        }
      });
      
      setCourses(Array.from(allCourses).sort());
      setPassingYears(Array.from(allPassingYears).sort());
      setDepartments(Array.from(allDepartments).sort());
      
      setStudents(studentsWithGraduation as StudentProfile[]);
      setFilteredStudents(studentsWithGraduation as StudentProfile[]);
    } catch (error) {
      console.error('Error fetching students data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load students data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchApplicationsData = async () => {
    setLoading(true);
    try {
      const { data: applicationsData, error: applicationsError } = await supabase
        .from('job_applications')
        .select(`
          *,
          job:job_id(title, company_name, location, package),
          student_profile:student_id(first_name, last_name, phone, is_verified, department)
        `)
        .order('created_at', { ascending: false });
      
      if (applicationsError) throw applicationsError;
      
      // Fetch graduation details for all students
      const { data: gradData, error: gradError } = await supabase
        .from('graduation_details')
        .select('*');
      
      if (gradError) throw gradError;
      
      // Combine application data with graduation details
      const applicationsWithGraduation = applicationsData.map(app => {
        const gradDetails = gradData.find(g => g.student_id === app.student_id) || null;
        return {
          ...app,
          graduation_details: gradDetails
        };
      });
      
      // Extract unique courses, passing years, and departments
      const allCourses = new Set<string>();
      const allPassingYears = new Set<number>();
      const allDepartments = new Set<string>();
      
      applicationsWithGraduation.forEach(app => {
        if (app.graduation_details?.course) {
          allCourses.add(app.graduation_details.course);
        }
        if (app.graduation_details?.passing_year) {
          allPassingYears.add(app.graduation_details.passing_year);
        }
        if (app.student_profile?.department) {
          allDepartments.add(app.student_profile.department);
        }
      });
      
      // Find min and max package values
      let minPackageValue = Infinity;
      let maxPackageValue = 0;
      
      applicationsWithGraduation.forEach(app => {
        if (app.job?.package) {
          // Add null check for package value
          const packageStr = app.job.package;
          const packageValue = parseFloat(packageStr.replace(/[^\d.]/g, '')) || 0;
          if (packageValue < minPackageValue) minPackageValue = packageValue;
          if (packageValue > maxPackageValue) maxPackageValue = packageValue;
        }
      });
      
      setMinPackage(Math.floor(minPackageValue) || 0);
      setMaxPackage(Math.ceil(maxPackageValue) || 100);
      setPackageRange([Math.floor(minPackageValue) || 0, Math.ceil(maxPackageValue) || 100]);
      
      setCourses(Array.from(allCourses).sort());
      setPassingYears(Array.from(allPassingYears).sort());
      setDepartments(Array.from(allDepartments).sort());
      
      setApplications(applicationsWithGraduation as JobApplication[]);
      setFilteredApplications(applicationsWithGraduation as JobApplication[]);
    } catch (error) {
      console.error('Error fetching applications data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load applications data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchJobsData = async () => {
    setLoading(true);
    try {
      const { data: jobsData, error: jobsError } = await supabase
        .from('job_postings')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (jobsError) throw jobsError;
      
      // Fetch application counts and selected students counts for each job
      const jobsWithCounts = await Promise.all(
        (jobsData || []).map(async (job) => {
          const { count: totalCount, error: countError } = await supabase
            .from('job_applications')
            .select('*', { count: 'exact', head: true })
            .eq('job_id', job.id);
          
          const { count: selectedCount, error: selectedError } = await supabase
            .from('job_applications')
            .select('*', { count: 'exact', head: true })
            .eq('job_id', job.id)
            .in('status', ['selected', 'internship', 'ppo']);
          
          return {
            ...job,
            application_count: totalCount || 0,
            selected_count: selectedCount || 0
          };
        })
      );
      
      // Extract unique locations and max selected students
      const allLocations = new Set<string>();
      let maxSelected = 0;
      
      jobsWithCounts.forEach(job => {
        if (job.location) {
          allLocations.add(job.location);
        }
        if (job.selected_count && job.selected_count > maxSelected) {
          maxSelected = job.selected_count;
        }
      });
      
      setLocations(Array.from(allLocations).sort());
      setMaxSelectedStudents(maxSelected > 0 ? maxSelected : 100);
      setSelectedStudentsFilter([0, maxSelected > 0 ? maxSelected : 100]);
      
      setJobs(jobsWithCounts as JobPosting[]);
      setFilteredJobs(jobsWithCounts as JobPosting[]);
    } catch (error) {
      console.error('Error fetching jobs data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load jobs data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Sort function for students
  const sortStudents = (data: any[]) => {
    return [...data].sort((a, b) => {
      let valueA, valueB;
      
      switch (studentSortField) {
        case 'name':
          valueA = `${a.first_name || ''} ${a.last_name || ''}`.toLowerCase();
          valueB = `${b.first_name || ''} ${b.last_name || ''}`.toLowerCase();
          break;
        case 'college':
          valueA = (a.graduation?.college_name || '').toLowerCase();
          valueB = (b.graduation?.college_name || '').toLowerCase();
          break;
        case 'course':
          valueA = (a.graduation?.course || '').toLowerCase();
          valueB = (b.graduation?.course || '').toLowerCase();
          break;
        case 'passing_year':
          valueA = a.graduation?.passing_year || 0;
          valueB = b.graduation?.passing_year || 0;
          break;
        case 'status':
          valueA = a.is_verified ? 1 : 0;
          valueB = b.is_verified ? 1 : 0;
          break;
        default:
          valueA = a[studentSortField] || '';
          valueB = b[studentSortField] || '';
      }
      
      if (studentSortDirection === 'asc') {
        return valueA > valueB ? 1 : -1;
      } else {
        return valueA < valueB ? 1 : -1;
      }
    });
  };

  // Sort function for applications
  const sortApplications = (data: JobApplication[]) => {
    return [...data].sort((a, b) => {
      let valueA, valueB;
      
      switch (applicationSortField) {
        case 'student':
          valueA = `${a.student_profile?.first_name || ''} ${a.student_profile?.last_name || ''}`.toLowerCase();
          valueB = `${b.student_profile?.first_name || ''} ${b.student_profile?.last_name || ''}`.toLowerCase();
          break;
        case 'job':
          valueA = (a.job?.title || '').toLowerCase();
          valueB = (b.job?.title || '').toLowerCase();
          break;
        case 'company':
          valueA = (a.job?.company_name || '').toLowerCase();
          valueB = (b.job?.company_name || '').toLowerCase();
          break;
        case 'date':
          valueA = new Date(a.created_at || '').getTime();
          valueB = new Date(b.created_at || '').getTime();
          break;
        case 'status':
          valueA = a.status;
          valueB = b.status;
          break;
        case 'package':
          // Add null check for package value
          const packageA = a.job?.package || '0';
          const packageB = b.job?.package || '0';
          valueA = parseFloat(packageA.replace(/[^\d.]/g, '')) || 0;
          valueB = parseFloat(packageB.replace(/[^\d.]/g, '')) || 0;
          break;
        default:
          valueA = a[applicationSortField as keyof JobApplication] || '';
          valueB = b[applicationSortField as keyof JobApplication] || '';
      }
      
      if (applicationSortDirection === 'asc') {
        return valueA > valueB ? 1 : -1;
      } else {
        return valueA < valueB ? 1 : -1;
      }
    });
  };

  // Sort function for jobs
  const sortJobs = (data: JobPosting[]) => {
    return [...data].sort((a, b) => {
      let valueA, valueB;
      
      switch (jobSortField) {
        case 'title':
          valueA = (a.title || '').toLowerCase();
          valueB = (b.title || '').toLowerCase();
          break;
        case 'company':
          valueA = (a.company_name || '').toLowerCase();
          valueB = (b.company_name || '').toLowerCase();
          break;
        case 'location':
          valueA = (a.location || '').toLowerCase();
          valueB = (b.location || '').toLowerCase();
          break;
        case 'package':
          // Add null check for package value
          const packageA = a.package || '0';
          const packageB = b.package || '0';
          valueA = parseFloat(packageA.replace(/[^\d.]/g, '')) || 0;
          valueB = parseFloat(packageB.replace(/[^\d.]/g, '')) || 0;
          break;
        case 'applications':
          valueA = a.application_count || 0;
          valueB = b.application_count || 0;
          break;
        case 'selected':
          valueA = a.selected_count || 0;
          valueB = b.selected_count || 0;
          break;
        case 'deadline':
          valueA = new Date(a.application_deadline || '').getTime();
          valueB = new Date(b.application_deadline || '').getTime();
          break;
        case 'status':
          valueA = a.status;
          valueB = b.status;
          break;
        default:
          valueA = a[jobSortField as keyof JobPosting] || '';
          valueB = b[jobSortField as keyof JobPosting] || '';
      }
      
      if (jobSortDirection === 'asc') {
        return valueA > valueB ? 1 : -1;
      } else {
        return valueA < valueB ? 1 : -1;
      }
    });
  };

  // Apply students filters
  useEffect(() => {
    let filtered = students;
    
    // Filter by search term
    if (studentSearch) {
      const term = studentSearch.toLowerCase();
      filtered = filtered.filter(student => 
        (student.first_name || '').toLowerCase().includes(term) ||
        (student.last_name || '').toLowerCase().includes(term) ||
        (student.phone || '').toLowerCase().includes(term) ||
        ((student as any).graduation?.college_name || '').toLowerCase().includes(term)
      );
    }
    
    // Filter by verification status
    if (studentVerificationFilter !== 'all') {
      filtered = filtered.filter(student => {
        if (studentVerificationFilter === 'verified') {
          return student.is_verified === true;
        } else if (studentVerificationFilter === 'pending') {
          return student.is_verified === false && student.verification_status === 'pending';
        } else if (studentVerificationFilter === 'flagged') {
          return student.is_verified === false && student.flagged_sections && student.flagged_sections.length > 0;
        } else if (studentVerificationFilter === 'blocked') {
          return student.is_blocked === true;
        }
        return true;
      });
    }
    
    // Filter by course
    if (studentCourseFilter.length > 0) {
      filtered = filtered.filter(student => 
        (student as any).graduation?.course && studentCourseFilter.includes((student as any).graduation.course)
      );
    }
    
    // Filter by passing year
    if (studentPassingYearFilter.length > 0) {
      filtered = filtered.filter(student => 
        (student as any).graduation?.passing_year && 
        studentPassingYearFilter.includes((student as any).graduation.passing_year.toString())
      );
    }
    
    // Filter by department
    if (studentDepartmentFilter.length > 0) {
      filtered = filtered.filter(student => 
        student.department && studentDepartmentFilter.includes(student.department)
      );
    }
    
    // Filter by selection status
    if (studentSelectionFilter !== 'all') {
      filtered = filtered.filter(student => {
        if (studentSelectionFilter === 'selected') {
          return (student as any).is_selected === true;
        } else if (studentSelectionFilter === 'not_selected') {
          return (student as any).is_selected !== true;
        }
        return true;
      });
    }
    
    // Apply sorting
    const sortedData = sortStudents(filtered);
    
    setFilteredStudents(sortedData);
  }, [
    studentSearch, 
    studentVerificationFilter, 
    studentCourseFilter, 
    studentPassingYearFilter, 
    studentDepartmentFilter,
    studentSelectionFilter,
    studentSortField,
    studentSortDirection,
    students
  ]);

  // Apply applications filters
  useEffect(() => {
    let filtered = applications;
    
    // Filter by search term
    if (applicationSearch) {
      const term = applicationSearch.toLowerCase();
      filtered = filtered.filter(app => 
        (app.student_profile?.first_name || '').toLowerCase().includes(term) ||
        (app.student_profile?.last_name || '').toLowerCase().includes(term) ||
        (app.job?.title || '').toLowerCase().includes(term) ||
        (app.job?.company_name || '').toLowerCase().includes(term)
      );
    }
    
    // Filter by status
    if (applicationStatusFilter.length > 0) {
      filtered = filtered.filter(app => applicationStatusFilter.includes(app.status));
    }
    
    // Filter by date
    if (applicationDateFilter) {
      const filterDate = new Date(applicationDateFilter);
      // Set to start of day
      filterDate.setHours(0, 0, 0, 0);
      
      filtered = filtered.filter(app => {
        if (!app.created_at) return false;
        const appDate = new Date(app.created_at);
        // Set to start of day for comparison
        appDate.setHours(0, 0, 0, 0);
        return appDate.getTime() === filterDate.getTime();
      });
    }
    
    // Filter by course
    if (applicationCourseFilter.length > 0) {
      filtered = filtered.filter(app => 
        app.graduation_details?.course && 
        applicationCourseFilter.includes(app.graduation_details.course)
      );
    }
    
    // Filter by passing year
    if (applicationPassingYearFilter.length > 0) {
      filtered = filtered.filter(app => 
        app.graduation_details?.passing_year && 
        applicationPassingYearFilter.includes(app.graduation_details.passing_year.toString())
      );
    }
    
    // Filter by department
    if (applicationDepartmentFilter.length > 0) {
      filtered = filtered.filter(app => 
        app.student_profile?.department && 
        applicationDepartmentFilter.includes(app.student_profile.department)
      );
    }
    
    // Filter by package range with null check
    filtered = filtered.filter(app => {
      if (!app.job?.package) return true; // Include if no package specified
      // Add null check for package value
      const packageStr = app.job.package;
      const packageValue = parseFloat(packageStr.replace(/[^\d.]/g, '')) || 0;
      return packageValue >= packageRange[0] && packageValue <= packageRange[1];
    });
    
    // Apply sorting
    const sortedData = sortApplications(filtered);
    
    setFilteredApplications(sortedData);
  }, [
    applicationSearch, 
    applicationStatusFilter, 
    applicationDateFilter, 
    applicationCourseFilter,
    applicationPassingYearFilter,
    applicationDepartmentFilter,
    packageRange,
    applicationSortField,
    applicationSortDirection,
    applications
  ]);

  // Apply jobs filters
  useEffect(() => {
    let filtered = jobs;
    
    // Filter by search term
    if (jobSearch) {
      const term = jobSearch.toLowerCase();
      filtered = filtered.filter(job => 
        (job.title || '').toLowerCase().includes(term) ||
        (job.company_name || '').toLowerCase().includes(term) ||
        (job.location || '').toLowerCase().includes(term)
      );
    }
    
    // Filter by status
    if (jobStatusFilter.length > 0) {
      filtered = filtered.filter(job => jobStatusFilter.includes(job.status));
    }
    
    // Filter by deadline
    if (jobDeadlineFilter) {
      const filterDate = new Date(jobDeadlineFilter);
      // Set to start of day
      filterDate.setHours(0, 0, 0, 0);
      
      filtered = filtered.filter(job => {
        if (!job.application_deadline) return false;
        const deadlineDate = new Date(job.application_deadline);
        // Set to start of day for comparison
        deadlineDate.setHours(0, 0, 0, 0);
        return deadlineDate.getTime() === filterDate.getTime();
      });
    }
    
    // Filter by location
    if (jobLocationFilter.length > 0) {
      filtered = filtered.filter(job => 
        job.location && jobLocationFilter.includes(job.location)
      );
    }
    
    // Filter by selected students range
    filtered = filtered.filter(job => {
      const selectedCount = job.selected_count || 0;
      return selectedCount >= selectedStudentsFilter[0] && selectedCount <= selectedStudentsFilter[1];
    });
    
    // Apply sorting
    const sortedData = sortJobs(filtered);
    
    setFilteredJobs(sortedData);
  }, [
    jobSearch, 
    jobStatusFilter, 
    jobDeadlineFilter, 
    jobLocationFilter,
    selectedStudentsFilter,
    jobSortField,
    jobSortDirection,
    jobs
  ]);

  // Helper function to render sort button
  const renderSortButton = (field: string, label: string, currentField: string, setField: (field: string) => void, currentDirection: 'asc' | 'desc', setDirection: (direction: 'asc' | 'desc') => void) => (
    <Button
      variant="ghost"
      size="sm"
      className="flex items-center gap-1"
      onClick={() => {
        if (currentField === field) {
          setDirection(currentDirection === 'asc' ? 'desc' : 'asc');
        } else {
          setField(field);
          setDirection('asc');
        }
      }}
    >
      {label}
      {currentField === field ? (
        currentDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
      ) : (
        <ArrowUpDown className="h-4 w-4" />
      )}
    </Button>
  );

  // Helper function to render multi-select dropdown
  const renderMultiSelect = (
    label: string, 
    options: string[] | number[], 
    selectedValues: string[], 
    setSelectedValues: (values: string[]) => void
  ) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full md:w-[180px] justify-between">
          <span className="truncate">{label}</span>
          {selectedValues.length > 0 && (
            <Badge className="ml-2 bg-primary text-primary-foreground">
              {selectedValues.length}
            </Badge>
          )}
          <Filter className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[220px] max-h-[400px] overflow-auto">
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => setSelectedValues([])}
          className="justify-between"
        >
          Clear all
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {options.map((option) => (
          <DropdownMenuCheckboxItem
            key={option.toString()}
            checked={selectedValues.includes(option.toString())}
            onCheckedChange={(checked) => {
              if (checked) {
                setSelectedValues([...selectedValues, option.toString()]);
              } else {
                setSelectedValues(selectedValues.filter(v => v !== option.toString()));
              }
            }}
          >
            {option.toString()}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // CSV Export Functions
  const prepareStudentsForCSV = (students: any[]) => {
    return students.map((student) => ({
      'Student Name': `${student.first_name || ''} ${student.last_name || ''}`,
      'Phone': student.phone || '',
      'Department': student.department || '',
      'Course': student.graduation?.course || '',
      'Passing Year': student.graduation?.passing_year || '',
      'College': student.graduation?.college_name || '',
      'Status': student.is_verified ? 'Verified' : 'Not Verified',
      'Selection Status': student.is_selected ? 'Selected' : 'Not Selected',
    }));
  };

  const prepareApplicationsForCSV = (applications: JobApplication[]) => {
    return applications.map((app) => ({
      'Student Name': `${app.student_profile?.first_name || ''} ${app.student_profile?.last_name || ''}`,
      'Student Phone': app.student_profile?.phone || '',
      'Student Department': app.student_profile?.department || '',
      'Course': app.graduation_details?.course || '',
      'Passing Year': app.graduation_details?.passing_year || '',
      'College': app.graduation_details?.college_name || '',
      'Job Title': app.job?.title || '',
      'Company': app.job?.company_name || '',
      'Package': app.job?.package || '',
      'Location': app.job?.location || '',
      'Status': formatStatus(app.status),
      'Applied Date': formatDate(app.created_at),
      'Admin Notes': app.admin_notes || ''
    }));
  };

  const prepareJobsForCSV = (jobs: JobPosting[]) => {
    return jobs.map((job) => ({
      'Job Title': job.title || '',
      'Company': job.company_name || '',
      'Location': job.location || '',
      'Package': job.package || '',
      'Applications': job.application_count || 0,
      'Selected Students': job.selected_count || 0,
      'Deadline': formatDate(job.application_deadline),
      'Status': job.status,
      'Created Date': formatDate(job.created_at)
    }));
  };

  const formatDate = (date?: string) => {
    return date ? format(new Date(date), 'dd/MM/yyyy') : 'N/A';
  };

  const formatStatus = (status: JobApplicationStatus) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-gray-600">Analytics and statistics of placement activities</p>
        </div>

        {loading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="students" className="flex items-center">
                <Users size={16} className="mr-2" /> Students
              </TabsTrigger>
              <TabsTrigger value="applications" className="flex items-center">
                <FileSpreadsheet size={16} className="mr-2" /> Applications
              </TabsTrigger>
              <TabsTrigger value="jobs" className="flex items-center">
                <Briefcase size={16} className="mr-2" /> Jobs
              </TabsTrigger>
            </TabsList>
            
            {/* Students Tab */}
            <TabsContent value="students" className="mt-6 space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Students Report</CardTitle>
                  <CSVLink 
                    data={prepareStudentsForCSV(filteredStudents)} 
                    filename={'students-report.csv'} 
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    <Download size={16} className="mr-2" /> Export CSV
                  </CSVLink>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <Input
                          placeholder="Search students..."
                          value={studentSearch}
                          onChange={(e) => setStudentSearch(e.target.value)}
                          className="pl-8"
                        />
                      </div>
                      
                      <div className="flex flex-wrap gap-3">
                        <Select value={studentVerificationFilter} onValueChange={setStudentVerificationFilter}>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Verification Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="verified">Verified</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="flagged">Flagged</SelectItem>
                            <SelectItem value="blocked">Blocked</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        {renderMultiSelect("Courses", courses, studentCourseFilter, setStudentCourseFilter)}
                        {renderMultiSelect("Passing Years", passingYears, studentPassingYearFilter, setStudentPassingYearFilter)}
                        {renderMultiSelect("Departments", departments, studentDepartmentFilter, setStudentDepartmentFilter)}
                        
                        <Select value={studentSelectionFilter} onValueChange={setStudentSelectionFilter}>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Selection Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Students</SelectItem>
                            <SelectItem value="selected">Selected</SelectItem>
                            <SelectItem value="not_selected">Not Selected</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>
                              {renderSortButton('name', 'Student Name', studentSortField, setStudentSortField, studentSortDirection, setStudentSortDirection)}
                            </TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>
                              {renderSortButton('college', 'College', studentSortField, setStudentSortField, studentSortDirection, setStudentSortDirection)}
                            </TableHead>
                            <TableHead>
                              {renderSortButton('course', 'Course', studentSortField, setStudentSortField, studentSortDirection, setStudentSortDirection)}
                            </TableHead>
                            <TableHead>
                              {renderSortButton('passing_year', 'Passing Year', studentSortField, setStudentSortField, studentSortDirection, setStudentSortDirection)}
                            </TableHead>
                            <TableHead>
                              {renderSortButton('status', 'Status', studentSortField, setStudentSortField, studentSortDirection, setStudentSortDirection)}
                            </TableHead>
                            <TableHead>Selection</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredStudents.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center py-4 text-gray-500">
                                No students match the filter criteria
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredStudents.map((student) => (
                              <TableRow key={student.id}>
                                <TableCell className="font-medium">
                                  {student.first_name} {student.last_name}
                                </TableCell>
                                <TableCell>{student.department || 'N/A'}</TableCell>
                                <TableCell>{(student as any).graduation?.college_name || 'N/A'}</TableCell>
                                <TableCell>{(student as any).graduation?.course || 'N/A'}</TableCell>
                                <TableCell>{(student as any).graduation?.passing_year || 'N/A'}</TableCell>
                                <TableCell>
                                  <Badge className={student.is_verified ? 'bg-green-500' : 'bg-yellow-500'}>
                                    {student.is_verified ? 'Verified' : student.verification_status}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge className={(student as any).is_selected ? 'bg-blue-500' : 'bg-gray-400'}>
                                    {(student as any).is_selected ? 'Selected' : 'Not Selected'}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Applications Tab */}
            <TabsContent value="applications" className="mt-6 space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Applications Report</CardTitle>
                  <CSVLink 
                    data={prepareApplicationsForCSV(filteredApplications)} 
                    filename={'applications-report.csv'} 
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    <Download size={16} className="mr-2" /> Export CSV
                  </CSVLink>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <Input
                          placeholder="Search applications..."
                          value={applicationSearch}
                          onChange={(e) => setApplicationSearch(e.target.value)}
                          className="pl-8"
                        />
                      </div>
                      
                      <div className="flex flex-wrap gap-3">
                        {renderMultiSelect("Status", ['applied', 'under_review', 'shortlisted', 'rejected', 'selected', 'internship', 'ppo', 'placement'], applicationStatusFilter, setApplicationStatusFilter)}
                        
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-[180px] justify-between text-left font-normal"
                            >
                              <span>Date Filter</span>
                              <CalendarIcon className="ml-2 h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={applicationDateFilter}
                              onSelect={setApplicationDateFilter}
                              initialFocus
                            />
                            {applicationDateFilter && (
                              <div className="p-2 border-t text-center">
                                <Button variant="ghost" size="sm" onClick={() => setApplicationDateFilter(undefined)}>
                                  Clear
                                </Button>
                              </div>
                            )}
                          </PopoverContent>
                        </Popover>
                        
                        {renderMultiSelect("Courses", courses, applicationCourseFilter, setApplicationCourseFilter)}
                        {renderMultiSelect("Passing Years", passingYears, applicationPassingYearFilter, setApplicationPassingYearFilter)}
                        {renderMultiSelect("Departments", departments, applicationDepartmentFilter, setApplicationDepartmentFilter)}
                        
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-[180px] justify-between text-left font-normal"
                            >
                              <span>Package Range</span>
                              <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
                                {packageRange[0]}-{packageRange[1]}L
                              </span>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80 p-4">
                            <div className="space-y-4">
                              <div className="flex justify-between">
                                <span>Package Range (in Lakhs)</span>
                              </div>
                              <Slider
                                defaultValue={packageRange}
                                min={minPackage}
                                max={maxPackage}
                                step={1}
                                onValueChange={(value) => setPackageRange(value as [number, number])}
                                className="mt-2"
                              />
                              <div className="flex justify-between">
                                <span>{packageRange[0]}L</span>
                                <span>{packageRange[1]}L</span>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                    
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>
                              {renderSortButton('student', 'Student', applicationSortField, setApplicationSortField, applicationSortDirection, setApplicationSortDirection)}
                            </TableHead>
                            <TableHead>
                              {renderSortButton('job', 'Job Title', applicationSortField, setApplicationSortField, applicationSortDirection, setApplicationSortDirection)}
                            </TableHead>
                            <TableHead>
                              {renderSortButton('company', 'Company', applicationSortField, setApplicationSortField, applicationSortDirection, setApplicationSortDirection)}
                            </TableHead>
                            <TableHead>
                              {renderSortButton('package', 'Package', applicationSortField, setApplicationSortField, applicationSortDirection, setApplicationSortDirection)}
                            </TableHead>
                            <TableHead>
                              {renderSortButton('date', 'Applied On', applicationSortField, setApplicationSortField, applicationSortDirection, setApplicationSortDirection)}
                            </TableHead>
                            <TableHead>
                              {renderSortButton('status', 'Status', applicationSortField, setApplicationSortField, applicationSortDirection, setApplicationSortDirection)}
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredApplications.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                                No applications match the filter criteria
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredApplications.map((application) => (
                              <TableRow key={application.id}>
                                <TableCell className="font-medium">
                                  {application.student_profile?.first_name} {application.student_profile?.last_name}
                                </TableCell>
                                <TableCell>{application.job?.title}</TableCell>
                                <TableCell>{application.job?.company_name}</TableCell>
                                <TableCell>{application.job?.package}</TableCell>
                                <TableCell>{formatDate(application.created_at)}</TableCell>
                                <TableCell>
                                  <Badge className={
                                    application.status === 'selected' || 
                                    application.status === 'internship' || 
                                    application.status === 'ppo' || 
                                    application.status === 'placement' 
                                      ? 'bg-green-500' 
                                      : application.status === 'under_review' || application.status === 'shortlisted'
                                        ? 'bg-blue-500'
                                        : application.status === 'rejected'
                                          ? 'bg-red-500'
                                          : 'bg-gray-500'
                                  }>
                                    {formatStatus(application.status)}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Jobs Tab */}
            <TabsContent value="jobs" className="mt-6 space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Jobs Report</CardTitle>
                  <CSVLink 
                    data={prepareJobsForCSV(filteredJobs)} 
                    filename={'jobs-report.csv'} 
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    <Download size={16} className="mr-2" /> Export CSV
                  </CSVLink>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <Input
                          placeholder="Search jobs..."
                          value={jobSearch}
                          onChange={(e) => setJobSearch(e.target.value)}
                          className="pl-8"
                        />
                      </div>
                      
                      <div className="flex flex-wrap gap-3">
                        {renderMultiSelect("Status", ['active', 'closed', 'draft'], jobStatusFilter, setJobStatusFilter)}
                        
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-[180px] justify-between text-left font-normal"
                            >
                              <span>Deadline</span>
                              <CalendarIcon className="ml-2 h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={jobDeadlineFilter}
                              onSelect={setJobDeadlineFilter}
                              initialFocus
                            />
                            {jobDeadlineFilter && (
                              <div className="p-2 border-t text-center">
                                <Button variant="ghost" size="sm" onClick={() => setJobDeadlineFilter(undefined)}>
                                  Clear
                                </Button>
                              </div>
                            )}
                          </PopoverContent>
                        </Popover>
                        
                        {renderMultiSelect("Locations", locations, jobLocationFilter, setJobLocationFilter)}
                        
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-[180px] justify-between text-left font-normal"
                            >
                              <span>Selected Range</span>
                              <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
                                {selectedStudentsFilter[0]}-{selectedStudentsFilter[1]}
                              </span>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80 p-4">
                            <div className="space-y-4">
                              <div className="flex justify-between">
                                <span>Selected Students Range</span>
                              </div>
                              <Slider
                                defaultValue={selectedStudentsFilter}
                                min={0}
                                max={maxSelectedStudents}
                                step={1}
                                onValueChange={(value) => setSelectedStudentsFilter(value as [number, number])}
                                className="mt-2"
                              />
                              <div className="flex justify-between">
                                <span>{selectedStudentsFilter[0]}</span>
                                <span>{selectedStudentsFilter[1]}</span>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                    
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>
                              {renderSortButton('title', 'Job Title', jobSortField, setJobSortField, jobSortDirection, setJobSortDirection)}
                            </TableHead>
                            <TableHead>
                              {renderSortButton('company', 'Company', jobSortField, setJobSortField, jobSortDirection, setJobSortDirection)}
                            </TableHead>
                            <TableHead>
                              {renderSortButton('location', 'Location', jobSortField, setJobSortField, jobSortDirection, setJobSortDirection)}
                            </TableHead>
                            <TableHead>
                              {renderSortButton('package', 'Package', jobSortField, setJobSortField, jobSortDirection, setJobSortDirection)}
                            </TableHead>
                            <TableHead>
                              {renderSortButton('applications', 'Applications', jobSortField, setJobSortField, jobSortDirection, setJobSortDirection)}
                            </TableHead>
                            <TableHead>
                              {renderSortButton('selected', 'Selected', jobSortField, setJobSortField, jobSortDirection, setJobSortDirection)}
                            </TableHead>
                            <TableHead>
                              {renderSortButton('deadline', 'Deadline', jobSortField, setJobSortField, jobSortDirection, setJobSortDirection)}
                            </TableHead>
                            <TableHead>
                              {renderSortButton('status', 'Status', jobSortField, setJobSortField, jobSortDirection, setJobSortDirection)}
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredJobs.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={8} className="text-center py-4 text-gray-500">
                                No jobs match the filter criteria
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredJobs.map((job) => (
                              <TableRow key={job.id}>
                                <TableCell className="font-medium">{job.title}</TableCell>
                                <TableCell>{job.company_name}</TableCell>
                                <TableCell>{job.location}</TableCell>
                                <TableCell>{job.package}</TableCell>
                                <TableCell>{job.application_count || 0}</TableCell>
                                <TableCell>{job.selected_count || 0}</TableCell>
                                <TableCell>{formatDate(job.application_deadline)}</TableCell>
                                <TableCell>
                                  <Badge className={
                                    job.status === 'active' ? 'bg-green-500' :
                                    job.status === 'closed' ? 'bg-red-500' : 'bg-gray-500'
                                  }>
                                    {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AdminLayout>
  );
};

export default Reports;
