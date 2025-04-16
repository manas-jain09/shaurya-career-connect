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
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';

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
  const [applicationStatusFilter, setApplicationStatusFilter] = useState<string[]>(['applied', 'under_review', 'shortlisted', 'selected', 'rejected', 'internship', 'ppo']);
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

            <TabsContent value="students" className="mt-4">
              <Card>
                <CardHeader className="pb-0">
                  <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <div>
                      <CardTitle>Students</CardTitle>
                      <p className="text-sm text-gray-500">List of all registered students</p>
                    </div>
                    <div className="flex gap-2">
                      <CSVLink
                        data={getStudentsCSVData()}
                        filename="students_report.csv"
                        className="inline-flex"
                      >
                        <Button variant="outline" size="sm" className="flex items-center gap-1">
                          <Download size={16} />
                          Export CSV
                        </Button>
                      </CSVLink>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex flex-col md:flex-row gap-4 flex-wrap">
                      <div className="w-full md:w-auto grow">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                          <Input
                            placeholder="Search students..."
                            className="pl-8"
                            value={studentSearch}
                            onChange={(e) => setStudentSearch(e.target.value)}
                          />
                        </div>
                      </div>
                      <Select
                        value={studentVerificationFilter}
                        onValueChange={setStudentVerificationFilter}
                      >
                        <SelectTrigger className="w-full md:w-[180px]">
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
                      {renderMultiSelect(
                        "Course",
                        courses,
                        studentCourseFilter,
                        setStudentCourseFilter
                      )}
                      {renderMultiSelect(
                        "Passing Year",
                        passingYears,
                        studentPassingYearFilter,
                        setStudentPassingYearFilter
                      )}
                      {renderMultiSelect(
                        "Department",
                        departments,
                        studentDepartmentFilter,
                        setStudentDepartmentFilter
                      )}
                      <Select
                        value={studentSelectionFilter}
                        onValueChange={setStudentSelectionFilter}
                      >
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
                    
                    <ScrollArea className="w-full overflow-auto">
                      <div className="min-w-[1000px]">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>
                                {renderSortButton('name', 'Name', studentSortField, setStudentSortField, studentSortDirection, setStudentSortDirection)}
                              </TableHead>
                              <TableHead>Phone</TableHead>
                              <TableHead>
                                {renderSortButton('department', 'Department', studentSortField, setStudentSortField, studentSortDirection, setStudentSortDirection)}
                              </TableHead>
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
                              <TableHead>Selected</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredStudents.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={8} className="text-center py-4 text-gray-500">
                                  No students found matching the criteria
                                </TableCell>
                              </TableRow>
                            ) : (
                              filteredStudents.map((student) => (
                                <TableRow key={student.id}>
                                  <TableCell className="font-medium">
                                    {student.first_name} {student.last_name}
                                  </TableCell>
                                  <TableCell>{student.phone}</TableCell>
                                  <TableCell>{student.department || '-'}</TableCell>
                                  <TableCell>{student.graduation?.college_name || '-'}</TableCell>
                                  <TableCell>{student.graduation?.course || '-'}</TableCell>
                                  <TableCell>{student.graduation?.passing_year || '-'}</TableCell>
                                  <TableCell>
                                    {student.is_verified ? (
                                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Verified</Badge>
                                    ) : student.is_blocked ? (
                                      <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Blocked</Badge>
                                    ) : student.flagged_sections && student.flagged_sections.length > 0 ? (
                                      <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Flagged</Badge>
                                    ) : (
                                      <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {student.is_selected ? (
                                      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Yes</Badge>
                                    ) : (
                                      <span className="text-gray-500">No</span>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </ScrollArea>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="applications" className="mt-4">
              <Card>
                <CardHeader className="pb-0">
                  <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <div>
                      <CardTitle>Applications</CardTitle>
                      <p className="text-sm text-gray-500">List of all job applications</p>
                    </div>
                    <div className="flex gap-2">
                      <CSVLink
                        data={getApplicationsCSVData()}
                        filename="applications_report.csv"
                        className="inline-flex"
                      >
                        <Button variant="outline" size="sm" className="flex items-center gap-1">
                          <Download size={16} />
                          Export CSV
                        </Button>
                      </CSVLink>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex flex-col md:flex-row gap-4 flex-wrap">
                      <div className="w-full md:w-auto grow">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                          <Input
                            placeholder="Search applications..."
                            className="pl-8"
                            value={applicationSearch}
                            onChange={(e) => setApplicationSearch(e.target.value)}
                          />
                        </div>
                      </div>
                      
                      {renderMultiSelect(
                        "Status",
                        ['applied', 'under_review', 'shortlisted', 'selected', 'rejected', 'internship', 'ppo'],
                        applicationStatusFilter,
                        setApplicationStatusFilter
                      )}
                      
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={`w-full md:w-[180px] justify-between ${
                              applicationDateFilter ? "text-foreground" : "text-muted-foreground"
                            }`}
                          >
                            {applicationDateFilter ? (
                              format(applicationDateFilter, "PPP")
                            ) : (
                              "Application Date"
                            )}
                            <CalendarIcon className="ml-2 h-4 w-4" />
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
                            <div className="flex justify-end p-2 border-t">
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
                      
                      {renderMultiSelect(
                        "Course",
                        courses,
                        applicationCourseFilter,
                        setApplicationCourseFilter
                      )}
                      
                      {renderMultiSelect(
                        "Passing Year",
                        passingYears,
                        applicationPassingYearFilter,
                        setApplicationPassingYearFilter
                      )}
                      
                      {renderMultiSelect(
                        "Department",
                        departments,
                        applicationDepartmentFilter,
                        setApplicationDepartmentFilter
                      )}
                      
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full md:w-[180px] justify-between"
                          >
                            Package Range
                            <SlidersHorizontal className="ml-2 h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                          <div className="space-y-4 p-2">
                            <h4 className="font-medium">Package Range (LPA)</h4>
                            <div className="flex gap-4 items-center">
                              <Input
                                type="number"
                                value={packageRange[0]}
                                onChange={(e) => {
                                  const newMin = Math.max(0, parseFloat(e.target.value) || 0);
                                  setPackageRange([newMin, Math.max(newMin, packageRange[1])]);
                                }}
                                className="w-20"
                              />
                              <Slider
                                value={packageRange}
                                min={minPackage}
                                max={maxPackage}
                                step={0.5}
                                onValueChange={(value) => setPackageRange(value as [number, number])}
                                className="flex-1"
                              />
                              <Input
                                type="number"
                                value={packageRange[1]}
                                onChange={(e) => {
                                  const newMax = Math.min(maxPackage, parseFloat(e.target.value) || maxPackage);
                                  setPackageRange([Math.min(packageRange[0], newMax), newMax]);
                                }}
                                className="w-20"
                              />
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <ScrollArea className="w-full overflow-auto">
                      <div className="min-w-[1000px]">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>
                                {renderSortButton('student', 'Student', applicationSortField, setApplicationSortField, applicationSortDirection, setApplicationSortDirection)}
                              </TableHead>
                              <TableHead>Phone</TableHead>
                              <TableHead>
                                {renderSortButton('job', 'Job Title', applicationSortField, setApplicationSortField, applicationSortDirection, setApplicationSortDirection)}
                              </TableHead>
                              <TableHead>
                                {renderSortButton('company', 'Company', applicationSortField, setApplicationSortField, applicationSortDirection, setApplicationSortDirection)}
                              </TableHead>
                              <TableHead>Location</TableHead>
                              <TableHead>
                                {renderSortButton('package', 'Package', applicationSortField, setApplicationSortField, applicationSortDirection, setApplicationSortDirection)}
                              </TableHead>
                              <TableHead>
                                {renderSortButton('status', 'Status', applicationSortField, setApplicationSortField, applicationSortDirection, setApplicationSortDirection)}
                              </TableHead>
                              <TableHead>
                                {renderSortButton('date', 'Applied On', applicationSortField, setApplicationSortField, applicationSortDirection, setApplicationSortDirection)}
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredApplications.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={8} className="text-center py-4 text-gray-500">
                                  No applications found matching the criteria
                                </TableCell>
                              </TableRow>
                            ) : (
                              filteredApplications.map((app) => (
                                <TableRow key={app.id}>
                                  <TableCell className="font-medium">
                                    {app.student_profile?.first_name || ''} {app.student_profile?.last_name || ''}
                                  </TableCell>
                                  <TableCell>{app.student_profile?.phone || '-'}</TableCell>
                                  <TableCell>{app.job?.title || '-'}</TableCell>
                                  <TableCell>{app.job?.company_name || '-'}</TableCell>
                                  <TableCell>{app.job?.location || '-'}</TableCell>
                                  <TableCell>{app.job?.package || '-'}</TableCell>
                                  <TableCell>
                                    <Badge className={
                                      app.status === 'selected' ? "bg-green-100 text-green-800 hover:bg-green-100" :
                                      app.status === 'rejected' ? "bg-red-100 text-red-800 hover:bg-red-100" : 
                                      app.status === 'shortlisted' || app.status === 'interviewed' ? "bg-blue-100 text-blue-800 hover:bg-blue-100" :
                                      app.status === 'internship' || app.status === 'ppo' ? "bg-purple-100 text-purple-800 hover:bg-purple-100" :
                                      "bg-gray-100 text-gray-800 hover:bg-gray-100"
                                    }>
                                      {app.status === 'ppo' ? 'PPO' : app.status.charAt(0).toUpperCase() + app.status.slice(1).replace('_', ' ')}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    {app.created_at ? new Date(app.created_at).toLocaleDateString() : '-'}
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </ScrollArea>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="jobs" className="mt-4">
              <Card>
                <CardHeader className="pb-0">
                  <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <div>
                      <CardTitle>Jobs</CardTitle>
                      <p className="text-sm text-gray-500">List of all job postings</p>
                    </div>
                    <div className="flex gap-2">
                      <CSVLink
                        data={getJobsCSVData()}
                        filename="jobs_report.csv"
                        className="inline-flex"
                      >
                        <Button variant="outline" size="sm" className="flex items-center gap-1">
                          <Download size={16} />
                          Export CSV
                        </Button>
                      </CSVLink>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex flex-col md:flex-row gap-4 flex-wrap">
                      <div className="w-full md:w-auto grow">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                          <Input
                            placeholder="Search jobs..."
                            className="pl-8"
                            value={jobSearch}
                            onChange={(e) => setJobSearch(e.target.value)}
                          />
                        </div>
                      </div>
                      
                      {renderMultiSelect(
                        "Status",
                        ['active', 'inactive', 'draft', 'closed'],
                        jobStatusFilter,
                        setJobStatusFilter
                      )}
                      
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={`w-full md:w-[180px] justify-between ${
                              jobDeadlineFilter ? "text-foreground" : "text-muted-foreground"
                            }`}
                          >
                            {jobDeadlineFilter ? (
                              format(jobDeadlineFilter, "PPP")
                            ) : (
                              "Deadline"
                            )}
                            <CalendarIcon className="ml-2 h-4 w-4" />
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
                            <div className="flex justify-end p-2 border-t">
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
                      
                      {renderMultiSelect(
                        "Location",
                        locations,
                        jobLocationFilter,
                        setJobLocationFilter
                      )}
                      
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full md:w-[180px] justify-between"
                          >
                            Selected Students
                            <SlidersHorizontal className="ml-2 h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                          <div className="space-y-4 p-2">
                            <h4 className="font-medium">Selected Students Range</h4>
                            <div className="flex gap-4 items-center">
                              <Input
                                type="number"
                                value={selectedStudentsFilter[0]}
                                onChange={(e) => {
                                  const newMin = Math.max(0, parseInt(e.target.value) || 0);
                                  setSelectedStudentsFilter([newMin, Math.max(newMin, selectedStudentsFilter[1])]);
                                }}
                                className="w-20"
                              />
                              <Slider
                                value={selectedStudentsFilter}
                                min={0}
                                max={maxSelectedStudents}
                                step={1}
                                onValueChange={(value) => setSelectedStudentsFilter(value as [number, number])}
                                className="flex-1"
                              />
                              <Input
                                type="number"
                                value={selectedStudentsFilter[1]}
                                onChange={(e) => {
                                  const newMax = Math.min(maxSelectedStudents, parseInt(e.target.value) || maxSelectedStudents);
                                  setSelectedStudentsFilter([Math.min(selectedStudentsFilter[0], newMax), newMax]);
                                }}
                                className="w-20"
                              />
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <ScrollArea className="w-full overflow-auto">
                      <div className="min-w-[1000px]">
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
                                  No jobs found matching the criteria
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
                                    {job.application_deadline ? new Date(job.application_deadline).toLocaleDateString() : '-'}
                                  </TableCell>
                                  <TableCell>
                                    <Badge className={
                                      job.status === 'active' ? "bg-green-100 text-green-800 hover:bg-green-100" :
                                      job.status === 'inactive' ? "bg-orange-100 text-orange-800 hover:bg-orange-100" : 
                                      job.status === 'closed' ? "bg-red-100 text-red-800 hover:bg-red-100" :
                                      "bg-gray-100 text-gray-800 hover:bg-gray-100"
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
                    </ScrollArea>
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
