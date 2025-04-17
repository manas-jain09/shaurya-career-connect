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
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { 
  Search, 
  Eye, 
  Calendar, 
  ArrowUpDown,
  Filter,
  Users,
  Briefcase
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { JobPosting, JobPostingStatus } from '@/types/database.types';
import { format } from 'date-fns';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import JobDetails from '@/components/admin/JobDetails';

interface JobPostingWithCounts extends JobPosting {
  application_count?: number;
  selected_count?: number;
}

const CompanyJobs = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<JobPostingWithCounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortField, setSortField] = useState<string>('deadline');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [currentJob, setCurrentJob] = useState<JobPostingWithCounts | null>(null);
  
  useEffect(() => {
    fetchJobs();
  }, [user, sortField, sortDirection, filterStatus]);

  const fetchJobs = async () => {
    if (!user?.companyCode) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from('job_postings')
        .select('*')
        .eq('company_code', user.companyCode);

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      if (sortField === 'deadline') {
        query = query.order('application_deadline', { ascending: sortDirection === 'asc' });
      } else if (sortField === 'created') {
        query = query.order('created_at', { ascending: sortDirection === 'asc' });
      } else if (sortField === 'title') {
        query = query.order('title', { ascending: sortDirection === 'asc' });
      }

      const { data, error } = await query;

      if (error) throw error;

      const typedData = data?.map(job => ({
        ...job,
        status: job.status as JobPostingStatus,
        eligible_courses: job.eligible_courses as string[] | null,
        eligible_passing_years: job.eligible_passing_years as number[] | null
      })) || [];

      const jobIds = typedData?.map(job => job.id) || [];
      const jobsWithCounts: JobPostingWithCounts[] = [...typedData];
      
      if (jobIds.length > 0) {
        for (let i = 0; i < jobsWithCounts.length; i++) {
          const jobId = jobsWithCounts[i].id;
          if (!jobId) continue;
          
          const { count: totalApps, error: countError } = await supabase
            .from('job_applications')
            .select('*', { count: 'exact', head: true })
            .eq('job_id', jobId);
            
          if (countError) throw countError;
          
          const { count: selectedCount, error: selectedError } = await supabase
            .from('job_applications')
            .select('*', { count: 'exact', head: true })
            .eq('job_id', jobId)
            .in('status', ['selected', 'internship', 'ppo', 'placement']);
            
          if (selectedError) throw selectedError;
          
          jobsWithCounts[i].application_count = totalApps || 0;
          jobsWithCounts[i].selected_count = selectedCount || 0;
        }
      }

      setJobs(jobsWithCounts);
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

  const handleViewJob = (job: JobPostingWithCounts) => {
    setCurrentJob(job);
    setShowDetailsDialog(true);
  };

  const filteredJobs = jobs.filter(job => {
    const titleMatch = job.title.toLowerCase().includes(searchTerm.toLowerCase());
    const locationMatch = job.location.toLowerCase().includes(searchTerm.toLowerCase());
    return titleMatch || locationMatch;
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

  const isPastDeadline = (deadline: string) => {
    return new Date(deadline) < new Date();
  };

  return (
    <CompanyLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Your Job Postings</h1>
          <p className="text-gray-600">View and manage your company's job postings</p>
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
                        <div className="flex items-center cursor-pointer" onClick={() => handleSort('title')}>
                          Position
                          {sortField === 'title' && (
                            <ArrowUpDown size={14} className="ml-1" />
                          )}
                        </div>
                      </TableHead>
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
                      <TableHead>Applications</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredJobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell className="font-medium">{job.title}</TableCell>
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
                        <TableCell>
                          <div className="flex items-center">
                            <Users size={14} className="mr-2 text-gray-500" />
                            <span>
                              {job.application_count || 0} Total / {job.selected_count || 0} Selected
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(job.status)}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleViewJob(job)}
                          >
                            <Eye size={14} />
                          </Button>
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
                  <p className="text-gray-500 mt-1 mb-4">No jobs have been posted for your company yet</p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          {currentJob && (
            <JobDetails
              job={currentJob}
              onEdit={() => {}}
              onClose={() => setShowDetailsDialog(false)}
              isCompanyView={true}
            />
          )}
        </DialogContent>
      </Dialog>
    </CompanyLayout>
  );
};

export default CompanyJobs;
