
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import CompanyLayout from '@/components/layouts/CompanyLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { JobPosting } from '@/types/database.types';
import { toast } from 'sonner';
import { Briefcase, Users, CheckCircle } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [totalApplications, setTotalApplications] = useState(0);
  const [selectedCandidates, setSelectedCandidates] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
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
          setJobPostings(jobsData as JobPosting[]);
          
          // Get job IDs for this company
          const jobIds = jobsData.map(job => job.id);
          
          if (jobIds.length > 0) {
            // Count total applications for these jobs
            const { count: applicationsCount, error: appCountError } = await supabase
              .from('job_applications')
              .select('*', { count: 'exact', head: true })
              .in('job_id', jobIds);
              
            if (appCountError) throw appCountError;
            setTotalApplications(applicationsCount || 0);
            
            // Count selected candidates
            const { count: selectedCount, error: selectedError } = await supabase
              .from('job_applications')
              .select('*', { count: 'exact', head: true })
              .in('job_id', jobIds)
              .in('status', ['selected', 'internship', 'ppo', 'placement']);
              
            if (selectedError) throw selectedError;
            setSelectedCandidates(selectedCount || 0);
          }
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const statsCards = [
    {
      title: 'Active Job Postings',
      value: jobPostings.filter(job => job.status === 'active').length,
      icon: <Briefcase className="h-8 w-8 text-blue-500" />,
      description: 'Currently active job openings',
    },
    {
      title: 'Total Applications',
      value: totalApplications,
      icon: <Users className="h-8 w-8 text-green-500" />,
      description: 'Applications received for all jobs',
    },
    {
      title: 'Selected Candidates',
      value: selectedCandidates,
      icon: <CheckCircle className="h-8 w-8 text-purple-500" />,
      description: 'Candidates with selected status',
    },
  ];

  return (
    <CompanyLayout>
      <h1 className="text-2xl font-bold mb-6">Company Dashboard</h1>
      
      {isLoading ? (
        <div className="flex justify-center my-12">
          <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {statsCards.map((card, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg font-medium">{card.title}</CardTitle>
                  {card.icon}
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{card.value}</div>
                  <CardDescription>{card.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {jobPostings.length === 0 ? (
            <div className="bg-white rounded-lg p-6 text-center shadow">
              <p className="text-gray-500">No job postings found for your company.</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg p-6 shadow">
              <h2 className="text-xl font-semibold mb-4">Recent Job Postings</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-2 text-left">Title</th>
                      <th className="px-4 py-2 text-left">Location</th>
                      <th className="px-4 py-2 text-left">Package</th>
                      <th className="px-4 py-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobPostings.slice(0, 5).map((job) => (
                      <tr key={job.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3">{job.title}</td>
                        <td className="px-4 py-3">{job.location}</td>
                        <td className="px-4 py-3">{job.package}</td>
                        <td className="px-4 py-3">
                          <span className={`
                            px-2 py-1 rounded-full text-xs capitalize
                            ${job.status === 'active' ? 'bg-green-100 text-green-800' : 
                              job.status === 'closed' ? 'bg-red-100 text-red-800' : 
                              'bg-gray-100 text-gray-800'}
                          `}>
                            {job.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </CompanyLayout>
  );
};

export default Dashboard;
