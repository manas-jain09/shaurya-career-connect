
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
  DialogTrigger 
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { JobApplication, JobApplicationStatus } from '@/types/database.types';
import { Loader2, Search, FileDown, Filter } from 'lucide-react';

const statusColors: Record<JobApplicationStatus, string> = {
  'applied': 'bg-blue-100 text-blue-800',
  'under_review': 'bg-yellow-100 text-yellow-800',
  'shortlisted': 'bg-green-100 text-green-800',
  'rejected': 'bg-red-100 text-red-800',
  'selected': 'bg-purple-100 text-purple-800',
};

const StatusBadge: React.FC<{ status: JobApplicationStatus }> = ({ status }) => {
  const colorClass = statusColors[status] || 'bg-gray-100 text-gray-800';
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
      {status.replace('_', ' ')}
    </span>
  );
};

const Applications = () => {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
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
  
  useEffect(() => {
    fetchApplications();
  }, []);
  
  useEffect(() => {
    let filtered = applications;
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(app => 
        app.student_profile?.first_name?.toLowerCase().includes(term) ||
        app.student_profile?.last_name?.toLowerCase().includes(term) ||
        app.job?.title?.toLowerCase().includes(term) ||
        app.job?.company_name?.toLowerCase().includes(term)
      );
    }
    
    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }
    
    setFilteredApplications(filtered);
  }, [searchTerm, statusFilter, applications]);
  
  const handleOpenStatusDialog = (application: JobApplication) => {
    setSelectedApplication(application);
    setNewStatus(application.status);
    setAdminNotes(application.admin_notes || '');
    setDialogOpen(true);
  };
  
  const handleUpdateStatus = async () => {
    if (!selectedApplication) return;
    
    try {
      setUpdatingStatus(true);
      
      // Update application status
      const { error } = await supabase
        .from('job_applications')
        .update({
          status: newStatus,
          admin_notes: adminNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedApplication.id);
      
      if (error) throw error;
      
      // Create notification for the student
      const notificationData = {
        user_id: selectedApplication.student_id,
        title: 'Application Status Updated',
        message: `Your application for ${selectedApplication.job?.title} at ${selectedApplication.job?.company_name} has been ${newStatus.replace('_', ' ')}.`,
        is_read: false,
        created_at: new Date().toISOString()
      };
      
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert(notificationData);
      
      if (notificationError) throw notificationError;
      
      toast({
        title: 'Success',
        description: 'Application status updated successfully'
      });
      
      // Refresh applications
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
      'Status': app.status.replace('_', ' '),
      'Applied Date': new Date(app.created_at || '').toLocaleDateString(),
      'Notes': app.admin_notes
    }));
  };
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Job Applications</h1>
          
          <CSVLink 
            data={getCSVData()} 
            filename={'job-applications.csv'} 
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            <FileDown className="mr-2 h-4 w-4" />
            Export to CSV
          </CSVLink>
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
                </RadioGroup>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="admin_notes">Admin Notes</Label>
                <Textarea
                  id="admin_notes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this application..."
                  rows={4}
                />
              </div>
            </div>
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
    </AdminLayout>
  );
};

export default Applications;
