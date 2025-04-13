
import React from 'react';
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

// Mock data for the dashboard
const statsData = [
  { title: 'Total Students', value: 358, icon: Users, color: 'bg-blue-50 text-blue-500' },
  { title: 'Verified Profiles', value: 287, icon: FileCheck, color: 'bg-green-50 text-green-500' },
  { title: 'Pending Verification', value: 71, icon: Clock, color: 'bg-yellow-50 text-yellow-500' },
  { title: 'Active Jobs', value: 24, icon: Briefcase, color: 'bg-purple-50 text-purple-500' },
  { title: 'Total Applications', value: 432, icon: CheckCircle2, color: 'bg-indigo-50 text-indigo-500' },
  { title: 'Placement Rate', value: '78%', icon: BarChart2, color: 'bg-pink-50 text-pink-500' },
];

// Mock data for charts
const placementData = [
  { name: 'Computer Science', placed: 52, total: 60 },
  { name: 'Electronics', placed: 35, total: 48 },
  { name: 'Mechanical', placed: 30, total: 45 },
  { name: 'Civil', placed: 25, total: 35 },
  { name: 'Electrical', placed: 28, total: 32 },
];

const companyData = [
  { name: 'TCS', value: 45 },
  { name: 'Infosys', value: 32 },
  { name: 'Wipro', value: 28 },
  { name: 'Amazon', value: 15 },
  { name: 'Microsoft', value: 10 },
  { name: 'Others', value: 25 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#8dd1e1'];

// Recent verification requests
const verificationRequests = [
  { id: 1, name: 'Priya Sharma', email: 'priya@example.com', department: 'Computer Science', submittedOn: '2025-04-10' },
  { id: 2, name: 'Rahul Gupta', email: 'rahul@example.com', department: 'Electronics', submittedOn: '2025-04-09' },
  { id: 3, name: 'Amit Singh', email: 'amit@example.com', department: 'Mechanical', submittedOn: '2025-04-08' },
];

const Dashboard = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
          <p className="text-gray-600">Overview of placement activities</p>
        </div>
        
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
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                      <th className="px-6 py-3">Name</th>
                      <th className="px-6 py-3">Email</th>
                      <th className="px-6 py-3">Department</th>
                      <th className="px-6 py-3">Submitted On</th>
                      <th className="px-6 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {verificationRequests.map((request) => (
                      <tr key={request.id} className="bg-white border-b">
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {request.name}
                        </td>
                        <td className="px-6 py-4">{request.email}</td>
                        <td className="px-6 py-4">{request.department}</td>
                        <td className="px-6 py-4">{new Date(request.submittedOn).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          <a 
                            href={`/admin/verification/${request.id}`}
                            className="text-shaurya-primary hover:underline mr-3"
                          >
                            Review
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 text-center">
                <a 
                  href="/admin/verification" 
                  className="text-sm text-shaurya-primary hover:underline"
                >
                  View All Requests
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
