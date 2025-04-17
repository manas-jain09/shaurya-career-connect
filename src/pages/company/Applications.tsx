
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
      
      // First, get all job IDs for this company
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
      
      // Now get all applications with expanded details
      const { data, error } = await supabase
        .from('job_applications')
        .select(`
          *,
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
          ),
          graduation_details:student_id (
            college_name,
            course,
            passing_year,
            marks,
            is_cgpa,
            cgpa_scale,
            has_backlog
          ),
          class_x_details:student_id (
            school_name,
            board,
            marks,
            is_cgpa,
            cgpa_scale,
            passing_year
          ),
          class_xii_details:student_id (
            school_name,
            board,
            marks,
            is_cgpa,
            cgpa_scale,
            passing_year
          ),
          resume:student_id (
            file_url
          )
        `)
        .in('job_id', jobIds)
        .order(sortField, { ascending: sortOrder === 'asc' });
        
      if (error) {
        console.error("Error fetching applications:", error);
        throw error;
      }
      
      console.log("Applications data retrieved:", data?.length || 0, data);
      
      // Process and sanitize the data to match our interface
      const sanitizedData: JobApplication[] = (data || []).map((item: any) => {
        console.log("Processing application item:", item.id);
        // Handle any potentially missing nested objects or error objects
        return {
          ...item,
          student_profile: item.student_profile || null,
          graduation_details: item.graduation_details && !item.graduation_details.error ? item.graduation_details : null,
          class_x_details: item.class_x_details && !item.class_x_details.error ? item.class_x_details : null,
          class_xii_details: item.class_xii_details && !item.class_xii_details.error ? item.class_xii_details : null,
          resume: item.resume && !item.resume.error ? item.resume : null
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

  const handleViewProfile = (application: JobApplication) => {
    setSelectedStudent(application);
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

        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold mb-3">Update Application Status</h3>
          <RadioGroup 
            value={selectedStudent.status} 
            onValueChange={(value) => {
              if (selectedStudent.id) {
                updateApplicationStatus(selectedStudent.id, value as JobApplicationStatus);
              }
            }}
            className="grid grid-cols-2 gap-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="applied" id="applied" />
              <Label htmlFor="applied">Applied</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="under_review" id="under_review" />
              <Label htmlFor="under_review">Under Review</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="shortlisted" id="shortlisted" />
              <Label htmlFor="shortlisted">Shortlisted</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="selected" id="selected" />
              <Label htmlFor="selected">Selected</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="rejected" id="rejected" />
              <Label htmlFor="rejected">Rejected</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="internship" id="internship" />
              <Label htmlFor="internship">Internship</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="ppo" id="ppo" />
              <Label htmlFor="ppo">PPO</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="placement" id="placement" />
              <Label htmlFor="placement">Placement</Label>
            </div>
          </RadioGroup>
        </div>
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
      
      // Update the selected student if it's the one being modified
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

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const handleSortFieldChange = (field: 'created_at' | 'status') => {
    if (sortField === field) {
      toggleSortOrder();
    } else {
      setSortField(field);
      setSortOrder('desc'); // Default to descending when changing field
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
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
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplications.map((application) => (
                  <TableRow key={application.id}>
                    <TableCell className="font-medium">
                      {application.student_profile?.first_name} {application.student_profile?.last_name}
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
                          <DialogContent className="max-w-4xl">
                            <DialogHeader>
                              <DialogTitle>
                                Student Profile: {selectedStudent?.student_profile?.first_name} {selectedStudent?.student_profile?.last_name}
                              </DialogTitle>
                            </DialogHeader>
                            {renderStudentDetails()}
                          </DialogContent>
                        </Dialog>
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-green-600 border-green-600 hover:bg-green-50"
                          onClick={() => application.id && updateApplicationStatus(application.id, 'selected')}
                        >
                          <Check size={16} />
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-red-600 border-red-600 hover:bg-red-50"
                          onClick={() => application.id && updateApplicationStatus(application.id, 'rejected')}
                        >
                          <X size={16} />
                        </Button>
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
