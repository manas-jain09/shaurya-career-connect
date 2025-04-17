
import React, { useEffect, useState } from 'react';
import CompanyLayout from '@/components/layouts/CompanyLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { JobPosting } from '@/types/database.types';
import { Building2, Users, CheckSquare, Clock } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [jobsCount, setJobsCount] = useState(0);
  const [applicationsCount, setApplicationsCount] = useState(0);
  const [selectedCount, setSelectedCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [recentJobs, setRecentJobs] = useState<JobPosting[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.companyCode) return;

      setLoading(true);
      try {
        // Get jobs for this company
        const { data: jobs, error: jobsError } = await supabase
          .from('job_postings')
          .select('*')
          .eq('company_code', user.companyCode);

        if (jobsError) throw jobsError;

        // Get recent jobs
        const { data: recentJobsData, error: recentJobsError } = await supabase
          .from('job_postings')
          .select('*')
          .eq('company_code', user.companyCode)
          .order('created_at', { ascending: false })
          .limit(5);

        if (recentJobsError) throw recentJobsError;
        
        // Get job IDs for this company
        const jobIds = jobs?.map(job => job.id) || [];
        
        if (jobIds.length > 0) {
          // Get applications count
          const { count: totalApps, error: appsError } = await supabase
            .from('job_applications')
            .select('*', { count: 'exact', head: true })
            .in('job_id', jobIds);

          if (appsError) throw appsError;

          // Get selected applications count
          const { count: selectedApps, error: selectedError } = await supabase
            .from('job_applications')
            .select('*', { count: 'exact', head: true })
            .in('job_id', jobIds)
            .in('status', ['selected', 'internship', 'ppo', 'placement']);

          if (selectedError) throw selectedError;

          // Get pending applications count
          const { count: pendingApps, error: pendingError } = await supabase
            .from('job_applications')
            .select('*', { count: 'exact', head: true })
            .in('job_id', jobIds)
            .in('status', ['applied', 'under_review', 'shortlisted']);

          if (pendingError) throw pendingError;

          setJobsCount(jobs?.length || 0);
          setApplicationsCount(totalApps || 0);
          setSelectedCount(selectedApps || 0);
          setPendingCount(pendingApps || 0);
          setRecentJobs(recentJobsData || []);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  return (
    <CompanyLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Company Dashboard</h1>
          <p className="text-gray-600">Overview of your recruitment activities</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin w-10 h-10 border-4 border-shaurya-primary border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-white">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Job Postings</p>
                      <h3 className="text-3xl font-bold mt-2">{jobsCount}</h3>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                      <Building2 size={24} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Total Applications</p>
                      <h3 className="text-3xl font-bold mt-2">{applicationsCount}</h3>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                      <Users size={24} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Selected Candidates</p>
                      <h3 className="text-3xl font-bold mt-2">{selectedCount}</h3>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                      <CheckSquare size={24} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Pending Reviews</p>
                      <h3 className="text-3xl font-bold mt-2">{pendingCount}</h3>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                      <Clock size={24} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Job Postings</CardTitle>
                  <CardDescription>Your recently created job openings</CardDescription>
                </CardHeader>
                <CardContent>
                  {recentJobs.length > 0 ? (
                    <div className="divide-y">
                      {recentJobs.map((job) => (
                        <div key={job.id} className="py-3">
                          <div className="flex justify-between">
                            <div>
                              <h4 className="font-medium">{job.title}</h4>
                              <p className="text-sm text-gray-500">{job.location} • {job.package}</p>
                            </div>
                            <div className="text-right">
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                job.status === 'active' 
                                  ? 'bg-green-100 text-green-800' 
                                  : job.status === 'closed' 
                                  ? 'bg-gray-100 text-gray-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                              </span>
                              <p className="text-xs text-gray-500 mt-1">
                                Due: {new Date(job.application_deadline).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      <Building2 size={40} className="mx-auto mb-2 text-gray-300" />
                      <p>No job postings yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </CompanyLayout>
  );
};

export default Dashboard;
