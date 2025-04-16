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
  SlidersHorizontal,
  ArrowUpDown,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
import { JobApplication, JobApplicationStatus, StudentProfile } from '@/types/database.types';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';

const Reports = () => {
  const [activeTab, setActiveTab] = useState('students');
  
  // Students data
  const [students, setStudents] = useState<any[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentVerificationFilter, setStudentVerificationFilter] = useState('all');
  const [studentCourseFilter, setStudentCourseFilter] = useState<string[]>([]);
  const [studentPassingYearFilter, setStudentPassingYearFilter] = useState<string[]>([]);
  const [studentDepartmentFilter, setStudentDepartmentFilter] = useState<string[]>([]);
  const [studentSelectionFilter, setStudentSelectionFilter] = useState('all');
  const [courses, setCourses] = useState<string[]>([]);
  const [passingYears, setPassingYears] = useState<number[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
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
  const [jobs, setJobs] = useState<any[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<any[]>([]);
  const [jobSearch, setJobSearch] = useState('');
  const [jobStatusFilter, setJobStatusFilter] = useState<string[]>([]);
  const [jobDeadlineFilter, setJobDeadlineFilter] = useState<Date | undefined>(undefined);
  const [jobLocationFilter, setJobLocationFilter] = useState<string[]>([]);
  const [selectedStudentsFilter, setSelectedStudentsFilter] = useState<[number, number]>([0, 100]);
  const [maxSelectedStudents, setMaxSelectedStudents] = useState(100);
  const [locations, setLocations] = useState<string[]>([]);
  const [jobSortField, setJobSortField] = useState<string>('title');
  const [jobSortDirection, setJobSortDirection] = useState<'asc' | 'desc'>('asc');
  
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

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
      
      setStudents(studentsWithGraduation || []);
      setFilteredStudents(studentsWithGraduation || []);
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
      // First fetch applications with job details
      const { data: applicationsData, error: applicationsError } = await supabase
        .from('job_applications')
        .select(`
          *,
          job:job_id(title, company_name, location, package)
        `)
        .order('created_at', { ascending: false });
      
      if (applicationsError) throw applicationsError;
      
      // Then fetch student profiles separately
      const studentIds = applicationsData.map(app => app.student_id);
      const { data: studentProfiles, error: profilesError } = await supabase
        .from('student_profiles')
        .select('id, first_name, last_name, phone, is_verified, department')
        .in('id', studentIds);
      
      if (profilesError) throw profilesError;
      
      // Fetch graduation details separately
      const { data: gradData, error: gradError } = await supabase
        .from('graduation_details')
        .select('*')
        .in('student_id', studentIds);
      
      if (gradError) throw gradError;
      
      // Combine all the data manually
      const fullApplicationsData = applicationsData.map(app => {
        const studentProfile = studentProfiles.find(p => p.id === app.student_id) || null;
        const gradDetails = gradData.find(g => g.student_id === app.student_id) || null;
        
        return {
          ...app,
          student_profile: studentProfile,
          graduation_details: gradDetails
        } as JobApplication;
      });
      
      // Extract unique courses, passing years, and departments
      const allCourses = new Set<string>();
      const allPassingYears = new Set<number>();
      const allDepartments = new Set<string>();
      
      fullApplicationsData.forEach(app => {
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
      
      fullApplicationsData.forEach(app => {
        const packageValue = parseFloat((app.job?.package || '0').replace(/[^\d.]/g, '')) || 0;
        if (packageValue < minPackageValue) minPackageValue = packageValue;
        if (packageValue > maxPackageValue) maxPackageValue = packageValue;
      });
      
      setMinPackage(Math.floor(minPackageValue));
      setMaxPackage(Math.ceil(maxPackageValue));
      setPackageRange([Math.floor(minPackageValue), Math.ceil(maxPackageValue)]);
      
      setCourses(Array.from(allCourses).sort());
      setPassingYears(Array.from(allPassingYears).sort());
      setDepartments(Array.from(allDepartments).sort());
      
      setApplications(fullApplicationsData);
      setFilteredApplications(fullApplicationsData);
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
        if (job.selected_count > maxSelected) {
          maxSelected = job.selected_count;
        }
      });
      
      setLocations(Array.from(allLocations).sort());
      setMaxSelectedStudents(maxSelected > 0 ? maxSelected : 100);
      setSelectedStudentsFilter([0, maxSelected > 0 ? maxSelected : 100]);
      
      setJobs(jobsWithCounts);
      setFilteredJobs(jobsWithCounts);
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
          valueA = `${a.first_name} ${a.last_name}`.toLowerCase();
          valueB = `${b.first_name} ${b.last_name}`.toLowerCase();
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
          valueA = parseFloat((a.job?.package || '0').replace(/[^\d.]/g, '')) || 0;
          valueB = parseFloat((b.job?.package || '0').replace(/[^\d.]/g, '')) || 0;
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
  const sortJobs = (data: any[]) => {
    return [...data].sort((a, b) => {
      let valueA, valueB;
      
      switch (jobSortField) {
        case 'title':
          valueA = a.title.toLowerCase();
          valueB = b.title.toLowerCase();
          break;
        case 'company':
          valueA = a.company_name.toLowerCase();
          valueB = b.company_name.toLowerCase();
          break;
        case 'location':
          valueA = a.location.toLowerCase();
          valueB = b.location.toLowerCase();
          break;
        case 'package':
          valueA = parseFloat(a.package.replace(/[^\d.]/g, '')) || 0;
          valueB = parseFloat(b.package.replace(/[^\d.]/g, '')) || 0;
          break;
        case 'applications':
          valueA = a.application_count;
          valueB = b.application_count;
          break;
        case 'selected':
          valueA = a.selected_count;
          valueB = b.selected_count;
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
          valueA = a[jobSortField] || '';
          valueB = b[jobSortField] || '';
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
        student.first_name?.toLowerCase().includes(term) ||
        student.last_name?.toLowerCase().includes(term) ||
        student.phone?.toLowerCase().includes(term) ||
        student.graduation?.college_name?.toLowerCase().includes(term)
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
        student.graduation?.course && studentCourseFilter.includes(student.graduation.course)
      );
    }
    
    // Filter by passing year
    if (studentPassingYearFilter.length > 0) {
      filtered = filtered.filter(student => 
        student.graduation?.passing_year && 
        studentPassingYearFilter.includes(student.graduation.passing_year.toString())
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
          return student.is_selected === true;
        } else if (studentSelectionFilter === 'not_selected') {
          return student.is_selected !== true;
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
        app.student_profile?.first_name?.toLowerCase().includes(term) ||
        app.student_profile?.last_name?.toLowerCase().includes(term) ||
        app.job?.title?.toLowerCase().includes(term) ||
        app.job?.company_name?.toLowerCase().includes(term)
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
        const appDate = new Date(app.created_at || '');
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
    
    // Filter by package range
    filtered = filtered.filter(app => {
      const packageValue = parseFloat((app.job?.package || '0').replace(/[^\d.]/g, '')) || 0;
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
        job.title?.toLowerCase().includes(term) ||
        job.company_name?.toLowerCase().includes(term) ||
        job.location?.toLowerCase().includes(term)
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
        const deadlineDate = new Date(job.application_deadline || '');
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
    filtered = filtered.filter(job => 
      job.selected_count >= selectedStudentsFilter[0] && 
      job.selected_count <= selectedStudentsFilter[1]
    );
    
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
      <DropdownMenuContent className="w-[220px]">
        <ScrollArea className="h-[300px]">
          <div className="p-2">
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
          </div>
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // CSV Export Functions
  const getStudentsCSVData = () => {
    return filteredStudents.map(student => ({
      'Name': `${student.first_name} ${student.last_name}`,
      'Phone': student.phone,
      'Email': student.email,
      'Department': student.department || 'N/A',
      'College': student.graduation?.college_name || 'N/A',
      'Course': student.graduation?.course || 'N/A',
      'Passing Year': student.graduation?.passing_year || 'N/A',
      'Marks': student.graduation?.marks || 'N/A',
      'Is CGPA': student.graduation?.is_cgpa ? 'Yes' : 'No',
      'Verified': student.is_verified ? 'Yes' : 'No',
      'Verification Status': student.verification_status,
      'Flagged Sections': student.flagged_sections ? student.flagged_sections.join(', ') : 'None',
      'Blocked': student.is_blocked ? 'Yes' : 'No',
      'Selected': student.is_selected ? 'Yes' : 'No'
    }));
  };

  const getApplicationsCSVData = () => {
    return filteredApplications.map(app => ({
      'Student Name': `${app.student_profile?.first_name} ${app.student_profile?.last_name}`,
      'Phone': app.student_profile?.phone || 'N/A',
      'Department': app.student_profile?.department || 'N/A',
      'Course': app.graduation_details?.course || 'N/A',
      'Passing Year': app.graduation_details?.passing_year || 'N/A',
      'Job Title': app.job?.title || 'N/A',
      'Company': app.job?.company_name || 'N/A',
      'Location': app.job?.location || 'N/A',
      'Package': app.job?.package || 'N/A',
      'Status': app.status === 'ppo' ? 'PPO' : app.status.replace('_', ' '),
      'Applied Date': app.created_at ? new Date(app.created_at).toLocaleDateString() : 'N/A',
      'Admin Notes': app.admin_notes || 'N/A',
      'Offer Letter': app.offer_letter_url ? 'Available' : 'Not uploaded'
    }));
  };

  const getJobsCSVData = () => {
    return filteredJobs.map(job => ({
      'Title': job.title,
      'Company': job.company_name,
      'Location': job.location,
      'Package': job.package,
      'Status': job.status,
      'Applications': job.application_count,
      'Selected Students': job.selected_count,
      'Deadline': job.application_deadline ? new Date(job.application_deadline).toLocaleDateString() : 'N/A',
      'Created On': job.created_at ? new Date(job.created_at).toLocaleDateString() : 'N/A',
      'Min 10th Marks': job.min_class_x_marks || 'N/A',
      'Min 12th Marks': job.min_class_xii_marks || 'N/A',
      'Min Graduation Marks': job.min_graduation_marks || 'N/A',
      'Allow Backlog': job.allow_backlog ? 'Yes' : 'No'
    }));
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
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="overflow-hidden">
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
            
            {/* Students Tab Content */}
            <TabsContent value="students" className="space-y-4">
              {/* Students filters and table content */}
              <Card>
                <CardHeader>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <CardTitle>Students Data</CardTitle>
                    <div className="flex items-center gap-2">
                      <CSVLink 
                        data={getStudentsCSVData()}
                        filename={`students-report-${new Date().toISOString().split('T')[0]}.csv`}
                        className="flex items-center gap-1 bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700"
                      >
                        <Download size={16} /> Export CSV
                      </CSVLink>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <ScrollArea className="max-w-full">
                      <div className="flex flex-col md:flex-row gap-3 flex-wrap min-w-max pb-2 pr-2">
                        <div className="flex-1 min-w-[200px]">
                          <Input
                            placeholder="Search students..."
                            value={studentSearch}
                            onChange={(e) => setStudentSearch(e.target.value)}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <Select value={studentVerificationFilter} onValueChange={setStudentVerificationFilter}>
                            <SelectTrigger className="w-full md:w-[180px]">
                              <SelectValue placeholder="Verification" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Verification</SelectItem>
                              <SelectItem value="verified">Verified</SelectItem>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="flagged">Flagged</SelectItem>
                              <SelectItem value="blocked">Blocked</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {renderMultiSelect('Course', courses, studentCourseFilter, setStudentCourseFilter)}
                        {renderMultiSelect('Passing Year', passingYears, studentPassingYearFilter, setStudentPassingYearFilter)}
                        {renderMultiSelect('Department', departments, studentDepartmentFilter, setStudentDepartmentFilter)}
                        <div>
                          <Select value={studentSelectionFilter} onValueChange={setStudentSelectionFilter}>
                            <SelectTrigger className="w-full md:w-[180px]">
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
                    </ScrollArea>

                    <div className="rounded-md border overflow-auto">
                      <ScrollArea className="h-[500px]">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>
                                {renderSortButton('name', 'Name', studentSortField, setStudentSortField, studentSortDirection, setStudentSortDirection)}
                              </TableHead>
                              <TableHead>Phone</TableHead>
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
                                {renderSortButton('department', 'Department', studentSortField, setStudentSortField, studentSortDirection, setStudentSortDirection)}
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
                                <TableCell colSpan={8} className="text-center py-4">
                                  No students match the filter criteria
                                </TableCell>
                              </TableRow>
                            ) : (
                              filteredStudents.map((student) => (
                                <TableRow key={student.id}>
                                  <TableCell className="font-medium">
                                    {student.first_name} {student.last_name}
                                  </TableCell>
                                  <TableCell>{student.phone}</TableCell>
                                  <TableCell>{student.graduation?.college_name || 'N/A'}</TableCell>
                                  <TableCell>{student.graduation?.course || 'N/A'}</TableCell>
                                  <TableCell>{student.graduation?.passing_year || 'N/A'}</TableCell>
                                  <TableCell>{student.department || 'N/A'}</TableCell>
                                  <TableCell>
                                    {student.is_verified ? (
                                      <Badge>Verified</Badge>
                                    ) : student.flagged_sections && student.flagged_sections.length > 0 ? (
                                      <Badge variant="outline">Flagged</Badge>
                                    ) : (
                                      <Badge variant="secondary">Pending</Badge>
                                    )}
                                    {student.is_blocked && (
                                      <Badge variant="destructive" className="ml-1">Blocked</Badge>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {student.is_selected ? (
                                      <Badge>Selected</Badge>
                                    ) : (
                                      <Badge variant="outline">Not Selected</Badge>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Applications Tab Content */}
            <TabsContent value="applications" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <CardTitle>Applications Data</CardTitle>
                    <div className="flex items-center gap-2">
                      <CSVLink 
                        data={getApplicationsCSVData()}
                        filename={`applications-report-${new Date().toISOString().split('T')[0]}.csv`}
                        className="flex items-center gap-1 bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700"
                      >
                        <Download size={16} /> Export CSV
                      </CSVLink>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <ScrollArea className="max-w-full">
                      <div className="flex flex-col md:flex-row gap-3 flex-wrap min-w-max pb-2 pr-2">
                        <div className="flex-1 min-w-[200px]">
                          <Input
                            placeholder="Search applications..."
                            value={applicationSearch}
                            onChange={(e) => setApplicationSearch(e.target.value)}
                            className="w-full"
                          />
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-full md:w-[180px] justify-between">
                              <span>Status</span>
                              {applicationStatusFilter.length > 0 && (
                                <Badge className="ml-2 bg-primary text-primary-foreground">
                                  {applicationStatusFilter.length}
                                </Badge>
                              )}
                              <Filter className="ml-2 h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-[220px]">
                            <ScrollArea className="h-[300px]">
                              <div className="p-2">
                                <DropdownMenuLabel>Application Status</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => setApplicationStatusFilter([])}
                                  className="justify-between"
                                >
                                  Clear all
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuCheckboxItem
                                  checked={applicationStatusFilter.includes('applied')}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setApplicationStatusFilter([...applicationStatusFilter, 'applied']);
                                    } else {
                                      setApplicationStatusFilter(applicationStatusFilter.filter(s => s !== 'applied'));
                                    }
                                  }}
                                >
                                  Applied
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem
                                  checked={applicationStatusFilter.includes('under_review')}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setApplicationStatusFilter([...applicationStatusFilter, 'under_review']);
                                    } else {
                                      setApplicationStatusFilter(applicationStatusFilter.filter(s => s !== 'under_review'));
                                    }
                                  }}
                                >
                                  Under Review
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem
                                  checked={applicationStatusFilter.includes('shortlisted')}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setApplicationStatusFilter([...applicationStatusFilter, 'shortlisted']);
                                    } else {
                                      setApplicationStatusFilter(applicationStatusFilter.filter(s => s !== 'shortlisted'));
                                    }
                                  }}
                                >
                                  Shortlisted
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem
                                  checked={applicationStatusFilter.includes('rejected')}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setApplicationStatusFilter([...applicationStatusFilter, 'rejected']);
                                    } else {
                                      setApplicationStatusFilter(applicationStatusFilter.filter(s => s !== 'rejected'));
                                    }
                                  }}
                                >
                                  Rejected
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem
                                  checked={applicationStatusFilter.includes('selected')}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setApplicationStatusFilter([...applicationStatusFilter, 'selected']);
                                    } else {
                                      setApplicationStatusFilter(applicationStatusFilter.filter(s => s !== 'selected'));
                                    }
                                  }}
                                >
                                  Selected
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem
                                  checked={applicationStatusFilter.includes('internship')}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setApplicationStatusFilter([...applicationStatusFilter, 'internship']);
                                    } else {
                                      setApplicationStatusFilter(applicationStatusFilter.filter(s => s !== 'internship'));
                                    }
                                  }}
                                >
                                  Internship
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem
                                  checked={applicationStatusFilter.includes('ppo')}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setApplicationStatusFilter([...applicationStatusFilter, 'ppo']);
                                    } else {
                                      setApplicationStatusFilter(applicationStatusFilter.filter(s => s !== 'ppo'));
                                    }
                                  }}
                                >
                                  PPO
                                </DropdownMenuCheckboxItem>
                              </div>
                            </ScrollArea>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={`w-full md:w-[180px] justify-start text-left font-normal ${!applicationDateFilter && "text-muted-foreground"}`}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {applicationDateFilter ? format(applicationDateFilter, "PPP") : <span>Application Date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={applicationDateFilter}
                              onSelect={setApplicationDateFilter}
                              initialFocus
                            />
                            {applicationDateFilter && (
                              <div className="p-3 border-t flex justify-end">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setApplicationDateFilter(undefined)}
                                >
                                  Clear
                                </Button>
                              </div>
                            )}
                          </PopoverContent>
                        </Popover>
                        
                        {renderMultiSelect('Course', courses, applicationCourseFilter, setApplicationCourseFilter)}
                        {renderMultiSelect('Passing Year', passingYears, applicationPassingYearFilter, setApplicationPassingYearFilter)}
                        {renderMultiSelect('Department', departments, applicationDepartmentFilter, setApplicationDepartmentFilter)}
                        
                        <div className="w-full md:w-[280px]">
                          <div className="flex justify-between mb-1">
                            <span className="text-sm">Package Range: {packageRange[0]} - {packageRange[1]} LPA</span>
                          </div>
                          <Slider
                            defaultValue={[minPackage, maxPackage]}
                            value={packageRange}
                            onValueChange={(value) => setPackageRange(value as [number, number])}
                            min={minPackage}
                            max={maxPackage}
                            step={1}
                            className="mb-3"
                          />
                        </div>
                      </div>
                    </ScrollArea>

                    <div className="rounded-md border overflow-auto">
                      <ScrollArea className="h-[500px]">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>
                                {renderSortButton('student', 'Student', applicationSortField, setApplicationSortField, applicationSortDirection, setApplicationSortDirection)}
                              </TableHead>
                              <TableHead>Details</TableHead>
                              <TableHead>
                                {renderSortButton('job', 'Job', applicationSortField, setApplicationSortField, applicationSortDirection, setApplicationSortDirection)}
                              </TableHead>
                              <TableHead>
                                {renderSortButton('company', 'Company', applicationSortField, setApplicationSortField, applicationSortDirection, setApplicationSortDirection)}
                              </TableHead>
                              <TableHead>
                                {renderSortButton('package', 'Package', applicationSortField, setApplicationSortField, applicationSortDirection, setApplicationSortDirection)}
                              </TableHead>
                              <TableHead>
                                {renderSortButton('date', 'Date', applicationSortField, setApplicationSortField, applicationSortDirection, setApplicationSortDirection)}
                              </TableHead>
                              <TableHead>
                                {renderSortButton('status', 'Status', applicationSortField, setApplicationSortField, applicationSortDirection, setApplicationSortDirection)}
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredApplications.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={7} className="text-center py-4">
                                  No applications match the filter criteria
                                </TableCell>
                              </TableRow>
                            ) : (
                              filteredApplications.map((app) => (
                                <TableRow key={app.id}>
                                  <TableCell className="font-medium">
                                    {app.student_profile ? `${app.student_profile.first_name} ${app.student_profile.last_name}` : 'Unknown'}
                                  </TableCell>
                                  <TableCell>
                                    <div className="text-sm">
                                      <div>Course: {app.graduation_details?.course || 'N/A'}</div>
                                      <div>Year: {app.graduation_details?.passing_year || 'N/A'}</div>
                                      <div>Dept: {app.student_profile?.department || 'N/A'}</div>
                                    </div>
                                  </TableCell>
                                  <TableCell>{app.job?.title || 'N/A'}</TableCell>
                                  <TableCell>{app.job?.company_name || 'N/A'}</TableCell>
                                  <TableCell>{app.job?.package || 'N/A'}</TableCell>
                                  <TableCell>
                                    {app.created_at ? format(new Date(app.created_at), 'MMM dd, yyyy') : 'N/A'}
                                  </TableCell>
                                  <TableCell>
                                    {app.status === 'applied' && <Badge>Applied</Badge>}
                                    {app.status === 'under_review' && <Badge variant="secondary">Under Review</Badge>}
                                    {app.status === 'shortlisted' && <Badge variant="outline">Shortlisted</Badge>}
                                    {app.status === 'rejected' && <Badge variant="destructive">Rejected</Badge>}
                                    {app.status === 'selected' && <Badge>Selected</Badge>}
                                    {app.status === 'internship' && <Badge variant="outline">Internship</Badge>}
                                    {app.status === 'ppo' && <Badge variant="secondary">PPO</Badge>}
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Jobs Tab Content */}
            <TabsContent value="jobs" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <CardTitle>Jobs Data</CardTitle>
                    <div className="flex items-center gap-2">
                      <CSVLink 
                        data={getJobsCSVData()}
                        filename={`jobs-report-${new Date().toISOString().split('T')[0]}.csv`}
                        className="flex items-center gap-1 bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700"
                      >
                        <Download size={16} /> Export CSV
                      </CSVLink>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <ScrollArea className="max-w-full">
                      <div className="flex flex-col md:flex-row gap-3 flex-wrap min-w-max pb-2 pr-2">
                        <div className="flex-1 min-w-[200px]">
                          <Input
                            placeholder="Search jobs..."
                            value={jobSearch}
                            onChange={(e) => setJobSearch(e.target.value)}
                            className="w-full"
                          />
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-full md:w-[180px] justify-between">
                              <span>Status</span>
                              {jobStatusFilter.length > 0 && (
                                <Badge className="ml-2 bg-primary text-primary-foreground">
                                  {jobStatusFilter.length}
                                </Badge>
                              )}
                              <Filter className="ml-2 h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-[220px]">
                            <ScrollArea className="h-[200px]">
                              <div className="p-2">
                                <DropdownMenuLabel>Job Status</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => setJobStatusFilter([])}
                                  className="justify-between"
                                >
                                  Clear all
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuCheckboxItem
                                  checked={jobStatusFilter.includes('active')}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setJobStatusFilter([...jobStatusFilter, 'active']);
                                    } else {
                                      setJobStatusFilter(jobStatusFilter.filter(s => s !== 'active'));
                                    }
                                  }}
                                >
                                  Active
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem
                                  checked={jobStatusFilter.includes('closed')}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setJobStatusFilter([...jobStatusFilter, 'closed']);
                                    } else {
                                      setJobStatusFilter(jobStatusFilter.filter(s => s !== 'closed'));
                                    }
                                  }}
                                >
                                  Closed
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem
                                  checked={jobStatusFilter.includes('draft')}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setJobStatusFilter([...jobStatusFilter, 'draft']);
                                    } else {
                                      setJobStatusFilter(jobStatusFilter.filter(s => s !== 'draft'));
                                    }
                                  }}
                                >
                                  Draft
                                </DropdownMenuCheckboxItem>
                              </div>
                            </ScrollArea>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={`w-full md:w-[180px] justify-start text-left font-normal ${!jobDeadlineFilter && "text-muted-foreground"}`}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {jobDeadlineFilter ? format(jobDeadlineFilter, "PPP") : <span>Deadline</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={jobDeadlineFilter}
                              onSelect={setJobDeadlineFilter}
                              initialFocus
                            />
                            {jobDeadlineFilter && (
                              <div className="p-3 border-t flex justify-end">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setJobDeadlineFilter(undefined)}
                                >
                                  Clear
                                </Button>
                              </div>
                            )}
                          </PopoverContent>
                        </Popover>
                        
                        {renderMultiSelect('Location', locations, jobLocationFilter, setJobLocationFilter)}
                        
                        <div className="w-full md:w-[280px]">
                          <div className="flex justify-between mb-1">
                            <span className="text-sm">Selected Students: {selectedStudentsFilter[0]} - {selectedStudentsFilter[1]}</span>
                          </div>
                          <Slider
                            defaultValue={[0, maxSelectedStudents]}
                            value={selectedStudentsFilter}
                            onValueChange={(value) => setSelectedStudentsFilter(value as [number, number])}
                            min={0}
                            max={maxSelectedStudents}
                            step={1}
                            className="mb-3"
                          />
                        </div>
                      </div>
                    </ScrollArea>

                    <div className="rounded-md border overflow-auto">
                      <ScrollArea className="h-[500px]">
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
                                <TableCell colSpan={8} className="text-center py-4">
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
                                  <TableCell>{job.application_count}</TableCell>
                                  <TableCell>{job.selected_count}</TableCell>
                                  <TableCell>
                                    {job.application_deadline ? format(new Date(job.application_deadline), 'MMM dd, yyyy') : 'N/A'}
                                  </TableCell>
                                  <TableCell>
                                    {job.status === 'active' && <Badge>Active</Badge>}
                                    {job.status === 'closed' && <Badge variant="destructive">Closed</Badge>}
                                    {job.status === 'draft' && <Badge variant="outline">Draft</Badge>}
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </ScrollArea>
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
