import React, { useState, useEffect } from 'react';
import CompanyLayout from '@/components/layouts/CompanyLayout';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { 
  Search, 
  Filter, 
  Eye, 
  ArrowUpDown, 
  FileText,
  Calendar,
  Briefcase
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { JobApplication, JobApplicationStatus } from '@/types/database.types';

interface ExtendedJobApplication extends JobApplication {
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

const Applications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [applications, setApplications] = useState<ExtendedJobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterJob, setFilterJob] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortField, setSortField] = useState<string>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [jobs, setJobs] = useState<{ id: string, title: string }[]>([]);
  const [currentApplication, setCurrentApplication] = useState<ExtendedJobApplication | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState<JobApplicationStatus>('applied');
  const [statusNote, setStatusNote] = useState('');

  useEffect(() => {
    fetchJobsAndApplications();
  }, [user, sortField, sortDirection, filterJob, filterStatus]);

  const fetchJobsAndApplications = async () => {
    if (!user?.companyCode) return;
    
    setLoading(true);
    try {
      const { data: jobsData, error: jobsError } = await supabase
        .from('job_postings')
        .select('id, title')
        .eq('company_code', user.companyCode);

      if (jobsError) throw jobsError;
      setJobs(jobsData || []);

      const jobIds = jobsData?.map(job => job.id) || [];
      
      if (jobIds.length === 0) {
        setApplications([]);
        setLoading(false);
        return;
      }
      
      let query = supabase
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
            phone,
            is_verified,
            department
          )
        `)
        .in('job_id', jobIds);

      if (filterJob !== 'all') {
        query = query.eq('job_id', filterJob);
      }

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      if (sortField === 'date') {
        query = query.order('created_at', { ascending: sortDirection === 'asc' });
      } else if (sortField === 'status') {
        query = query.order('status', { ascending: sortDirection === 'asc' });
      } else if (sortField === 'name') {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;

      const applications = data || [];
      const studentIds = applications.map(app => app.student_id);
      
      const { data: gradData, error: gradError } = await supabase
        .from('graduation_details')
        .select('student_id, course, passing_year, college_name')
        .in('student_id', studentIds);
        
      if (gradError) throw gradError;
      
      const gradMap = new Map();
      (gradData || []).forEach(grad => {
        gradMap.set(grad.student_id, {
          course: grad.course,
          passing_year: grad.passing_year,
          college_name: grad.college_name
        });
      });
      
      const typedApplications: ExtendedJobApplication[] = applications.map(app => ({
        ...app,
        status: app.status as JobApplicationStatus,
        graduation_details: gradMap.get(app.student_id) || {
          course: undefined,
          passing_year: undefined,
          college_name: undefined
        }
      }));

      if (sortField === 'name') {
        typedApplications.sort((a, b) => {
          const nameA = `${a.student_profile?.first_name} ${a.student_profile?.last_name}`.toLowerCase();
          const nameB = `${b.student_profile?.first_name} ${b.student_profile?.last_name}`.toLowerCase();
          return sortDirection === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
        });
      }

      setApplications(typedApplications);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast({
        title: 'Error',
        description: 'Failed to load applications',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleViewApplication = (application: ExtendedJobApplication) => {
    setCurrentApplication(application);
    setShowDetailsDialog(true);
  };

  const handleUpdateStatus = (application: ExtendedJobApplication) => {
    setCurrentApplication(application);
    setNewStatus(application.status);
    setStatusNote(application.admin_notes || '');
    setShowStatusDialog(true);
  };

  const handleStatusChange = async () => {
    if (!currentApplication) return;

    try {
      const { error } = await supabase
        .from('job_applications')
        .update({
          status: newStatus,
          admin_notes: statusNote
        })
        .eq('id', currentApplication.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Application status updated successfully',
      });

      setApplications(applications.map(app => 
        app.id === currentApplication.id 
          ? { ...app, status: newStatus, admin_notes: statusNote } 
          : app
      ));

      setShowStatusDialog(false);
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update application status',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: JobApplicationStatus) => {
    switch (status) {
      case 'applied':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Applied</Badge>;
      case 'under_review':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Under Review</Badge>;
      case 'shortlisted':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Shortlisted</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>;
      case 'selected':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Selected</Badge>;
      case 'internship':
        return <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">Internship</Badge>;
      case 'ppo':
        return <Badge variant="outline" className="bg-pink-50 text-pink-700 border-pink-200">PPO</Badge>;
      case 'placement':
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Placement</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredApplications = applications.filter(app => {
    const studentName = `${app.student_profile?.first_name} ${app.student_profile?.last_name}`.toLowerCase();
    const jobTitle = app.job?.title?.toLowerCase() || '';
    const department = app.student_profile?.department?.toLowerCase() || '';
    const searchString = searchTerm.toLowerCase();
    
    return studentName.includes(searchString) || 
           jobTitle.includes(searchString) || 
           department.includes(searchString);
  });

  return (
    <CompanyLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Applications Management</h1>
            <p className="text-gray-600">Manage and review job applications</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              type="text"
              placeholder="Search applications..."
              className="pl-10 w-full sm:w-80"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2 items-center w-full sm:w-auto">
            <Filter size={18} className="text-gray-500 mr-1" />
            
            <Select
              value={filterJob}
              onValueChange={setFilterJob}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by job" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Jobs</SelectItem>
                {jobs.map(job => (
                  <SelectItem key={job.id} value={job.id}>{job.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select
              value={filterStatus}
              onValueChange={setFilterStatus}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
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
                <SelectItem value="placement">Placement</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <>
            {filteredApplications.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <div className="flex items-center cursor-pointer" onClick={() => handleSort('name')}>
                          Student
                          {sortField === 'name' && (
                            <ArrowUpDown size={14} className="ml-1" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead>Job Position</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>
                        <div className="flex items-center cursor-pointer" onClick={() => handleSort('date')}>
                          Applied Date
                          {sortField === 'date' && (
                            <ArrowUpDown size={14} className="ml-1" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center cursor-pointer" onClick={() => handleSort('status')}>
                          Status
                          {sortField === 'status' && (
                            <ArrowUpDown size={14} className="ml-1" />
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
                        <TableCell>{application.job?.title}</TableCell>
                        <TableCell>{application.student_profile?.department || 'N/A'}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Calendar size={14} className="mr-2 text-gray-500" />
                            <span>
                              {application.created_at ? format(new Date(application.created_at), 'MMM dd, yyyy') : 'N/A'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(application.status)}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleViewApplication(application)}
                            >
                              <Eye size={14} />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleUpdateStatus(application)}
                            >
                              <FileText size={14} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <Briefcase size={40} className="text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-700">No applications found</h3>
                  <p className="text-gray-500 mt-1">Try adjusting your filters or search criteria</p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
            <DialogDescription>
              Review applicant information and details
            </DialogDescription>
          </DialogHeader>
          
          {currentApplication && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Personal Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Name</p>
                        <p>{currentApplication.student_profile?.first_name} {currentApplication.student_profile?.last_name}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Department</p>
                        <p>{currentApplication.student_profile?.department || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Contact</p>
                        <p>{currentApplication.student_profile?.phone || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Verification Status</p>
                        <p>{currentApplication.student_profile?.is_verified ? 'Verified' : 'Not Verified'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Education Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm font-medium text-gray-500">College</p>
                        <p>{currentApplication.graduation_details?.college_name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Course</p>
                        <p>{currentApplication.graduation_details?.course || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Passing Year</p>
                        <p>{currentApplication.graduation_details?.passing_year || 'N/A'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Application Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm font-medium text-gray-500">Job Position</p>
                          <p>{currentApplication.job?.title}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Company</p>
                          <p>{currentApplication.job?.company_name}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Location</p>
                          <p>{currentApplication.job?.location}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Package</p>
                          <p>{currentApplication.job?.package}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm font-medium text-gray-500">Applied On</p>
                          <p>{currentApplication.created_at ? format(new Date(currentApplication.created_at), 'MMMM dd, yyyy') : 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Status</p>
                          <p>{getStatusBadge(currentApplication.status)}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Notes</p>
                          <p className="text-sm">{currentApplication.admin_notes || 'No notes'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                  Close
                </Button>
                <Button onClick={() => {
                  setShowDetailsDialog(false);
                  handleUpdateStatus(currentApplication);
                }}>
                  Update Status
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Application Status</DialogTitle>
            <DialogDescription>
              Change the status and add notes for this application.
            </DialogDescription>
          </DialogHeader>
          
          {currentApplication && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Student</label>
                <p>
                  {currentApplication.student_profile?.first_name} {currentApplication.student_profile?.last_name} • {currentApplication.job?.title}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={newStatus}
                  onValueChange={(value) => setNewStatus(value as JobApplicationStatus)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="applied">Applied</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="shortlisted">Shortlisted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="selected">Selected</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                    <SelectItem value="ppo">PPO</SelectItem>
                    <SelectItem value="placement">Placement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Notes</label>
                <textarea 
                  rows={3}
                  className="w-full rounded-md border border-gray-300 p-2 text-sm"
                  placeholder="Add notes about this application status change..."
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleStatusChange}>
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </CompanyLayout>
  );
};

export default Applications;
