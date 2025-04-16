import React, { useState, useEffect } from 'react';
import { CSVLink } from 'react-csv';
import AdminLayout from '@/components/layouts/AdminLayout';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { JobApplication, JobApplicationStatus } from '@/types/database.types';
import { Loader2, Search, FileDown, Filter, Users } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

const statusColors: Record<JobApplicationStatus, string> = {
  'applied': 'bg-blue-100 text-blue-800',
  'under_review': 'bg-yellow-100 text-yellow-800',
  'shortlisted': 'bg-green-100 text-green-800',
  'rejected': 'bg-red-100 text-red-800',
  'selected': 'bg-purple-100 text-purple-800',
  'internship': 'bg-indigo-100 text-indigo-800',
  'ppo': 'bg-pink-100 text-pink-800',
  'placement': 'bg-teal-100 text-teal-800',
};

const StatusBadge: React.FC<{ status: JobApplicationStatus }> = ({ status }) => {
  const colorClass = statusColors[status] || 'bg-gray-100 text-gray-800';
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
      {status === 'ppo' ? 'PPO' : status.replace('_', ' ')}
    </span>
  );
};

const Applications = () => {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showOptedOut, setShowOptedOut] = useState<boolean>(false);
  const [optedOutStudents, setOptedOutStudents] = useState<any[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [optedOutDialogOpen, setOptedOutDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<JobApplicationStatus>('applied');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  
  const { toast } = useToast();
  
  const fetchApplications = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('job_applications')
        .select(`
          *,
          job:job_id(title, company_name, location, package),
          student_profile:student_id(first_name, last_name, phone, is_verified)
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      const typedApplications = data as JobApplication[];
      setApplications(typedApplications);
      setFilteredApplications(typedApplications);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast({
        title: 'Error',
        description: 'Failed to load applications',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchOptedOutStudents = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('student_profiles')
        .select(`
          *,
          graduation_details:id(course, passing_year, college_name)
        `)
        .not('placement_interest', 'eq', 'placement/internship');
      
      if (error) {
        throw error;
      }
      
      setOptedOutStudents(data || []);
    } catch (error) {
      console.error('Error fetching opted out students:', error);
      toast({
        title: 'Error',
        description: 'Failed to load opted out students',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchApplications();
    fetchOptedOutStudents();
  }, []);
  
  useEffect(() => {
    let filtered = applications;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(app => 
        app.student_profile?.first_name?.toLowerCase().includes(term) ||
        app.student_profile?.last_name?.toLowerCase().includes(term) ||
        app.job?.title?.toLowerCase().includes(term) ||
        app.job?.company_name?.toLowerCase().includes(term)
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }
    
    setFilteredApplications(filtered);
  }, [searchTerm, statusFilter, applications]);
  
  const handleOpenStatusDialog = (application: JobApplication) => {
    setSelectedApplication(application);
    setNewStatus(application.status);
    setDialogOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedApplication) return;
    
    try {
      setUpdatingStatus(true);
      
      const { error } = await supabase
        .from('job_applications')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedApplication.id);
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Application status updated successfully'
      });
      
      fetchApplications();
      setDialogOpen(false);
    } catch (error) {
      console.error('Error updating application status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update application status',
        variant: 'destructive',
      });
    } finally {
      setUpdatingStatus(false);
    }
  };
  
  const getCSVData = () => {
    return filteredApplications.map(app => ({
      'Student Name': `${app.student_profile?.first_name} ${app.student_profile?.last_name}`,
      'Phone': app.student_profile?.phone,
      'Job Title': app.job?.title,
      'Company': app.job?.company_name,
      'Location': app.job?.location,
      'Package': app.job?.package,
      'Status': app.status === 'ppo' ? 'PPO' : app.status.replace('_', ' '),
      'Applied Date': new Date(app.created_at || '').toLocaleDateString()
    }));
  };

  const getOptedOutCSVData = () => {
    return optedOutStudents.map(student => ({
      'Student Name': `${student.first_name} ${student.last_name}`,
      'Phone': student.phone,
      'Department': student.department || 'Not specified',
      'Placement Interest': student.placement_interest || 'Not specified',
      'Is Verified': student.is_verified ? 'Yes' : 'No',
      'Course': student.graduation_details?.course || 'Not specified',
      'Passing Year': student.graduation_details?.passing_year || 'Not specified'
    }));
  };
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Job Applications</h1>
          
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              onClick={() => setOptedOutDialogOpen(true)}
              className="flex items-center"
            >
              <Users className="mr-2 h-4 w-4" />
              View Opted Out Students
            </Button>
            
            <CSVLink 
              data={getCSVData()} 
              filename={'job-applications.csv'} 
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <FileDown className="mr-2 h-4 w-4" />
              Export to CSV
            </CSVLink>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Search applications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          
          <div className="w-full md:w-64">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <div className="flex items-center">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by status" />
                </div>
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
        
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-shaurya-primary" />
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <Table>
              <TableCaption>List of all job applications</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Job</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Applied On</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
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
                        <div>
                          <div className="font-medium">
                            {application.student_profile?.first_name} {application.student_profile?.last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {application.student_profile?.phone}
                          </div>
                          {application.student_profile?.is_verified === false && (
                            <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 mt-1">
                              Not Verified
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{application.job?.title}</TableCell>
                      <TableCell>
                        <div>
                          <div>{application.job?.company_name}</div>
                          <div className="text-sm text-gray-500">
                            {application.job?.location}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(application.created_at || '').toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={application.status as JobApplicationStatus} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleOpenStatusDialog(application)}
                        >
                          Update Status
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
      
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Application Status</DialogTitle>
            <DialogDescription>
              Changing to Selected, Internship, PPO, or Placement will freeze the student's profile and auto-reject other applications.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {selectedApplication && (
              <div className="mb-4">
                <h3 className="font-medium">
                  {selectedApplication.student_profile?.first_name} {selectedApplication.student_profile?.last_name}
                </h3>
                <p className="text-sm text-gray-600">
                  Application for {selectedApplication.job?.title} at {selectedApplication.job?.company_name}
                </p>
              </div>
            )}
            
            <ScrollArea className="max-h-[60vh] overflow-auto pr-3">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Application Status</Label>
                  <RadioGroup 
                    value={newStatus} 
                    onValueChange={(value) => setNewStatus(value as JobApplicationStatus)}
                    className="flex flex-col space-y-2"
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
                      <RadioGroupItem value="rejected" id="rejected" />
                      <Label htmlFor="rejected">Rejected</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="selected" id="selected" />
                      <Label htmlFor="selected">Selected</Label>
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
            </ScrollArea>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateStatus}
              disabled={updatingStatus}
            >
              {updatingStatus ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Update Status'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={optedOutDialogOpen} onOpenChange={setOptedOutDialogOpen}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Students Opted Out of Placements</DialogTitle>
            <DialogDescription>
              These students have not chosen "placement/internship" as their placement interest
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="flex justify-end mb-4">
              <CSVLink 
                data={getOptedOutCSVData()} 
                filename={'opted-out-students.csv'} 
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                <FileDown className="mr-2 h-4 w-4" />
                Export to CSV
              </CSVLink>
            </div>
            
            <ScrollArea className="h-[60vh]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Placement Interest</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Passing Year</TableHead>
                    <TableHead>Verification</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {optedOutStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                        No students have opted out
                      </TableCell>
                    </TableRow>
                  ) : (
                    optedOutStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{student.first_name} {student.last_name}</div>
                            <div className="text-sm text-gray-500">{student.phone}</div>
                          </div>
                        </TableCell>
                        <TableCell>{student.department || 'Not specified'}</TableCell>
                        <TableCell>{student.placement_interest || 'Not specified'}</TableCell>
                        <TableCell>{student.graduation_details?.course || 'Not specified'}</TableCell>
                        <TableCell>{student.graduation_details?.passing_year || 'Not specified'}</TableCell>
                        <TableCell>
                          {student.is_verified ? (
                            <Badge variant="outline" className="bg-green-50 text-green-800 border-green-300">
                              Verified
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300">
                              Not Verified
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default Applications;
