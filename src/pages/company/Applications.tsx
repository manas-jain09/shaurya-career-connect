import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import CompanyLayout from '@/components/layouts/CompanyLayout';
import { JobApplication, JobApplicationStatus, StudentProfile, GraduationDetails } from '@/types/database.types';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  Eye, 
  Download, 
  SortAsc,
  SortDesc,
  Check, 
  X 
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { OfferLetterUpload } from '@/components/company/OfferLetterUpload';

const Applications = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<JobApplication | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [sortField, setSortField] = useState<'created_at' | 'status'>('created_at');
  const [jobFilter, setJobFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<JobApplicationStatus | 'all'>('all');
  const [availableJobs, setAvailableJobs] = useState<{id: string, title: string}[]>([]);
  const [selectedApplications, setSelectedApplications] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  const fetchApplications = async () => {
    if (!user?.companyCode) {
      console.error("No company code found in user object:", user);
      toast.error('Authentication error. Please log in again.');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      console.log("Fetching jobs for company code:", user.companyCode);
      
      const { data: jobsData, error: jobsError } = await supabase
        .from('job_postings')
        .select('id, title')
        .eq('company_code', user.companyCode);
        
      if (jobsError) {
        console.error("Error fetching jobs:", jobsError);
        throw jobsError;
      }
      
      console.log("Jobs found for company:", jobsData?.length || 0, jobsData);
      
      if (!jobsData || jobsData.length === 0) {
        console.log("No jobs found for company code:", user.companyCode);
        setApplications([]);
        setAvailableJobs([]);
        setIsLoading(false);
        return;
      }
      
      setAvailableJobs(jobsData);
      
      const jobIds = jobsData.map(job => job.id);
      console.log("Job IDs to fetch applications for:", jobIds);
      
      const { data, error } = await supabase
        .from('job_applications')
        .select(`
          id, 
          job_id,
          student_id,
          status,
          admin_notes,
          created_at,
          updated_at,
          offer_letter_url,
          job:job_id (
            title,
            company_name,
            location,
            package
          ),
          student_profile:student_id (
            first_name,
            last_name,
            department,
            phone,
            is_verified
          )
        `)
        .in('job_id', jobIds)
        .order(sortField, { ascending: sortOrder === 'asc' });
        
      if (error) {
        console.error("Error fetching applications:", error);
        throw error;
      }
      
      console.log("Applications data retrieved:", data?.length || 0, data);
      
      const sanitizedData: JobApplication[] = (data || []).map((item: any) => {
        console.log("Processing application item:", item.id);
        return {
          ...item,
          student_profile: item.student_profile || null,
          job: item.job || null
        };
      });
      
      console.log("Sanitized applications data:", sanitizedData);
      setApplications(sanitizedData);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to load applications');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [user, sortField, sortOrder]);

  const handleViewProfile = async (application: JobApplication) => {
    try {
      const studentId = application.student_id;
      
      const { data: gradData, error: gradError } = await supabase
        .from('graduation_details')
        .select('*')
        .eq('student_id', studentId)
        .maybeSingle();
        
      const { data: classXData, error: classXError } = await supabase
        .from('class_x_details')
        .select('*')
        .eq('student_id', studentId)
        .maybeSingle();
        
      const { data: classXIIData, error: classXIIError } = await supabase
        .from('class_xii_details')
        .select('*')
        .eq('student_id', studentId)
        .maybeSingle();
        
      const { data: resumeData, error: resumeError } = await supabase
        .from('resumes')
        .select('*')
        .eq('student_id', studentId)
        .maybeSingle();
      
      const completeApplication: JobApplication = {
        ...application,
        graduation_details: gradError ? null : gradData,
        class_x_details: classXError ? null : classXData,
        class_xii_details: classXIIError ? null : classXIIData,
        resume: resumeError ? null : resumeData
      };
      
      setSelectedStudent(completeApplication);
    } catch (error) {
      console.error('Error fetching student details:', error);
      toast.error('Failed to load student details');
      setSelectedStudent(application);
    }
  };

  const renderStudentDetails = () => {
    if (!selectedStudent) return null;

    return (
      <div className="mt-4 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Personal Information</h3>
            <div className="space-y-2">
              <div>
                <span className="font-medium">Name: </span>
                <span>{selectedStudent.student_profile?.first_name} {selectedStudent.student_profile?.last_name}</span>
              </div>
              <div>
                <span className="font-medium">Department: </span>
                <span>{selectedStudent.student_profile?.department || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium">Phone: </span>
                <span>{selectedStudent.student_profile?.phone || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Class X Details</h3>
            <div className="space-y-2">
              <div>
                <span className="font-medium">School: </span>
                <span>{selectedStudent.class_x_details?.school_name || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium">Board: </span>
                <span>{selectedStudent.class_x_details?.board || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium">Marks: </span>
                <span>
                  {selectedStudent.class_x_details?.marks || 'N/A'}
                  {selectedStudent.class_x_details?.is_cgpa ? 
                    ` CGPA${selectedStudent.class_x_details?.cgpa_scale ? ` (out of ${selectedStudent.class_x_details.cgpa_scale})` : ''}` : 
                    '%'
                  }
                </span>
              </div>
              <div>
                <span className="font-medium">Passing Year: </span>
                <span>{selectedStudent.class_x_details?.passing_year || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Class XII Details</h3>
            <div className="space-y-2">
              <div>
                <span className="font-medium">School: </span>
                <span>{selectedStudent.class_xii_details?.school_name || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium">Board: </span>
                <span>{selectedStudent.class_xii_details?.board || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium">Marks: </span>
                <span>
                  {selectedStudent.class_xii_details?.marks || 'N/A'}
                  {selectedStudent.class_xii_details?.is_cgpa ? 
                    ` CGPA${selectedStudent.class_xii_details?.cgpa_scale ? ` (out of ${selectedStudent.class_xii_details.cgpa_scale})` : ''}` : 
                    '%'
                  }
                </span>
              </div>
              <div>
                <span className="font-medium">Passing Year: </span>
                <span>{selectedStudent.class_xii_details?.passing_year || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Graduation Details</h3>
            <div className="space-y-2">
              <div>
                <span className="font-medium">College: </span>
                <span>{selectedStudent.graduation_details?.college_name || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium">Course: </span>
                <span>{selectedStudent.graduation_details?.course || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium">Marks: </span>
                <span>
                  {selectedStudent.graduation_details?.marks || 'N/A'}
                  {selectedStudent.graduation_details?.is_cgpa ? 
                    ` CGPA${selectedStudent.graduation_details?.cgpa_scale ? ` (out of ${selectedStudent.graduation_details.cgpa_scale})` : ''}` : 
                    '%'
                  }
                </span>
              </div>
              <div>
                <span className="font-medium">Passing Year: </span>
                <span>{selectedStudent.graduation_details?.passing_year || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium">Backlog: </span>
                <span>{selectedStudent.graduation_details?.has_backlog ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>
        </div>

        {selectedStudent.resume?.file_url && (
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-2">Resume</h3>
            <Button 
              variant="outline" 
              onClick={() => window.open(selectedStudent.resume?.file_url, '_blank')}
            >
              <Download size={16} className="mr-2" /> Download Resume
            </Button>
          </div>
        )}
      </div>
    );
  };

  const updateApplicationStatus = async (applicationId: string, newStatus: JobApplicationStatus) => {
    try {
      const { error } = await supabase
        .from('job_applications')
        .update({ status: newStatus })
        .eq('id', applicationId);
        
      if (error) throw error;
      
      setApplications(prev => 
        prev.map(app => 
          app.id === applicationId ? { ...app, status: newStatus } : app
        )
      );
      
      if (selectedStudent && selectedStudent.id === applicationId) {
        setSelectedStudent({
          ...selectedStudent,
          status: newStatus
        });
      }
      
      toast.success('Application status updated successfully');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update application status');
    }
  };

  const getStatusBadgeClass = (status: JobApplicationStatus) => {
    switch (status) {
      case 'applied':
        return 'bg-blue-100 text-blue-800';
      case 'under_review':
        return 'bg-yellow-100 text-yellow-800';
      case 'shortlisted':
        return 'bg-indigo-100 text-indigo-800';
      case 'selected':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'internship':
        return 'bg-purple-100 text-purple-800';
      case 'ppo':
        return 'bg-teal-100 text-teal-800';
      case 'placement':
        return 'bg-emerald-100 text-emerald-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusDisplay = (status: JobApplicationStatus) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getStatusIcon = (status: JobApplicationStatus) => {
    switch (status) {
      case 'selected':
      case 'internship':
      case 'ppo':
      case 'placement':
        return <Check className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <X className="h-4 w-4 text-red-600" />;
      case 'shortlisted':
        return <Check className="h-4 w-4 text-blue-600" />;
      default:
        return null;
    }
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const handleSortFieldChange = (field: 'created_at' | 'status') => {
    if (sortField === field) {
      toggleSortOrder();
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const filteredApplications = applications.filter(app => {
    const studentName = `${app.student_profile?.first_name || ''} ${app.student_profile?.last_name || ''}`;
    const searchMatch = 
      studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app.job?.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app.student_profile?.department || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const jobMatch = jobFilter === 'all' || app.job_id === jobFilter;
    
    const statusMatch = statusFilter === 'all' || app.status === statusFilter;
    
    return searchMatch && jobMatch && statusMatch;
  });

  const toggleApplicationSelection = (id: string) => {
    setSelectedApplications(prev => 
      prev.includes(id) 
        ? prev.filter(appId => appId !== id)
        : [...prev, id]
    );
  };

  const handleBulkResumeDownload = () => {
    const selectedAppsWithResumes = filteredApplications
      .filter(app => 
        selectedApplications.includes(app.id as string) && 
        app.resume?.file_url
      );

    if (selectedAppsWithResumes.length === 0) {
      toast.info('No resumes available for selected applications');
      return;
    }

    selectedAppsWithResumes.forEach(app => {
      if (app.resume?.file_url) {
        window.open(app.resume.file_url, '_blank');
      }
    });
  };

  useEffect(() => {
    if (selectAll) {
      const allIds = filteredApplications.map(app => app.id as string);
      setSelectedApplications(allIds);
    } else {
      setSelectedApplications([]);
    }
  }, [selectAll, filteredApplications]);

  const handleOfferLetterUpload = async (applicationId: string, url: string) => {
    setApplications(prev => 
      prev.map(app => 
        app.id === applicationId ? { ...app, offer_letter_url: url } : app
      )
    );
  };

  return (
    <CompanyLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Applications</h1>
        <Button onClick={fetchApplications} variant="outline">
          Refresh Data
        </Button>
      </div>

      <div className="bg-white rounded-lg p-6 shadow mb-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Search by candidate name, job title, or department"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={jobFilter} onValueChange={setJobFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter size={16} className="mr-2" />
                <SelectValue placeholder="Filter by job" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Jobs</SelectItem>
                {availableJobs.map(job => (
                  <SelectItem key={job.id} value={job.id}>{job.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select 
              value={statusFilter as string} 
              onValueChange={(value) => setStatusFilter(value as JobApplicationStatus | 'all')}
            >
              <SelectTrigger className="w-[180px]">
                <Filter size={16} className="mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="applied">Applied</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="shortlisted">Shortlisted</SelectItem>
                <SelectItem value="selected">Selected</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="internship">Internship</SelectItem>
                <SelectItem value="ppo">PPO</SelectItem>
                <SelectItem value="placement">Placement</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center my-12">
            <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500">No applications found matching your filters.</p>
            <p className="text-sm text-gray-400 mt-2">
              {applications.length === 0 ? 
                "There are no applications for your company's job postings yet." : 
                "Try adjusting your search or filter criteria."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="flex items-center mb-4">
              {selectedApplications.length > 0 && (
                <Button 
                  variant="outline" 
                  className="mr-2"
                  onClick={handleBulkResumeDownload}
                >
                  <Download size={16} className="mr-2" />
                  Download {selectedApplications.length} Resumes
                </Button>
              )}
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox 
                      checked={selectAll} 
                      onCheckedChange={() => setSelectAll(!selectAll)}
                      aria-label="Select all applications"
                    />
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center cursor-pointer" onClick={() => handleSortFieldChange('created_at')}>
                      Applied Date
                      {sortField === 'created_at' && (
                        sortOrder === 'asc' ? <SortAsc size={16} className="ml-1" /> : <SortDesc size={16} className="ml-1" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Job Position</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>
                    <div className="flex items-center cursor-pointer" onClick={() => handleSortFieldChange('status')}>
                      Status
                      {sortField === 'status' && (
                        sortOrder === 'asc' ? <SortAsc size={16} className="ml-1" /> : <SortDesc size={16} className="ml-1" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Resume</TableHead>
                  <TableHead>Offer Letter</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplications.map((application) => (
                  <TableRow key={application.id}>
                    <TableCell>
                      <Checkbox 
                        checked={selectedApplications.includes(application.id as string)}
                        onCheckedChange={() => toggleApplicationSelection(application.id as string)}
                        aria-label={`Select application for ${application.student_profile?.first_name}`}
                      />
                    </TableCell>
                    <TableCell>
                      {application.created_at ? new Date(application.created_at).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell>{application.job?.title}</TableCell>
                    <TableCell>{application.student_profile?.department || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeClass(application.status)}>
                        {getStatusDisplay(application.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {application.resume?.file_url ? (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(application.resume?.file_url, '_blank')}
                        >
                          <Download size={16} className="mr-2" />
                          Resume
                        </Button>
                      ) : (
                        <span className="text-gray-400 text-sm">No resume</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <OfferLetterUpload 
                        applicationId={application.id as string}
                        currentUrl={application.offer_letter_url}
                        onUploadComplete={(url) => handleOfferLetterUpload(application.id as string, url)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleViewProfile(application)}
                            >
                              <Eye size={16} className="mr-1" /> View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-h-[80vh]">
                            <DialogHeader>
                              <DialogTitle>
                                Student Profile: {selectedStudent?.student_profile?.first_name} {selectedStudent?.student_profile?.last_name}
                              </DialogTitle>
                            </DialogHeader>
                            <ScrollArea className="max-h-[calc(80vh-8rem)]">
                              {selectedStudent && (
                                <div className="space-y-6 p-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                      <h3 className="text-lg font-semibold mb-2">Personal Information</h3>
                                      <div className="space-y-2">
                                        <div>
                                          <span className="font-medium">Name: </span>
                                          <span>{selectedStudent.student_profile?.first_name} {selectedStudent.student_profile?.last_name}</span>
                                        </div>
                                        <div>
                                          <span className="font-medium">Department: </span>
                                          <span>{selectedStudent.student_profile?.department || 'N/A'}</span>
                                        </div>
                                        <div>
                                          <span className="font-medium">Phone: </span>
                                          <span>{selectedStudent.student_profile?.phone || 'N/A'}</span>
                                        </div>
                                      </div>
                                    </div>

                                    <div>
                                      <h3 className="text-lg font-semibold mb-2">Class X Details</h3>
                                      <div className="space-y-2">
                                        <div>
                                          <span className="font-medium">School: </span>
                                          <span>{selectedStudent.class_x_details?.school_name || 'N/A'}</span>
                                        </div>
                                        <div>
                                          <span className="font-medium">Board: </span>
                                          <span>{selectedStudent.class_x_details?.board || 'N/A'}</span>
                                        </div>
                                        <div>
                                          <span className="font-medium">Marks: </span>
                                          <span>
                                            {selectedStudent.class_x_details?.marks || 'N/A'}
                                            {selectedStudent.class_x_details?.is_cgpa ? 
                                              ` CGPA${selectedStudent.class_x_details?.cgpa_scale ? ` (out of ${selectedStudent.class_x_details.cgpa_scale})` : ''}` : 
                                              '%'
                                            }
                                          </span>
                                        </div>
                                        <div>
                                          <span className="font-medium">Passing Year: </span>
                                          <span>{selectedStudent.class_x_details?.passing_year || 'N/A'}</span>
                                        </div>
                                      </div>
                                    </div>

                                    <div>
                                      <h3 className="text-lg font-semibold mb-2">Class XII Details</h3>
                                      <div className="space-y-2">
                                        <div>
                                          <span className="font-medium">School: </span>
                                          <span>{selectedStudent.class_xii_details?.school_name || 'N/A'}</span>
                                        </div>
                                        <div>
                                          <span className="font-medium">Board: </span>
                                          <span>{selectedStudent.class_xii_details?.board || 'N/A'}</span>
                                        </div>
                                        <div>
                                          <span className="font-medium">Marks: </span>
                                          <span>
                                            {selectedStudent.class_xii_details?.marks || 'N/A'}
                                            {selectedStudent.class_xii_details?.is_cgpa ? 
                                              ` CGPA${selectedStudent.class_xii_details?.cgpa_scale ? ` (out of ${selectedStudent.class_xii_details.cgpa_scale})` : ''}` : 
                                              '%'
                                            }
                                          </span>
                                        </div>
                                        <div>
                                          <span className="font-medium">Passing Year: </span>
                                          <span>{selectedStudent.class_xii_details?.passing_year || 'N/A'}</span>
                                        </div>
                                      </div>
                                    </div>

                                    <div>
                                      <h3 className="text-lg font-semibold mb-2">Graduation Details</h3>
                                      <div className="space-y-2">
                                        <div>
                                          <span className="font-medium">College: </span>
                                          <span>{selectedStudent.graduation_details?.college_name || 'N/A'}</span>
                                        </div>
                                        <div>
                                          <span className="font-medium">Course: </span>
                                          <span>{selectedStudent.graduation_details?.course || 'N/A'}</span>
                                        </div>
                                        <div>
                                          <span className="font-medium">Marks: </span>
                                          <span>
                                            {selectedStudent.graduation_details?.marks || 'N/A'}
                                            {selectedStudent.graduation_details?.is_cgpa ? 
                                              ` CGPA${selectedStudent.graduation_details?.cgpa_scale ? ` (out of ${selectedStudent.graduation_details.cgpa_scale})` : ''}` : 
                                              '%'
                                            }
                                          </span>
                                        </div>
                                        <div>
                                          <span className="font-medium">Passing Year: </span>
                                          <span>{selectedStudent.graduation_details?.passing_year || 'N/A'}</span>
                                        </div>
                                        <div>
                                          <span className="font-medium">Backlog: </span>
                                          <span>{selectedStudent.graduation_details?.has_backlog ? 'Yes' : 'No'}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </ScrollArea>
                          </DialogContent>
                        </Dialog>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              Update Status
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              onClick={() => application.id && updateApplicationStatus(application.id, 'applied')}
                            >
                              <span>Applied</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => application.id && updateApplicationStatus(application.id, 'under_review')}
                            >
                              <span>Under Review</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => application.id && updateApplicationStatus(application.id, 'shortlisted')}
                            >
                              <span>Shortlisted</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => application.id && updateApplicationStatus(application.id, 'selected')}
                              className="text-green-600"
                            >
                              <Check className="mr-2 h-4 w-4" />
                              <span>Selected</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => application.id && updateApplicationStatus(application.id, 'internship')}
                              className="text-green-600"
                            >
                              <Check className="mr-2 h-4 w-4" />
                              <span>Internship</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => application.id && updateApplicationStatus(application.id, 'ppo')}
                              className="text-green-600"
                            >
                              <Check className="mr-2 h-4 w-4" />
                              <span>PPO</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => application.id && updateApplicationStatus(application.id, 'placement')}
                              className="text-green-600"
                            >
                              <Check className="mr-2 h-4 w-4" />
                              <span>Placement</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => application.id && updateApplicationStatus(application.id, 'rejected')}
                              className="text-red-600"
                            >
                              <X className="mr-2 h-4 w-4" />
                              <span>Rejected</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </CompanyLayout>
  );
};

export default Applications;
