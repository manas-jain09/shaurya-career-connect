
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import CompanyLayout from '@/components/layouts/CompanyLayout';
import { JobPosting } from '@/types/database.types';
import { toast } from 'sonner';
import { CalendarClock, Users, UserCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const Jobs = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [applicationCounts, setApplicationCounts] = useState<Record<string, number>>({});
  const [selectedCounts, setSelectedCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchJobs = async () => {
      if (!user?.companyCode) return;

      try {
        setIsLoading(true);
        
        // Fetch job postings for this company
        const { data: jobsData, error: jobsError } = await supabase
          .from('job_postings')
          .select('*')
          .eq('company_code', user.companyCode);
          
        if (jobsError) throw jobsError;
        
        if (jobsData) {
          setJobs(jobsData as JobPosting[]);
          
          // Get application counts for each job
          const appCounts: Record<string, number> = {};
          const selCounts: Record<string, number> = {};
          
          for (const job of jobsData) {
            if (!job.id) continue;
            
            // Get application count
            const { count: appCount, error: appError } = await supabase
              .from('job_applications')
              .select('*', { count: 'exact', head: true })
              .eq('job_id', job.id);
              
            if (!appError) {
              appCounts[job.id] = appCount || 0;
            }
            
            // Get selected candidates count
            const { count: selCount, error: selError } = await supabase
              .from('job_applications')
              .select('*', { count: 'exact', head: true })
              .eq('job_id', job.id)
              .in('status', ['selected', 'internship', 'ppo', 'placement']);
              
            if (!selError) {
              selCounts[job.id] = selCount || 0;
            }
          }
          
          setApplicationCounts(appCounts);
          setSelectedCounts(selCounts);
        }
      } catch (error) {
        console.error('Error fetching jobs:', error);
        toast.error('Failed to load job postings');
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobs();
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <CompanyLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Job Postings</h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center my-12">
          <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      ) : jobs.length === 0 ? (
        <div className="bg-white rounded-lg p-6 text-center shadow">
          <p className="text-gray-500">No job postings found for your company.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {jobs.map((job) => (
            <Card key={job.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="bg-blue-50 p-4">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-semibold mb-1">{job.title}</h3>
                    <Badge className={getStatusColor(job.status)}>{job.status}</Badge>
                  </div>
                  <p className="text-sm text-gray-600">{job.location} • {job.package}</p>
                </div>

                <div className="p-4">
                  <p className="text-sm text-gray-700 mb-4 line-clamp-3">
                    {job.description}
                  </p>
                  
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="flex items-center">
                      <CalendarClock size={16} className="mr-1 text-blue-500" />
                      <span>{format(new Date(job.application_deadline), 'dd MMM yyyy')}</span>
                    </div>
                    <div className="flex items-center">
                      <Users size={16} className="mr-1 text-blue-500" />
                      <span>{applicationCounts[job.id || ''] || 0} applications</span>
                    </div>
                    <div className="flex items-center">
                      <UserCheck size={16} className="mr-1 text-blue-500" />
                      <span>{selectedCounts[job.id || ''] || 0} selected</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </CompanyLayout>
  );
};

export default Jobs;
