
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
  CalendarIcon
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

const Reports = () => {
  const [activeTab, setActiveTab] = useState('students');
  
  // Students data
  const [students, setStudents] = useState<any[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentVerificationFilter, setStudentVerificationFilter] = useState('all');
  const [studentCourseFilter, setStudentCourseFilter] = useState('all');
  const [studentPassingYearFilter, setStudentPassingYearFilter] = useState('all');
  const [courses, setCourses] = useState<string[]>([]);
  const [passingYears, setPassingYears] = useState<number[]>([]);
  
  // Applications data
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<JobApplication[]>([]);
  const [applicationSearch, setApplicationSearch] = useState('');
  const [applicationStatusFilter, setApplicationStatusFilter] = useState('all');
  const [applicationDateFilter, setApplicationDateFilter] = useState<Date | undefined>(undefined);
  
  // Jobs data
  const [jobs, setJobs] = useState<any[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<any[]>([]);
  const [jobSearch, setJobSearch] = useState('');
  const [jobStatusFilter, setJobStatusFilter] = useState('all');
  const [jobDeadlineFilter, setJobDeadlineFilter] = useState<Date | undefined>(undefined);
  
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
      // Fetch students with their profiles and graduation details
      const { data: studentsData, error: studentsError } = await supabase
        .from('student_profiles')
        .select(`
          *,
          graduation:id(
            course,
            passing_year,
            college_name,
            marks,
            is_cgpa
          )
        `);

      if (studentsError) throw studentsError;

      // Get unique courses and passing years for filters
      const allCourses = new Set<string>();
      const allPassingYears = new Set<number>();
      
      studentsData?.forEach(student => {
        if (student.graduation?.course) {
          allCourses.add(student.graduation.course);
        }
        if (student.graduation?.passing_year) {
          allPassingYears.add(student.graduation.passing_year);
        }
      });
      
      setCourses(Array.from(allCourses).sort());
      setPassingYears(Array.from(allPassingYears).sort());
      
      setStudents(studentsData || []);
      setFilteredStudents(studentsData || []);
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
          student_profile:student_id(first_name, last_name, phone, is_verified)
        `)
        .order('created_at', { ascending: false });
      
      if (applicationsError) throw applicationsError;
      
      setApplications(applicationsData as JobApplication[] || []);
      setFilteredApplications(applicationsData as JobApplication[] || []);
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
      
      // Fetch application counts for each job
      const jobsWithCounts = await Promise.all(
        (jobsData || []).map(async (job) => {
          const { count, error } = await supabase
            .from('job_applications')
            .select('*', { count: 'exact', head: true })
            .eq('job_id', job.id);
          
          return {
            ...job,
            application_count: count || 0
          };
        })
      );
      
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
    if (studentCourseFilter !== 'all') {
      filtered = filtered.filter(student => 
        student.graduation?.course === studentCourseFilter
      );
    }
    
    // Filter by passing year
    if (studentPassingYearFilter !== 'all') {
      filtered = filtered.filter(student => 
        student.graduation?.passing_year === parseInt(studentPassingYearFilter)
      );
    }
    
    setFilteredStudents(filtered);
  }, [studentSearch, studentVerificationFilter, studentCourseFilter, studentPassingYearFilter, students]);

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
    if (applicationStatusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === applicationStatusFilter);
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
    
    setFilteredApplications(filtered);
  }, [applicationSearch, applicationStatusFilter, applicationDateFilter, applications]);

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
    if (jobStatusFilter !== 'all') {
      filtered = filtered.filter(job => job.status === jobStatusFilter);
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
    
    setFilteredJobs(filtered);
  }, [jobSearch, jobStatusFilter, jobDeadlineFilter, jobs]);

  // CSV Export Functions
  const getStudentsCSVData = () => {
    return filteredStudents.map(student => ({
      'Name': `${student.first_name} ${student.last_name}`,
      'Phone': student.phone,
      'Email': student.email,
      'College': student.graduation?.college_name || 'N/A',
      'Course': student.graduation?.course || 'N/A',
      'Passing Year': student.graduation?.passing_year || 'N/A',
      'Marks': student.graduation?.marks || 'N/A',
      'Is CGPA': student.graduation?.is_cgpa ? 'Yes' : 'No',
      'Verified': student.is_verified ? 'Yes' : 'No',
      'Verification Status': student.verification_status,
      'Flagged Sections': student.flagged_sections ? student.flagged_sections.join(', ') : 'None',
      'Blocked': student.is_blocked ? 'Yes' : 'No'
    }));
  };

  const getApplicationsCSVData = () => {
    return filteredApplications.map(app => ({
      'Student Name': `${app.student_profile?.first_name} ${app.student_profile?.last_name}`,
      'Phone': app.student_profile?.phone || 'N/A',
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
            
            {/* Students Tab */}
            <TabsContent value="students" className="mt-6 space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Students Report</CardTitle>
                  <CSVLink 
                    data={getStudentsCSVData()} 
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
                        
                        <Select value={studentCourseFilter} onValueChange={setStudentCourseFilter}>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Course" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Courses</SelectItem>
                            {courses.map(course => (
                              <SelectItem key={course} value={course}>{course}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        <Select 
                          value={studentPassingYearFilter} 
                          onValueChange={setStudentPassingYearFilter}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Passing Year" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Years</SelectItem>
                            {passingYears.map(year => (
                              <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>Course</TableHead>
                            <TableHead>College</TableHead>
                            <TableHead>Passing Year</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredStudents.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                                No students found
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredStudents.map((student) => (
                              <TableRow key={student.id}>
                                <TableCell>
                                  <div className="font-medium">
                                    {student.first_name} {student.last_name}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div>{student.phone}</div>
                                  <div className="text-xs text-gray-500">{student.email}</div>
                                </TableCell>
                                <TableCell>
                                  {student.graduation?.course || 'N/A'}
                                </TableCell>
                                <TableCell>
                                  {student.graduation?.college_name || 'N/A'}
                                </TableCell>
                                <TableCell>
                                  {student.graduation?.passing_year || 'N/A'}
                                </TableCell>
                                <TableCell>
                                  <div className="space-y-1">
                                    {student.is_verified ? (
                                      <Badge className="bg-green-100 text-green-800">Verified</Badge>
                                    ) : student.flagged_sections && student.flagged_sections.length > 0 ? (
                                      <Badge className="bg-amber-100 text-amber-800">Flagged</Badge>
                                    ) : (
                                      <Badge className="bg-blue-100 text-blue-800">Pending</Badge>
                                    )}
                                    
                                    {student.is_blocked && (
                                      <Badge className="bg-red-100 text-red-800">Blocked</Badge>
                                    )}
                                  </div>
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
                    data={getApplicationsCSVData()} 
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
                        <Select value={applicationStatusFilter} onValueChange={setApplicationStatusFilter}>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="applied">Applied</SelectItem>
                            <SelectItem value="under_review">Under Review</SelectItem>
                            <SelectItem value="shortlisted">Shortlisted</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                            <SelectItem value="selected">Selected</SelectItem>
                            <SelectItem value="internship">Internship</SelectItem>
                            <SelectItem value="ppo">PPO</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={`w-[180px] justify-start text-left font-normal ${
                                !applicationDateFilter && "text-muted-foreground"
                              }`}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {applicationDateFilter ? (
                                format(applicationDateFilter, "PPP")
                              ) : (
                                <span>Application Date</span>
                              )}
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
                              <div className="p-3 border-t">
                                <Button 
                                  variant="ghost" 
                                  onClick={() => setApplicationDateFilter(undefined)}
                                  size="sm"
                                  className="w-full"
                                >
                                  Clear Date
                                </Button>
                              </div>
                            )}
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                    
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Student</TableHead>
                            <TableHead>Job</TableHead>
                            <TableHead>Company</TableHead>
                            <TableHead>Applied On</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Offer Letter</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredApplications.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                                No applications found
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredApplications.map((application) => (
                              <TableRow key={application.id}>
                                <TableCell>
                                  <div className="font-medium">
                                    {application.student_profile?.first_name} {application.student_profile?.last_name}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {application.student_profile?.phone}
                                  </div>
                                </TableCell>
                                <TableCell>{application.job?.title || 'N/A'}</TableCell>
                                <TableCell>{application.job?.company_name || 'N/A'}</TableCell>
                                <TableCell>
                                  {application.created_at 
                                    ? new Date(application.created_at).toLocaleDateString() 
                                    : 'N/A'
                                  }
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <Badge 
                                      className={
                                        application.status === 'selected' ? 'bg-green-100 text-green-800' :
                                        application.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                        application.status === 'applied' ? 'bg-blue-100 text-blue-800' :
                                        application.status === 'under_review' ? 'bg-yellow-100 text-yellow-800' :
                                        application.status === 'shortlisted' ? 'bg-purple-100 text-purple-800' :
                                        application.status === 'internship' ? 'bg-indigo-100 text-indigo-800' :
                                        application.status === 'ppo' ? 'bg-pink-100 text-pink-800' :
                                        'bg-gray-100 text-gray-800'
                                      }
                                    >
                                      {application.status === 'ppo' 
                                        ? 'PPO' 
                                        : application.status.replace('_', ' ')
                                      }
                                    </Badge>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {application.offer_letter_url ? (
                                    <a 
                                      href={application.offer_letter_url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:underline text-sm"
                                    >
                                      View
                                    </a>
                                  ) : (
                                    <span className="text-gray-400 text-sm">None</span>
                                  )}
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
                    data={getJobsCSVData()} 
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
                        <Select value={jobStatusFilter} onValueChange={setJobStatusFilter}>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                            <SelectItem value="draft">Draft</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={`w-[180px] justify-start text-left font-normal ${
                                !jobDeadlineFilter && "text-muted-foreground"
                              }`}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {jobDeadlineFilter ? (
                                format(jobDeadlineFilter, "PPP")
                              ) : (
                                <span>Deadline</span>
                              )}
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
                              <div className="p-3 border-t">
                                <Button 
                                  variant="ghost" 
                                  onClick={() => setJobDeadlineFilter(undefined)}
                                  size="sm"
                                  className="w-full"
                                >
                                  Clear Date
                                </Button>
                              </div>
                            )}
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                    
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Job</TableHead>
                            <TableHead>Company</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Package</TableHead>
                            <TableHead>Applications</TableHead>
                            <TableHead>Deadline</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredJobs.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center py-6 text-gray-500">
                                No jobs found
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredJobs.map((job) => (
                              <TableRow key={job.id}>
                                <TableCell>
                                  <div className="font-medium">{job.title}</div>
                                </TableCell>
                                <TableCell>{job.company_name}</TableCell>
                                <TableCell>{job.location}</TableCell>
                                <TableCell>{job.package}</TableCell>
                                <TableCell>
                                  <Badge className="bg-blue-100 text-blue-800">
                                    {job.application_count}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {job.application_deadline 
                                    ? new Date(job.application_deadline).toLocaleDateString() 
                                    : 'N/A'
                                  }
                                </TableCell>
                                <TableCell>
                                  <Badge 
                                    className={
                                      job.status === 'active' ? 'bg-green-100 text-green-800' :
                                      job.status === 'closed' ? 'bg-red-100 text-red-800' :
                                      'bg-gray-100 text-gray-800'
                                    }
                                  >
                                    {job.status}
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
