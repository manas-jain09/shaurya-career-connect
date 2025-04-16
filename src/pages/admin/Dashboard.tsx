import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  FileCheck, 
  Briefcase, 
  CheckCircle2, 
  Clock, 
  BarChart2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const Dashboard = () => {
  const [statsData, setStatsData] = useState([
    { title: 'Total Students', value: 0, icon: Users, color: 'bg-blue-50 text-blue-500' },
    { title: 'Verified Profiles', value: 0, icon: FileCheck, color: 'bg-green-50 text-green-500' },
    { title: 'Pending Verification', value: 0, icon: Clock, color: 'bg-yellow-50 text-yellow-500' },
    { title: 'Active Jobs', value: 0, icon: Briefcase, color: 'bg-purple-50 text-purple-500' },
    { title: 'Total Applications', value: 0, icon: CheckCircle2, color: 'bg-indigo-50 text-indigo-500' },
    { title: 'Placement Rate', value: '0%', icon: BarChart2, color: 'bg-pink-50 text-pink-500' },
  ]);
  
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Fetch student stats
      const { data: studentProfiles } = await supabase
        .from('student_profiles')
        .select('*');
      
      const totalStudents = studentProfiles?.length || 0;
      const verifiedStudents = studentProfiles?.filter(p => p.is_verified).length || 0;
      const pendingStudents = studentProfiles?.filter(p => p.verification_status === 'pending').length || 0;
      
      // Fetch job stats
      const { data: jobs } = await supabase
        .from('job_postings')
        .select('*')
        .eq('status', 'active');
      
      const activeJobs = jobs?.length || 0;
      
      // Fetch application stats
      const { data: applications } = await supabase
        .from('job_applications')
        .select('*');
      
      const totalApplications = applications?.length || 0;
      
      // Calculate placement rate (selected / total)
      const selectedApplications = applications?.filter(a => a.status === 'selected').length || 0;
      const placementRate = totalStudents > 0 
        ? Math.round((selectedApplications / totalStudents) * 100) 
        : 0;
      
      // Update stats data
      setStatsData([
        { title: 'Total Students', value: totalStudents, icon: Users, color: 'bg-blue-50 text-blue-500' },
        { title: 'Verified Profiles', value: verifiedStudents, icon: FileCheck, color: 'bg-green-50 text-green-500' },
        { title: 'Pending Verification', value: pendingStudents, icon: Clock, color: 'bg-yellow-50 text-yellow-500' },
        { title: 'Active Jobs', value: activeJobs, icon: Briefcase, color: 'bg-purple-50 text-purple-500' },
        { title: 'Total Applications', value: totalApplications, icon: CheckCircle2, color: 'bg-indigo-50 text-indigo-500' },
        { title: 'Placement Rate', value: `${placementRate}%`, icon: BarChart2, color: 'bg-pink-50 text-pink-500' },
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
          <p className="text-gray-600">Overview of placement activities</p>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {statsData.map((stat, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                      <p className="text-3xl font-bold text-gray-800 mt-1">{stat.value}</p>
                    </div>
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center ${stat.color}`}>
                      <stat.icon size={24} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
