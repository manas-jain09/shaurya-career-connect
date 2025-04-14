
import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Eye, 
  Calendar, 
  Clock,
  Filter,
  ArrowUpDown,
  Briefcase
} from 'lucide-react';
import { JobPosting } from '@/types/database.types';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import JobForm from '@/components/admin/JobForm';
import JobDetails from '@/components/admin/JobDetails';
import { Dialog, DialogContent } from '@/components/ui/dialog';

const Jobs = () => {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortField, setSortField] = useState<string>('deadline');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [currentJob, setCurrentJob] = useState<JobPosting | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchJobs();
  }, [sortField, sortDirection, filterStatus]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('job_postings')
        .select('*');

      // Apply filter if not 'all'
      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      // Apply sorting
      if (sortField === 'deadline') {
        query = query.order('application_deadline', { ascending: sortDirection === 'asc' });
      } else if (sortField === 'created') {
        query = query.order('created_at', { ascending: sortDirection === 'asc' });
      } else if (sortField === 'company') {
        query = query.order('company_name', { ascending: sortDirection === 'asc' });
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      setJobs(data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load job postings',
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
      setSortDirection('asc');
    }
  };

  const handleCreateJob = () => {
    setCurrentJob(null);
    setShowFormDialog(true);
  };

  const handleEditJob = (job: JobPosting) => {
    setCurrentJob(job);
    setShowFormDialog(true);
  };

  const handleViewJob = (job: JobPosting) => {
    setCurrentJob(job);
    setShowDetailsDialog(true);
  };

  const handleDeleteJob = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this job posting?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('job_postings')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Job posting deleted successfully',
      });

      // Refresh the job list
      fetchJobs();
    } catch (error) {
      console.error('Error deleting job:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete job posting',
        variant: 'destructive',
      });
    }
  };

  const handleJobSaved = () => {
    setShowFormDialog(false);
    fetchJobs();
  };

  const filteredJobs = jobs.filter(job => {
    const titleMatch = job.title.toLowerCase().includes(searchTerm.toLowerCase());
    const companyMatch = job.company_name.toLowerCase().includes(searchTerm.toLowerCase());
    const locationMatch = job.location.toLowerCase().includes(searchTerm.toLowerCase());
    return titleMatch || companyMatch || locationMatch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>;
      case 'closed':
        return <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">Closed</Badge>;
      case 'draft':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Draft</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Check if a job is past deadline
  const isPastDeadline = (deadline: string) => {
    return new Date(deadline) < new Date();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Job Management</h1>
            <p className="text-gray-600">Create and manage job postings</p>
          </div>
          <Button onClick={handleCreateJob}>
            <Plus size={16} className="mr-1" /> New Job
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              type="text"
              placeholder="Search jobs..."
              className="pl-10 w-full sm:w-80"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2 items-center w-full sm:w-auto">
            <Filter size={18} className="text-gray-500" />
            <select 
              className="border rounded-md px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Jobs</option>
              <option value="active">Active</option>
              <option value="closed">Closed</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <>
            {filteredJobs.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <div className="flex items-center cursor-pointer" onClick={() => handleSort('company')}>
                          Company
                          {sortField === 'company' && (
                            <ArrowUpDown size={14} className="ml-1" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Package</TableHead>
                      <TableHead>
                        <div className="flex items-center cursor-pointer" onClick={() => handleSort('deadline')}>
                          Deadline
                          {sortField === 'deadline' && (
                            <ArrowUpDown size={14} className="ml-1" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredJobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell className="font-medium">{job.company_name}</TableCell>
                        <TableCell>{job.title}</TableCell>
                        <TableCell>{job.location}</TableCell>
                        <TableCell>{job.package}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Calendar size={14} className="mr-2 text-gray-500" />
                            <span className={isPastDeadline(job.application_deadline) ? 'text-red-500' : ''}>
                              {format(new Date(job.application_deadline), 'MMM dd, yyyy')}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(job.status)}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleViewJob(job)}
                            >
                              <Eye size={14} />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleEditJob(job)}
                            >
                              <Edit2 size={14} />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                              onClick={() => handleDeleteJob(job.id!)}
                            >
                              <Trash2 size={14} />
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
                  <h3 className="text-lg font-medium text-gray-700">No job postings found</h3>
                  <p className="text-gray-500 mt-1 mb-4">Create a new job posting to get started</p>
                  <Button onClick={handleCreateJob}>
                    <Plus size={16} className="mr-1" /> New Job
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      {/* Job Form Dialog */}
      <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
        <DialogContent className="max-w-2xl">
          <JobForm
            job={currentJob}
            onSave={handleJobSaved}
            onCancel={() => setShowFormDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Job Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          {currentJob && (
            <JobDetails
              job={currentJob}
              onEdit={() => {
                setShowDetailsDialog(false);
                setShowFormDialog(true);
              }}
              onClose={() => setShowDetailsDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default Jobs;
