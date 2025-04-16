
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Edit2, 
  Briefcase, 
  MapPin, 
  Calendar, 
  DollarSign, 
  BookOpen,
  UserCheck,
  Users,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { JobPosting, JobApplication, JobApplicationStatus } from '@/types/database.types';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';

interface JobDetailsProps {
  job: JobPosting;
  onEdit: () => void;
  onClose: () => void;
}

const JobDetails: React.FC<JobDetailsProps> = ({ job, onEdit, onClose }) => {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loadingApplications, setLoadingApplications] = useState(false);

  useEffect(() => {
    if (job?.id) {
      fetchApplications();
    }
  }, [job?.id]);

  const fetchApplications = async () => {
    if (!job.id) return;
    
    setLoadingApplications(true);
    try {
      const { data, error } = await supabase
        .from('job_applications')
        .select(`
          *,
          student_profile:student_id(
            first_name,
            last_name,
            phone,
            is_verified
          )
        `)
        .eq('job_id', job.id);

      if (error) throw error;

      // Cast the status from string to JobApplicationStatus
      const typedApplications = data?.map(app => ({
        ...app,
        status: app.status as JobApplicationStatus
      })) || [];

      setApplications(typedApplications);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoadingApplications(false);
    }
  };

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

  const getApplicationStatusBadge = (status: string) => {
    switch (status) {
      case 'applied':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          <Clock size={12} className="mr-1" /> Applied
        </Badge>;
      case 'shortlisted':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <UserCheck size={12} className="mr-1" /> Shortlisted
        </Badge>;
      case 'selected':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle size={12} className="mr-1" /> Selected
        </Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          <XCircle size={12} className="mr-1" /> Rejected
        </Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Format the deadline date
  const formattedDeadline = job.application_deadline
    ? format(new Date(job.application_deadline), 'MMMM dd, yyyy')
    : 'Not specified';

  // Check if job is past deadline
  const isPastDeadline = job.application_deadline
    ? new Date(job.application_deadline) < new Date()
    : false;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-bold">{job.title}</h2>
            {getStatusBadge(job.status)}
          </div>
          <p className="text-gray-600">{job.company_name}</p>
        </div>
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Edit2 size={16} className="mr-1" /> Edit
        </Button>
      </div>

      <Tabs defaultValue="details">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="details">
            <Briefcase size={16} className="mr-2" /> Job Details
          </TabsTrigger>
          <TabsTrigger value="applications">
            <Users size={16} className="mr-2" /> Applications
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="space-y-5 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1">
              <div className="text-sm text-gray-500">Location</div>
              <div className="flex items-center">
                <MapPin size={16} className="mr-2 text-gray-600" />
                {job.location}
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="text-sm text-gray-500">Package</div>
              <div className="flex items-center">
                <DollarSign size={16} className="mr-2 text-gray-600" />
                {job.package}
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="text-sm text-gray-500">Application Deadline</div>
              <div className="flex items-center">
                <Calendar size={16} className="mr-2 text-gray-600" />
                <span className={isPastDeadline ? 'text-red-500' : ''}>
                  {formattedDeadline} {isPastDeadline ? '(Passed)' : ''}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-sm text-gray-500">Backlog Status</div>
              <div className="flex items-center">
                {job.allow_backlog ? (
                  <><CheckCircle size={16} className="mr-2 text-green-600" /> Students with backlog can apply</>
                ) : (
                  <><XCircle size={16} className="mr-2 text-red-500" /> Students with backlog cannot apply</>
                )}
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center">
              <BookOpen size={16} className="mr-2" /> Job Description
            </h3>
            <div className="whitespace-pre-line text-gray-700">
              {job.description}
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-3">
            <h3 className="font-semibold">Eligibility Criteria</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border rounded-md p-3">
                <div className="text-sm text-gray-500 mb-1">Class X Minimum Marks</div>
                <div className="font-medium">
                  {job.min_class_x_marks ? `${job.min_class_x_marks}%` : 'Not specified'}
                </div>
              </div>
              
              <div className="border rounded-md p-3">
                <div className="text-sm text-gray-500 mb-1">Class XII Minimum Marks</div>
                <div className="font-medium">
                  {job.min_class_xii_marks ? `${job.min_class_xii_marks}%` : 'Not specified'}
                </div>
              </div>
              
              <div className="border rounded-md p-3">
                <div className="text-sm text-gray-500 mb-1">Graduation Minimum Marks</div>
                <div className="font-medium">
                  {job.min_graduation_marks ? `${job.min_graduation_marks}%` : 'Not specified'}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="applications" className="space-y-5 mt-4">
          {loadingApplications ? (
            <div className="flex justify-center p-6">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <>
              {applications.length > 0 ? (
                <ScrollArea className="h-[500px] rounded-lg border">
                  <div className="w-full min-w-[800px]">
                    <table className="w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {applications.map(app => (
                          <tr key={app.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-medium">
                                {app.student_profile?.first_name} {app.student_profile?.last_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {app.student_profile?.phone}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getApplicationStatusBadge(app.status)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {app.created_at ? format(new Date(app.created_at), 'MMM dd, yyyy') : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <Button variant="link" size="sm" className="h-8 p-0">
                                View Profile
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-10 border rounded-md">
                  <Users size={40} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">No applications received yet</p>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default JobDetails;
