
import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  BarChart as BarChartIcon, 
  PieChart as PieChartIcon,
  Calendar,
  Download,
  BarChart2,
  FileSpreadsheet
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Chart colors
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#8dd1e1'];

const Reports = () => {
  const [departmentData, setDepartmentData] = useState<any[]>([]);
  const [companyData, setCompanyData] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      // Fetch data for placement by department (simplified example)
      const { data: graduationData, error: gradError } = await supabase
        .from('graduation_details')
        .select(`
          course,
          student_id,
          student_profiles!graduation_details_student_id_fkey(is_verified)
        `);

      if (gradError) throw gradError;

      // Count students by course
      const departmentCounts: Record<string, { total: number, placed: number }> = {};
      
      // Get all applications to determine placed students
      const { data: applications, error: appError } = await supabase
        .from('job_applications')
        .select('student_id, status');
      
      if (appError) throw appError;

      // Map of student IDs who are placed (selected)
      const placedStudents = new Set(
        applications
          ?.filter(app => app.status === 'selected')
          .map(app => app.student_id) || []
      );

      // Process graduation data to get department stats
      graduationData?.forEach(grad => {
        const course = grad.course;
        const isVerified = grad.student_profiles?.is_verified;
        const isPlaced = placedStudents.has(grad.student_id);
        
        if (!departmentCounts[course]) {
          departmentCounts[course] = { total: 0, placed: 0 };
        }
        
        if (isVerified) {
          departmentCounts[course].total++;
          
          if (isPlaced) {
            departmentCounts[course].placed++;
          }
        }
      });

      // Convert to array format for chart
      const deptData = Object.keys(departmentCounts).map(course => ({
        name: course,
        total: departmentCounts[course].total,
        placed: departmentCounts[course].placed
      }));
      
      setDepartmentData(deptData);

      // Fetch data for placement by company
      const { data: jobsData, error: jobsError } = await supabase
        .from('job_applications')
        .select(`
          status,
          job:job_id(company_name)
        `)
        .eq('status', 'selected');

      if (jobsError) throw jobsError;

      // Count placements by company
      const companyCounts: Record<string, number> = {};
      
      jobsData?.forEach(app => {
        const company = app.job?.company_name || 'Unknown';
        
        if (!companyCounts[company]) {
          companyCounts[company] = 0;
        }
        
        companyCounts[company]++;
      });

      // Convert to array format for chart
      const compData = Object.keys(companyCounts).map(company => ({
        name: company,
        value: companyCounts[company]
      }));
      
      setCompanyData(compData);

      // Application status distribution
      const { data: statusDistData, error: statusError } = await supabase
        .from('job_applications')
        .select('status');

      if (statusError) throw statusError;

      // Count applications by status
      const statusCounts: Record<string, number> = {
        applied: 0,
        under_review: 0,
        shortlisted: 0,
        selected: 0,
        rejected: 0
      };
      
      statusDistData?.forEach(app => {
        if (statusCounts[app.status] !== undefined) {
          statusCounts[app.status]++;
        }
      });

      // Convert to array format for chart
      const statData = Object.keys(statusCounts).map(status => ({
        name: status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' '),
        value: statusCounts[status]
      }));
      
      setStatusData(statData);
    } catch (error) {
      console.error('Error fetching report data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load report data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const exportDepartmentData = () => {
    if (departmentData.length === 0) {
      toast({
        title: "No Data",
        description: "There is no department data to export",
        variant: "destructive"
      });
      return;
    }
    
    // CSV Headers
    let csvContent = "Department,Total Students,Placed Students,Placement Rate\n";
    
    // Add rows
    departmentData.forEach(dept => {
      const placementRate = dept.total > 0 
        ? ((dept.placed / dept.total) * 100).toFixed(2) + '%'
        : '0%';
      
      csvContent += `"${dept.name}","${dept.total}","${dept.placed}","${placementRate}"\n`;
    });
    
    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "department_placement.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportCompanyData = () => {
    if (companyData.length === 0) {
      toast({
        title: "No Data",
        description: "There is no company data to export",
        variant: "destructive"
      });
      return;
    }
    
    // CSV Headers
    let csvContent = "Company,Placements\n";
    
    // Add rows
    companyData.forEach(company => {
      csvContent += `"${company.name}","${company.value}"\n`;
    });
    
    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "company_placement.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded shadow-sm">
          <p className="font-medium text-gray-700">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
  
    return null;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Placement Reports</h1>
          <p className="text-gray-600">Analytics and statistics of placement activities</p>
        </div>

        {loading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <Tabs defaultValue="department">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="department" className="flex items-center">
                <BarChartIcon size={16} className="mr-2" /> Department Wise
              </TabsTrigger>
              <TabsTrigger value="company" className="flex items-center">
                <PieChartIcon size={16} className="mr-2" /> Company Wise
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="department" className="mt-6 space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Department-wise Placement</CardTitle>
                  <Button variant="outline" size="sm" onClick={exportDepartmentData}>
                    <Download size={16} className="mr-2" /> Export CSV
                  </Button>
                </CardHeader>
                <CardContent>
                  {departmentData.length > 0 ? (
                    <div className="h-96">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={departmentData}
                          margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="name" 
                            angle={-45} 
                            textAnchor="end" 
                            height={70} 
                            interval={0} 
                          />
                          <YAxis />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                          <Bar dataKey="total" name="Total Students" fill="#93c5fd" />
                          <Bar dataKey="placed" name="Placed" fill="#3b82f6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-60">
                      <BarChart2 size={40} className="text-gray-300 mb-3" />
                      <p className="text-gray-500">No department data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Department-wise Data Table</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {departmentData.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Placed</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Placement %</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {departmentData.map((dept, index) => (
                              <tr key={index}>
                                <td className="px-6 py-4 whitespace-nowrap">{dept.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{dept.total}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{dept.placed}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {dept.total > 0 ? ((dept.placed / dept.total) * 100).toFixed(2) + '%' : '0%'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-40">
                        <FileSpreadsheet size={30} className="text-gray-300 mb-2" />
                        <p className="text-gray-500">No data available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Application Status Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {statusData.length > 0 ? (
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={statusData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                              {statusData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-60">
                        <PieChartIcon size={40} className="text-gray-300 mb-3" />
                        <p className="text-gray-500">No status data available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="company" className="mt-6 space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Company-wise Placement</CardTitle>
                  <Button variant="outline" size="sm" onClick={exportCompanyData}>
                    <Download size={16} className="mr-2" /> Export CSV
                  </Button>
                </CardHeader>
                <CardContent>
                  {companyData.length > 0 ? (
                    <div className="h-96">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={companyData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={120}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {companyData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                          <Legend layout="vertical" verticalAlign="middle" align="right" />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-60">
                      <PieChartIcon size={40} className="text-gray-300 mb-3" />
                      <p className="text-gray-500">No company data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Company-wise Data Table</CardTitle>
                </CardHeader>
                <CardContent>
                  {companyData.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Placements</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {companyData.map((company, index) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap">{company.name}</td>
                              <td className="px-6 py-4 whitespace-nowrap">{company.value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-40">
                      <FileSpreadsheet size={30} className="text-gray-300 mb-2" />
                      <p className="text-gray-500">No data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AdminLayout>
  );
};

export default Reports;
