import React, { useEffect, useState } from 'react';
import StudentLayout from '@/components/layouts/StudentLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Clock, Briefcase, Bell, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useStudentProfile } from '@/hooks/useStudentProfile';
import { useJobApplications } from '@/hooks/useJobApplications';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { Notification } from '@/types/database.types';
import { toast } from 'sonner';

const Dashboard = () => {
  const { user } = useAuth();
  const { profile, isLoading: profileLoading } = useStudentProfile();
  const { applications, counts, isLoading: applicationsLoading } = useJobApplications();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);

  // Fetch recent notifications
  const fetchRecentNotifications = async () => {
    if (!user) return;
    
    try {
      setNotificationsLoading(true);
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);
        
      if (error) throw error;
      
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching recent notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setNotificationsLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const diffHours = Math.floor(diff / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffHours < 1) {
      return 'Just now';
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return formatDate(dateString);
    }
  };

  useEffect(() => {
    if (user) {
      fetchRecentNotifications();
    }
  }, [user]);

  const isLoading = profileLoading || applicationsLoading;

  // Set up a real-time listener for new job postings
  useEffect(() => {
    if (!profile || !user) return;
    
    const channel = supabase
      .channel('job-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'job_postings'
        },
        async (payload) => {
          console.log('New job posting detected:', payload);
          
          // All students are now eligible for all jobs
          try {
            // Create a notification for every job
            const jobId = payload.new.id;
            const jobTitle = payload.new.title;
            const companyName = payload.new.company_name;
            
            toast.info(`New job opportunity available: ${jobTitle} at ${companyName}`);
            
            // Insert notification into the database
            await supabase
              .from('notifications')
              .insert({
                user_id: user.id,
                title: 'New Job Opportunity',
                message: `A new position is available: ${jobTitle} at ${companyName}. Check it out!`,
                is_read: false
              });
              
            // Refresh notifications
            fetchRecentNotifications();
          } catch (error) {
            console.error('Error creating job notification:', error);
          }
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile, user]);

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Student Dashboard</h1>
            <p className="text-gray-600">Welcome back, {user?.name || 'Student'}</p>
          </div>
          
          {profile ? (
            profile.is_verified ? (
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center mt-2 md:mt-0">
                <CheckCircle2 size={14} className="mr-1" /> Profile Verified
              </div>
            ) : (
              <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm flex items-center mt-2 md:mt-0">
                <Clock size={14} className="mr-1" /> Pending Verification
              </div>
            )
          ) : null}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-shaurya-light border-none">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-shaurya-primary">Total Applications</p>
                  <p className="text-3xl font-bold text-gray-800 mt-1">
                    {isLoading ? '-' : counts.total}
                  </p>
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
                  <p className="text-3xl font-bold text-gray-800 mt-1">
                    {isLoading ? '-' : counts.shortlisted}
                  </p>
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
                  <p className="text-sm font-medium text-green-600">Resume</p>
                  <p className="text-3xl font-bold text-gray-800 mt-1">
                    <Link to="/student/profile" className="hover:underline">
                      {isLoading ? '-' : 'View'}
                    </Link>
                  </p>
                </div>
                <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center text-green-500">
                  <FileText size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-yellow-50 border-none">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-600">New Notifications</p>
                  <p className="text-3xl font-bold text-gray-800 mt-1">
                    {notificationsLoading ? '-' : notifications.filter(n => !n.is_read).length}
                  </p>
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
              <CardTitle className="text-lg font-semibold">Application Status</CardTitle>
            </CardHeader>
            <CardContent>
              {applicationsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin h-8 w-8 border-4 border-shaurya-primary border-t-transparent rounded-full"></div>
                </div>
              ) : (
                <>
                  {applications.length > 0 ? (
                    <div className="space-y-4">
                      {applications.slice(0, 3).map((app) => (
                        <div key={app.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium text-gray-900">
                                {app.job?.title || 'Job Title Unavailable'}
                              </h3>
                              <p className="text-sm text-gray-500">
                                {app.job?.company_name || 'Company Unavailable'}
                              </p>
                            </div>
                            <div className="text-right">
                              <span 
                                className={`text-xs px-2 py-1 rounded ${
                                  app.status === 'shortlisted' 
                                    ? 'bg-green-100 text-green-800' 
                                    : app.status === 'rejected'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}
                              >
                                {app.status.replace('_', ' ').charAt(0).toUpperCase() + app.status.replace('_', ' ').slice(1)}
                              </span>
                              <p className="text-xs text-gray-500 mt-1">
                                Applied: {formatDate(app.created_at || '')}
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
                </>
              )}
              <div className="mt-4 text-center">
                <Link 
                  to="/student/applications" 
                  className="text-sm text-shaurya-primary hover:underline"
                >
                  View All Applications
                </Link>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold">Recent Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              {notificationsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin h-8 w-8 border-4 border-shaurya-primary border-t-transparent rounded-full"></div>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <div key={notification.id} className="border-b pb-3 last:border-b-0 last:pb-0">
                        <p className="text-sm text-gray-800">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-1">{formatTimeAgo(notification.created_at || '')}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      <p>No notifications yet</p>
                    </div>
                  )}
                </div>
              )}
              <div className="mt-4 text-center">
                <Link 
                  to="/student/notifications" 
                  className="text-sm text-shaurya-primary hover:underline"
                >
                  View All Notifications
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </StudentLayout>
  );
};

export default Dashboard;
