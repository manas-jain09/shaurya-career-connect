
import React from 'react';
import StudentLayout from '@/components/layouts/StudentLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Clock, Briefcase, Building, Bell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// Mock data for jobs
const recentJobs = [
  {
    id: 1,
    title: 'Frontend Developer',
    company: 'TechCorp',
    location: 'Bangalore',
    package: '12 LPA',
    deadline: '2025-05-01',
    isEligible: true,
  },
  {
    id: 2,
    title: 'Software Engineer',
    company: 'Innovatech',
    location: 'Hyderabad',
    package: '14 LPA',
    deadline: '2025-04-25',
    isEligible: true,
  },
  {
    id: 3,
    title: 'Backend Developer',
    company: 'DataSystems',
    location: 'Pune',
    package: '16 LPA',
    deadline: '2025-05-10',
    isEligible: false,
  },
];

// Mock data for applications
const applications = [
  {
    id: 1,
    jobTitle: 'Product Manager',
    company: 'CloudWave',
    status: 'Shortlisted',
    appliedDate: '2025-03-15',
  },
  {
    id: 2,
    jobTitle: 'System Analyst',
    company: 'TechVision',
    status: 'Under Review',
    appliedDate: '2025-03-10',
  },
];

// Mock notifications
const notifications = [
  {
    id: 1,
    message: 'Your profile has been verified by admin',
    time: '2 hours ago',
  },
  {
    id: 2,
    message: 'New job posting from Amazon is available',
    time: '1 day ago',
  },
  {
    id: 3,
    message: 'You have been shortlisted for TechVision interview',
    time: '2 days ago',
  },
];

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Student Dashboard</h1>
            <p className="text-gray-600">Welcome back, {user?.name || 'Student'}</p>
          </div>
          
          {user?.isVerified ? (
            <div className="badge-verified mt-2 md:mt-0 flex items-center">
              <CheckCircle2 size={14} className="mr-1" /> Profile Verified
            </div>
          ) : (
            <div className="badge-unverified mt-2 md:mt-0 flex items-center">
              <Clock size={14} className="mr-1" /> Pending Verification
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-shaurya-light border-none">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-shaurya-primary">Total Applications</p>
                  <p className="text-3xl font-bold text-gray-800 mt-1">5</p>
                </div>
                <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center text-shaurya-primary">
                  <Briefcase size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-blue-50 border-none">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Shortlisted</p>
                  <p className="text-3xl font-bold text-gray-800 mt-1">2</p>
                </div>
                <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center text-blue-500">
                  <CheckCircle2 size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-green-50 border-none">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Eligible Jobs</p>
                  <p className="text-3xl font-bold text-gray-800 mt-1">8</p>
                </div>
                <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center text-green-500">
                  <Building size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-yellow-50 border-none">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-600">New Notifications</p>
                  <p className="text-3xl font-bold text-gray-800 mt-1">3</p>
                </div>
                <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center text-yellow-500">
                  <Bell size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold">Recent Job Openings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentJobs.map((job) => (
                  <div key={job.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{job.title}</h3>
                        <p className="text-sm text-gray-500">
                          {job.company} • {job.location}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium text-gray-900">{job.package}</span>
                        <p className="text-xs text-gray-500">
                          Deadline: {new Date(job.deadline).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 flex justify-between items-center">
                      <span className={`text-xs px-2 py-1 rounded ${job.isEligible ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {job.isEligible ? 'Eligible' : 'Not Eligible'}
                      </span>
                      {job.isEligible && (
                        <button className="text-xs text-shaurya-primary hover:underline">
                          Apply Now
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center">
                <a 
                  href="/student/jobs" 
                  className="text-sm text-shaurya-primary hover:underline"
                >
                  View All Jobs
                </a>
              </div>
            </CardContent>
          </Card>
          
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold">Application Status</CardTitle>
              </CardHeader>
              <CardContent>
                {applications.length > 0 ? (
                  <div className="space-y-4">
                    {applications.map((app) => (
                      <div key={app.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-gray-900">{app.jobTitle}</h3>
                            <p className="text-sm text-gray-500">{app.company}</p>
                          </div>
                          <div className="text-right">
                            <span 
                              className={`text-xs px-2 py-1 rounded ${
                                app.status === 'Shortlisted' 
                                  ? 'bg-green-100 text-green-800' 
                                  : app.status === 'Rejected'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {app.status}
                            </span>
                            <p className="text-xs text-gray-500 mt-1">
                              Applied: {new Date(app.appliedDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <p>No applications yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold">Recent Notifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <div key={notification.id} className="border-b pb-3 last:border-b-0 last:pb-0">
                      <p className="text-sm text-gray-800">{notification.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-center">
                  <a 
                    href="/student/notifications" 
                    className="text-sm text-shaurya-primary hover:underline"
                  >
                    View All Notifications
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
};

export default Dashboard;
