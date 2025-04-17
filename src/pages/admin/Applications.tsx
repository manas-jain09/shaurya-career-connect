
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
  DialogTitle
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { JobApplication, JobApplicationStatus } from '@/types/database.types';
import { Loader2, Search, FileDown, Filter, CheckSquare, Square } from 'lucide-react';
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
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<JobApplicationStatus>('applied');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [selectedApplications, setSelectedApplications] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  
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
      // Reset selections when data is refreshed
      setSelectedApplications([]);
      setSelectAll(false);
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
      
      const shouldFreezeProfile = ['selected', 'internship', 'ppo', 'placement'].includes(newStatus) && 
                                 !['selected', 'internship', 'ppo', 'placement'].includes(selectedApplication.status);
      
      const { error } = await supabase
        .from('job_applications')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedApplication.id);
      
      if (error) throw error;
      
      if (shouldFreezeProfile) {
        const { error: freezeError } = await supabase
          .from('student_profiles')
          .update({
            is_frozen: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedApplication.student_id);
        
        if (freezeError) throw freezeError;
        
        const { error: updateOtherAppsError } = await supabase
          .from('job_applications')
          .update({
            status: 'rejected',
            admin_notes: `Automatically rejected because student was ${newStatus} for another position`,
            updated_at: new Date().toISOString()
          })
          .eq('student_id', selectedApplication.student_id)
          .neq('id', selectedApplication.id)
          .not('status', 'in', '("selected","internship","ppo","placement","rejected")');
        
        if (updateOtherAppsError) {
          console.error('Error updating other applications:', updateOtherAppsError);
        }
      }
      
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
  
  const handleBatchUpdateStatus = async () => {
    if (selectedApplications.length === 0) return;
    
    try {
      setUpdatingStatus(true);
      
      // Get the student IDs that need to be frozen
      const selectedApps = applications.filter(app => 
        selectedApplications.includes(app.id || '') && 
        !['selected', 'internship', 'ppo', 'placement'].includes(app.status) && 
        ['selected', 'internship', 'ppo', 'placement'].includes(newStatus)
      );
      
      const studentIdsToFreeze = [...new Set(selectedApps.map(app => app.student_id))];
      
      // Update all selected applications
      const { error } = await supabase
        .from('job_applications')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .in('id', selectedApplications);
      
      if (error) throw error;
      
      // Freeze profiles if needed
      if (studentIdsToFreeze.length > 0) {
        const { error: freezeError } = await supabase
          .from('student_profiles')
          .update({
            is_frozen: true,
            updated_at: new Date().toISOString()
          })
          .in('id', studentIdsToFreeze);
        
        if (freezeError) throw freezeError;
        
        // Reject other applications from the same students
        for (const studentId of studentIdsToFreeze) {
          const { error: rejectError } = await supabase
            .from('job_applications')
            .update({
              status: 'rejected',
              admin_notes: `Automatically rejected because student was ${newStatus} for another position`,
              updated_at: new Date().toISOString()
            })
            .eq('student_id', studentId)
            .not('id', 'in', selectedApplications)
            .not('status', 'in', '("selected","internship","ppo","placement","rejected")');
          
          if (rejectError) {
            console.error(`Error rejecting other applications for student ${studentId}:`, rejectError);
          }
        }
      }
      
      toast({
        title: 'Success',
        description: `Updated ${selectedApplications.length} applications successfully`
      });
      
      fetchApplications();
      setBatchDialogOpen(false);
      setSelectedApplications([]);
      setSelectAll(false);
    } catch (error) {
      console.error('Error updating application status in batch:', error);
      toast({
        title: 'Error',
        description: 'Failed to update application status',
        variant: 'destructive',
      });
    } finally {
      setUpdatingStatus(false);
    }
  };
  
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedApplications([]);
    } else {
      setSelectedApplications(filteredApplications.map(app => app.id || '').filter(Boolean));
    }
    setSelectAll(!selectAll);
  };
  
  const toggleSelectApplication = (id: string) => {
    if (selectedApplications.includes(id)) {
      setSelectedApplications(selectedApplications.filter(appId => appId !== id));
    } else {
      setSelectedApplications([...selectedApplications, id]);
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
  
  return (
    <AdminLayout>
      <div className="space-y-6 max-w-full">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <h1 className="text-2xl font-bold">Job Applications</h1>
          
          <div className="flex space-x-2">
            {selectedApplications.length > 0 && (
              <Button 
                variant="secondary"
                onClick={() => {
                  setNewStatus('applied');
                  setBatchDialogOpen(true);
                }}
              >
                Update {selectedApplications.length} Selected
              </Button>
            )}
            
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
            <ScrollArea className="w-full max-w-full">
              <div className="w-full overflow-auto">
                <Table>
                  <TableCaption>List of all job applications</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <div className="flex items-center" onClick={toggleSelectAll} style={{ cursor: 'pointer' }}>
                          {selectAll ? (
                            <CheckSquare className="h-5 w-5 text-blue-600" />
                          ) : (
                            <Square className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                      </TableHead>
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
                        <TableCell colSpan={7} className="text-center py-6 text-gray-500">
                          No applications found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredApplications.map((application) => (
                        <TableRow key={application.id}>
                          <TableCell>
                            <div 
                              onClick={() => application.id && toggleSelectApplication(application.id)}
                              style={{ cursor: 'pointer' }}
                            >
                              {selectedApplications.includes(application.id || '') ? (
                                <CheckSquare className="h-5 w-5 text-blue-600" />
                              ) : (
                                <Square className="h-5 w-5 text-gray-400" />
                              )}
                            </div>
                          </TableCell>
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
            </ScrollArea>
          </div>
        )}
      </div>
      
      {/* Single application status dialog */}
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
      
      {/* Batch update dialog */}
      <Dialog open={batchDialogOpen} onOpenChange={setBatchDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Multiple Applications</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="mb-4">
              <h3 className="font-medium">
                Update {selectedApplications.length} Selected Applications
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                This will update the status of all selected applications.
              </p>
            </div>
            
            <ScrollArea className="max-h-[60vh] overflow-auto pr-3">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>New Status</Label>
                  <RadioGroup 
                    value={newStatus} 
                    onValueChange={(value) => setNewStatus(value as JobApplicationStatus)}
                    className="flex flex-col space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="applied" id="batch-applied" />
                      <Label htmlFor="batch-applied">Applied</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="under_review" id="batch-under_review" />
                      <Label htmlFor="batch-under_review">Under Review</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="shortlisted" id="batch-shortlisted" />
                      <Label htmlFor="batch-shortlisted">Shortlisted</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="rejected" id="batch-rejected" />
                      <Label htmlFor="batch-rejected">Rejected</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="selected" id="batch-selected" />
                      <Label htmlFor="batch-selected">Selected</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="internship" id="batch-internship" />
                      <Label htmlFor="batch-internship">Internship</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="ppo" id="batch-ppo" />
                      <Label htmlFor="batch-ppo">PPO</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="placement" id="batch-placement" />
                      <Label htmlFor="batch-placement">Placement</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </ScrollArea>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setBatchDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleBatchUpdateStatus}
              disabled={updatingStatus}
            >
              {updatingStatus ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                `Update ${selectedApplications.length} Applications`
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default Applications;
