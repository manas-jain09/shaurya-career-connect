
import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  FileCheck, 
  Briefcase, 
  CheckCircle2, 
  Clock, 
  BarChart2, 
  PieChart 
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { StudentProfile } from '@/types/database.types';
import { Link } from 'react-router-dom';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#8dd1e1'];

const Dashboard = () => {
  const [statsData, setStatsData] = useState([
    { title: 'Total Students', value: 0, icon: Users, color: 'bg-blue-50 text-blue-500' },
    { title: 'Verified Profiles', value: 0, icon: FileCheck, color: 'bg-green-50 text-green-500' },
    { title: 'Pending Verification', value: 0, icon: Clock, color: 'bg-yellow-50 text-yellow-500' },
    { title: 'Active Jobs', value: 0, icon: Briefcase, color: 'bg-purple-50 text-purple-500' },
    { title: 'Total Applications', value: 0, icon: CheckCircle2, color: 'bg-indigo-50 text-indigo-500' },
    { title: 'Placement Rate', value: '0%', icon: BarChart2, color: 'bg-pink-50 text-pink-500' },
  ]);
  
  const [placementData, setPlacementData] = useState([]);
  const [companyData, setCompanyData] = useState([]);
  const [verificationRequests, setVerificationRequests] = useState<StudentProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        // Fetch student stats
        const { data: studentProfiles } = await supabase
          .from('student_profiles')
          .select('*');
        
        const totalStudents = studentProfiles?.length || 0;
        const verifiedStudents = studentProfiles?.filter(p => p.is_verified).length || 0;
        const pendingStudents = totalStudents - verifiedStudents;
        
        // Fetch pending verification requests
        const { data: pendingVerifications } = await supabase
          .from('student_profiles')
          .select('*')
          .eq('verification_status', 'pending')
          .order('created_at', { ascending: false })
          .limit(5);
        
        setVerificationRequests(pendingVerifications || []);
        
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
        
        // For now, use sample data for charts until we have enough real data
        // In a real application, you would compute this from the database
        setPlacementData([
          { name: 'Computer Science', placed: 12, total: 15 },
          { name: 'Electronics', placed: 8, total: 10 },
          { name: 'Mechanical', placed: 6, total: 12 },
          { name: 'Civil', placed: 4, total: 8 },
          { name: 'Electrical', placed: 7, total: 9 },
        ]);
        
        setCompanyData([
          { name: 'TCS', value: 10 },
          { name: 'Infosys', value: 8 },
          { name: 'Wipro', value: 7 },
          { name: 'Amazon', value: 4 },
          { name: 'Microsoft', value: 3 },
          { name: 'Others', value: 5 },
        ]);
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

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
          <>
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
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Department-wise Placement</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={placementData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="placed" name="Placed" fill="#3b82f6" />
                        <Bar dataKey="total" name="Total Students" fill="#93c5fd" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Company-wise Placements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <RePieChart>
                        <Pie
                          data={companyData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {companyData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </RePieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Verification Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  {verificationRequests.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                          <tr>
                            <th className="px-6 py-3">Name</th>
                            <th className="px-6 py-3">Phone</th>
                            <th className="px-6 py-3">Gender</th>
                            <th className="px-6 py-3">Submitted On</th>
                            <th className="px-6 py-3">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {verificationRequests.map((request) => (
                            <tr key={request.id} className="bg-white border-b">
                              <td className="px-6 py-4 font-medium text-gray-900">
                                {`${request.first_name} ${request.last_name}`}
                              </td>
                              <td className="px-6 py-4">{request.phone}</td>
                              <td className="px-6 py-4">{request.gender}</td>
                              <td className="px-6 py-4">{new Date(request.created_at || '').toLocaleDateString()}</td>
                              <td className="px-6 py-4">
                                <Link 
                                  to={`/admin/verification/${request.id}`}
                                  className="text-blue-600 hover:underline mr-3"
                                >
                                  Review
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="py-8 text-center text-gray-500">
                      No pending verification requests
                    </div>
                  )}
                  <div className="mt-4 text-center">
                    <Link 
                      to="/admin/verification" 
                      className="text-sm text-blue-600 hover:underline"
                    >
                      View All Requests
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
