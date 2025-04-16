
import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Download,
  Search,
  Users,
  Briefcase,
  FileText
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

const Reports = () => {
  // Data tables
  const [students, setStudents] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  
  // Filters
  const [studentFilter, setStudentFilter] = useState({
    search: '',
    gender: '',
    verificationStatus: '',
    placementInterest: '',
    yearOfPassing: ''
  });
  
  const [applicationFilter, setApplicationFilter] = useState({
    search: '',
    status: '',
    company: '',
    dateFrom: '',
    dateTo: '',
    course: '',
    division: '',
    graduationYear: '',
    department: ''
  });
  
  const [jobFilter, setJobFilter] = useState({
    search: '',
    status: '',
    company: '',
    location: ''
  });
  
  const [yearOptions, setYearOptions] = useState<number[]>([]);
  const [companyOptions, setCompanyOptions] = useState<string[]>([]);
  const [locationOptions, setLocationOptions] = useState<string[]>([]);
  const [courseOptions, setCourseOptions] = useState<string[]>([]);
  const [divisionOptions, setDivisionOptions] = useState<string[]>([]);
  const [departmentOptions, setDepartmentOptions] = useState<string[]>([]);
  
  const { toast } = useToast();

  useEffect(() => {
    fetchStudents();
    fetchApplications();
    fetchJobs();
    fetchFilterOptions();
  }, []);

  const fetchFilterOptions = async () => {
    try {
      // Get unique years of passing
      const { data: gradData, error: gradError } = await supabase
        .from('graduation_details')
        .select('passing_year, course, division');
      
      if (!gradError && gradData) {
        // Years
        const years = [...new Set(gradData.map(item => item.passing_year))];
        setYearOptions(years.sort((a, b) => b - a));
        
        // Courses
        const courses = [...new Set(gradData.map(item => item.course))];
        setCourseOptions(courses.sort());
        
        // Divisions
        const divisions = [...new Set(gradData.filter(item => item.division).map(item => item.division))];
        setDivisionOptions(divisions.sort());
        
        // Departments (derived from course)
        const departments = [...new Set(gradData.map(item => {
          const course = item.course || '';
          // Extract department from course (e.g., "B.Tech Computer Science" -> "Computer Science")
          const match = course.match(/(?:B\.Tech|B\.E|M\.Tech|M\.E|BCA|MCA|B\.Sc|M\.Sc|BBA|MBA)\s+(.*)/i);
          return match ? match[1] : course;
        }))];
        setDepartmentOptions(departments.filter(d => d).sort());
      }
      
      // Get unique companies
      const { data: jobData, error: jobError } = await supabase
        .from('job_postings')
        .select('company_name, location');
      
      if (!jobError && jobData) {
        const companies = [...new Set(jobData.map(item => item.company_name))];
        setCompanyOptions(companies.sort());
        
        const locations = [...new Set(jobData.map(item => item.location))];
        setLocationOptions(locations.sort());
      }
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('student_profiles')
        .select(`
          *,
          graduation_details(course, passing_year, division)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({
        title: 'Error',
        description: 'Failed to load students data',
        variant: 'destructive',
      });
    }
  };
  
  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('job_applications')
        .select(`
          *,
          job:job_id(title, company_name, location, package),
          student_profile:student_id(
            first_name, 
            last_name, 
            phone,
            graduation_details(course, passing_year, division)
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast({
        title: 'Error',
        description: 'Failed to load applications data',
        variant: 'destructive',
      });
    }
  };
  
  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('job_postings')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setJobs(data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load jobs data',
        variant: 'destructive',
      });
    }
  };

  const exportStudentsData = () => {
    const filteredStudents = applyStudentFilters();
    if (filteredStudents.length === 0) {
      toast({
        title: "No Data",
        description: "There are no students to export",
        variant: "destructive"
      });
      return;
    }
    
    // CSV Headers
    let csvContent = "Name,Gender,Phone,Placement Interest,Verification Status,Course,Passing Year,Registration Date\n";
    
    // Add rows
    filteredStudents.forEach(student => {
      const name = `${student.first_name} ${student.last_name}`;
      const verificationStatus = student.is_verified ? "Verified" : student.verification_status;
      const registrationDate = student.created_at ? format(new Date(student.created_at), 'yyyy-MM-dd') : "N/A";
      const course = student.graduation_details?.[0]?.course || "N/A";
      const passingYear = student.graduation_details?.[0]?.passing_year || "N/A";
      
      csvContent += `"${name}","${student.gender}","${student.phone}","${student.placement_interest || 'N/A'}","${verificationStatus}","${course}","${passingYear}","${registrationDate}"\n`;
    });
    
    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "students_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const exportApplicationsData = () => {
    const filteredApplications = applyApplicationFilters();
    if (filteredApplications.length === 0) {
      toast({
        title: "No Data",
        description: "There are no applications to export",
        variant: "destructive"
      });
      return;
    }
    
    // CSV Headers
    let csvContent = "Student Name,Job Title,Company,Location,Package,Status,Course,Division,Graduation Year,Applied Date,Notes\n";
    
    // Add rows
    filteredApplications.forEach(app => {
      const studentName = `${app.student_profile?.first_name || ''} ${app.student_profile?.last_name || ''}`;
      const jobTitle = app.job?.title || 'N/A';
      const company = app.job?.company_name || 'N/A';
      const location = app.job?.location || 'N/A';
      const packageInfo = app.job?.package || 'N/A';
      let status = app.status.replace(/_/g, ' ');
      if (status === 'internship plus ppo') status = 'Internship + PPO';
      
      const appliedDate = app.created_at ? format(new Date(app.created_at), 'yyyy-MM-dd') : "N/A";
      const course = app.student_profile?.graduation_details?.[0]?.course || 'N/A';
      const division = app.student_profile?.graduation_details?.[0]?.division || 'N/A';
      const graduationYear = app.student_profile?.graduation_details?.[0]?.passing_year || 'N/A';
      
      csvContent += `"${studentName}","${jobTitle}","${company}","${location}","${packageInfo}","${status}","${course}","${division}","${graduationYear}","${appliedDate}","${app.admin_notes || ''}"\n`;
    });
    
    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "applications_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const exportJobsData = () => {
    const filteredJobs = applyJobFilters();
    if (filteredJobs.length === 0) {
      toast({
        title: "No Data",
        description: "There are no jobs to export",
        variant: "destructive"
      });
      return;
    }
    
    // CSV Headers
    let csvContent = "Title,Company,Location,Package,Deadline,Status,Posted Date\n";
    
    // Add rows
    filteredJobs.forEach(job => {
      const postedDate = job.created_at ? format(new Date(job.created_at), 'yyyy-MM-dd') : "N/A";
      const deadline = job.application_deadline ? format(new Date(job.application_deadline), 'yyyy-MM-dd') : "N/A";
      
      csvContent += `"${job.title}","${job.company_name}","${job.location}","${job.package}","${deadline}","${job.status}","${postedDate}"\n`;
    });
    
    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "jobs_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const applyStudentFilters = () => {
    return students.filter(student => {
      // Search filter
      if (studentFilter.search) {
        const searchTerm = studentFilter.search.toLowerCase();
        const fullName = `${student.first_name} ${student.last_name}`.toLowerCase();
        
        if (!fullName.includes(searchTerm) && !student.phone.toLowerCase().includes(searchTerm)) {
          return false;
        }
      }
      
      // Gender filter
      if (studentFilter.gender && studentFilter.gender !== 'all' && student.gender !== studentFilter.gender) {
        return false;
      }
      
      // Verification status filter
      if (studentFilter.verificationStatus && studentFilter.verificationStatus !== 'all') {
        if (studentFilter.verificationStatus === 'verified' && !student.is_verified) {
          return false;
        } else if (studentFilter.verificationStatus === 'unverified' && student.is_verified) {
          return false;
        } else if (studentFilter.verificationStatus === 'pending' && 
                   (student.is_verified || student.verification_status !== 'pending')) {
          return false;
        }
      }
      
      // Placement interest filter
      if (studentFilter.placementInterest && studentFilter.placementInterest !== 'all' && student.placement_interest !== studentFilter.placementInterest) {
        return false;
      }
      
      // Year of passing filter
      if (studentFilter.yearOfPassing && studentFilter.yearOfPassing !== 'all' && student.graduation_details && student.graduation_details.length > 0) {
        const passingYear = student.graduation_details[0].passing_year.toString();
        if (passingYear !== studentFilter.yearOfPassing) {
          return false;
        }
      }
      
      return true;
    });
  };
  
  const applyApplicationFilters = () => {
    return applications.filter(app => {
      // Search filter
      if (applicationFilter.search) {
        const searchTerm = applicationFilter.search.toLowerCase();
        const studentName = `${app.student_profile?.first_name || ''} ${app.student_profile?.last_name || ''}`.toLowerCase();
        const jobTitle = (app.job?.title || '').toLowerCase();
        const company = (app.job?.company_name || '').toLowerCase();
        
        if (!studentName.includes(searchTerm) && !jobTitle.includes(searchTerm) && !company.includes(searchTerm)) {
          return false;
        }
      }
      
      // Status filter
      if (applicationFilter.status && applicationFilter.status !== 'all' && app.status !== applicationFilter.status) {
        return false;
      }
      
      // Company filter
      if (applicationFilter.company && applicationFilter.company !== 'all' && app.job?.company_name !== applicationFilter.company) {
        return false;
      }
      
      // New filters
      // Course filter
      if (applicationFilter.course && applicationFilter.course !== 'all') {
        const studentCourse = app.student_profile?.graduation_details?.[0]?.course;
        if (studentCourse !== applicationFilter.course) {
          return false;
        }
      }
      
      // Division filter
      if (applicationFilter.division && applicationFilter.division !== 'all') {
        const studentDivision = app.student_profile?.graduation_details?.[0]?.division;
        if (studentDivision !== applicationFilter.division) {
          return false;
        }
      }
      
      // Graduation Year filter
      if (applicationFilter.graduationYear && applicationFilter.graduationYear !== 'all') {
        const gradYear = app.student_profile?.graduation_details?.[0]?.passing_year?.toString();
        if (gradYear !== applicationFilter.graduationYear) {
          return false;
        }
      }
      
      // Department filter (derived from course)
      if (applicationFilter.department && applicationFilter.department !== 'all') {
        const course = app.student_profile?.graduation_details?.[0]?.course || '';
        const match = course.match(/(?:B\.Tech|B\.E|M\.Tech|M\.E|BCA|MCA|B\.Sc|M\.Sc|BBA|MBA)\s+(.*)/i);
        const department = match ? match[1] : course;
        
        if (department !== applicationFilter.department) {
          return false;
        }
      }
      
      // Date range filter
      if (applicationFilter.dateFrom || applicationFilter.dateTo) {
        const appDate = new Date(app.created_at || '');
        
        if (applicationFilter.dateFrom) {
          const fromDate = new Date(applicationFilter.dateFrom);
          if (appDate < fromDate) return false;
        }
        
        if (applicationFilter.dateTo) {
          const toDate = new Date(applicationFilter.dateTo);
          toDate.setHours(23, 59, 59);
          if (appDate > toDate) return false;
        }
      }
      
      return true;
    });
  };
  
  const applyJobFilters = () => {
    return jobs.filter(job => {
      // Search filter
      if (jobFilter.search) {
        const searchTerm = jobFilter.search.toLowerCase();
        const title = job.title.toLowerCase();
        const company = job.company_name.toLowerCase();
        
        if (!title.includes(searchTerm) && !company.includes(searchTerm)) {
          return false;
        }
      }
      
      // Status filter
      if (jobFilter.status && jobFilter.status !== 'all' && job.status !== jobFilter.status) {
        return false;
      }
      
      // Company filter
      if (jobFilter.company && jobFilter.company !== 'all' && job.company_name !== jobFilter.company) {
        return false;
      }
      
      // Location filter
      if (jobFilter.location && jobFilter.location !== 'all' && job.location !== jobFilter.location) {
        return false;
      }
      
      return true;
    });
  };
  
  const handleStudentFilterChange = (field: string, value: string) => {
    setStudentFilter(prev => ({ ...prev, [field]: value }));
  };
  
  const handleApplicationFilterChange = (field: string, value: string) => {
    setApplicationFilter(prev => ({ ...prev, [field]: value }));
  };
  
  const handleJobFilterChange = (field: string, value: string) => {
    setJobFilter(prev => ({ ...prev, [field]: value }));
  };
  
  const resetStudentFilters = () => {
    setStudentFilter({
      search: '',
      gender: '',
      verificationStatus: '',
      placementInterest: '',
      yearOfPassing: ''
    });
  };
  
  const resetApplicationFilters = () => {
    setApplicationFilter({
      search: '',
      status: '',
      company: '',
      dateFrom: '',
      dateTo: '',
      course: '',
      division: '',
      graduationYear: '',
      department: ''
    });
  };
  
  const resetJobFilters = () => {
    setJobFilter({
      search: '',
      status: '',
      company: '',
      location: ''
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Placement Reports</h1>
          <p className="text-gray-600">Analytics and statistics of placement activities</p>
        </div>

        <Tabs defaultValue="students">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="students" className="flex items-center">
              <Users size={16} className="mr-2" /> Students
            </TabsTrigger>
            <TabsTrigger value="applications" className="flex items-center">
              <FileText size={16} className="mr-2" /> Applications
            </TabsTrigger>
            <TabsTrigger value="jobs" className="flex items-center">
              <Briefcase size={16} className="mr-2" /> Jobs
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="students" className="mt-6 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Students Report</CardTitle>
                <Button variant="outline" size="sm" onClick={exportStudentsData}>
                  <Download size={16} className="mr-2" /> Export CSV
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      <Input
                        placeholder="Search students..."
                        className="pl-10"
                        value={studentFilter.search}
                        onChange={(e) => handleStudentFilterChange('search', e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Select
                        value={studentFilter.gender}
                        onValueChange={(value) => handleStudentFilterChange('gender', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Genders</SelectItem>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Select
                        value={studentFilter.verificationStatus}
                        onValueChange={(value) => handleStudentFilterChange('verificationStatus', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Verification Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="verified">Verified</SelectItem>
                          <SelectItem value="unverified">Unverified</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Select
                        value={studentFilter.placementInterest}
                        onValueChange={(value) => handleStudentFilterChange('placementInterest', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Placement Interest" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Interests</SelectItem>
                          <SelectItem value="placement/internship">Placement/Internship</SelectItem>
                          <SelectItem value="higher_studies">Higher Studies</SelectItem>
                          <SelectItem value="family_business">Family Business</SelectItem>
                          <SelectItem value="entrepreneurship">Entrepreneurship</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Select
                        value={studentFilter.yearOfPassing}
                        onValueChange={(value) => handleStudentFilterChange('yearOfPassing', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Year of Passing" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Years</SelectItem>
                          {yearOptions.map(year => (
                            <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button variant="outline" onClick={resetStudentFilters}>
                      Reset Filters
                    </Button>
                  </div>
                  
                  {/* Student table */}
                  <div className="overflow-x-auto rounded-lg border">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gender</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Verification</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Placement Interest</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registered On</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {applyStudentFilters().length > 0 ? (
                          applyStudentFilters().map((student, index) => (
                            <tr key={index} className={student.is_blocked ? "bg-red-50" : ""}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {student.first_name} {student.last_name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap capitalize">
                                {student.gender}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {student.phone}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {student.is_verified ? "Verified" : student.verification_status}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {student.placement_interest || 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {student.graduation_details?.[0]?.course || 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {student.graduation_details?.[0]?.passing_year || 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {student.created_at ? format(new Date(student.created_at), 'yyyy-MM-dd') : 'N/A'}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                              No students match the selected filters
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="applications" className="mt-6 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Applications Report</CardTitle>
                <Button variant="outline" size="sm" onClick={exportApplicationsData}>
                  <Download size={16} className="mr-2" /> Export CSV
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-col gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      <Input
                        placeholder="Search applications..."
                        className="pl-10"
                        value={applicationFilter.search}
                        onChange={(e) => handleApplicationFilterChange('search', e.target.value)}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Select
                        value={applicationFilter.status}
                        onValueChange={(value) => handleApplicationFilterChange('status', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="applied">Applied</SelectItem>
                          <SelectItem value="under_review">Under Review</SelectItem>
                          <SelectItem value="shortlisted">Shortlisted</SelectItem>
                          <SelectItem value="selected">Selected</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                          <SelectItem value="internship_plus_ppo">Internship + PPO</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Select
                        value={applicationFilter.company}
                        onValueChange={(value) => handleApplicationFilterChange('company', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Company" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Companies</SelectItem>
                          {companyOptions.map(company => (
                            <SelectItem key={company} value={company || "unknown"}>{company || "Unknown"}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <div className="flex flex-col space-y-1">
                        <Label htmlFor="dateFrom" className="text-xs">From Date</Label>
                        <Input
                          id="dateFrom"
                          type="date"
                          value={applicationFilter.dateFrom}
                          onChange={(e) => handleApplicationFilterChange('dateFrom', e.target.value)}
                        />
                      </div>
                      
                      <div className="flex flex-col space-y-1">
                        <Label htmlFor="dateTo" className="text-xs">To Date</Label>
                        <Input
                          id="dateTo"
                          type="date"
                          value={applicationFilter.dateTo}
                          onChange={(e) => handleApplicationFilterChange('dateTo', e.target.value)}
                        />
                      </div>
                    </div>
                    
                    {/* New filters for Course, Division, Graduation Year, Department */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Select
                        value={applicationFilter.course}
                        onValueChange={(value) => handleApplicationFilterChange('course', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Course" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Courses</SelectItem>
                          {courseOptions.map(course => (
                            <SelectItem key={course} value={course || "unknown"}>{course || "Unknown"}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <Select
                        value={applicationFilter.division}
                        onValueChange={(value) => handleApplicationFilterChange('division', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Division" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Divisions</SelectItem>
                          {divisionOptions.map(division => (
                            <SelectItem key={division} value={division || "unknown"}>{division || "Unknown"}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <Select
                        value={applicationFilter.graduationYear}
                        onValueChange={(value) => handleApplicationFilterChange('graduationYear', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Graduation Year" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Years</SelectItem>
                          {yearOptions.map(year => (
                            <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <Select
                        value={applicationFilter.department}
                        onValueChange={(value) => handleApplicationFilterChange('department', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Departments</SelectItem>
                          {departmentOptions.map(dept => (
                            <SelectItem key={dept} value={dept || "unknown"}>{dept || "Unknown"}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button variant="outline" onClick={resetApplicationFilters}>
                        Reset Filters
                      </Button>
                    </div>
                  </div>
                  
                  {/* Applications table */}
                  <div className="overflow-x-auto rounded-lg border">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Division</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Graduation Year</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied On</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Offer Letter</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {applyApplicationFilters().length > 0 ? (
                          applyApplicationFilters().map((app, index) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {app.student_profile?.first_name} {app.student_profile?.last_name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {app.job?.title}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {app.job?.company_name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {app.student_profile?.graduation_details?.[0]?.course || 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {app.student_profile?.graduation_details?.[0]?.division || 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {app.student_profile?.graduation_details?.[0]?.passing_year || 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {app.status === 'internship_plus_ppo' ? 'Internship + PPO' : app.status.replace(/_/g, ' ')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {app.created_at ? format(new Date(app.created_at), 'yyyy-MM-dd') : 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {app.offer_letter_url ? (
                                  <a 
                                    href={app.offer_letter_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800"
                                  >
                                    Download
                                  </a>
                                ) : 'N/A'}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={9} className="px-6 py-4 text-center text-gray-500">
                              No applications match the selected filters
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="jobs" className="mt-6 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Jobs Report</CardTitle>
                <Button variant="outline" size="sm" onClick={exportJobsData}>
                  <Download size={16} className="mr-2" /> Export CSV
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      <Input
                        placeholder="Search jobs..."
                        className="pl-10"
                        value={jobFilter.search}
                        onChange={(e) => handleJobFilterChange('search', e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Select
                        value={jobFilter.status}
                        onValueChange={(value) => handleJobFilterChange('status', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                          <SelectItem value="draft">Draft</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Select
                        value={jobFilter.company}
                        onValueChange={(value) => handleJobFilterChange('company', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Company" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Companies</SelectItem>
                          {companyOptions.map(company => (
                            <SelectItem key={company} value={company || "unknown"}>{company || "Unknown"}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <Select
                        value={jobFilter.location}
                        onValueChange={(value) => handleJobFilterChange('location', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Location" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Locations</SelectItem>
                          {locationOptions.map(location => (
                            <SelectItem key={location} value={location || "unknown"}>{location || "Unknown"}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button variant="outline" onClick={resetJobFilters}>
                      Reset Filters
                    </Button>
                  </div>
                  
                  {/* Jobs table */}
                  <div className="overflow-x-auto rounded-lg border">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Package</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deadline</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Posted On</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {applyJobFilters().length > 0 ? (
                          applyJobFilters().map((job, index) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {job.title}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {job.company_name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {job.location}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {job.package}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {job.application_deadline ? format(new Date(job.application_deadline), 'yyyy-MM-dd') : 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap capitalize">
                                {job.status}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {job.created_at ? format(new Date(job.created_at), 'yyyy-MM-dd') : 'N/A'}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                              No jobs match the selected filters
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default Reports;
