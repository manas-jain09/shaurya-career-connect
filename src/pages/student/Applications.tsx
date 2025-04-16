import React from 'react';
import StudentLayout from '@/components/layouts/StudentLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useJobApplications } from '@/hooks/useJobApplications';
import { useStudentProfile } from '@/hooks/useStudentProfile';
import { JobApplicationStatus } from '@/types/database.types';
import { Briefcase, AlertTriangle, Clock, CheckCircle2, XCircle, Users, Lock, FileDown, GraduationCap, Award, Building } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getStatusBadgeClass, formatStatus } from '@/utils/statusHelpers';

const statusDisplayConfig = {
  applied: {
    label: 'Applied',
    color: 'bg-blue-100 text-blue-800',
    icon: <Clock className="h-4 w-4 text-blue-500" />
  },
  under_review: {
    label: 'Under Review',
    color: 'bg-yellow-100 text-yellow-800',
    icon: <Users className="h-4 w-4 text-yellow-500" />
  },
  shortlisted: {
    label: 'Shortlisted',
    color: 'bg-purple-100 text-purple-800',
    icon: <Briefcase className="h-4 w-4 text-purple-500" />
  },
  selected: {
    label: 'Selected',
    color: 'bg-green-100 text-green-800',
    icon: <CheckCircle2 className="h-4 w-4 text-green-500" />
  },
  rejected: {
    label: 'Rejected',
    color: 'bg-red-100 text-red-800',
    icon: <XCircle className="h-4 w-4 text-red-500" />
  },
  internship: {
    label: 'Internship',
    color: 'bg-indigo-100 text-indigo-800',
    icon: <GraduationCap className="h-4 w-4 text-indigo-500" />
  },
  ppo: {
    label: 'PPO',
    color: 'bg-pink-100 text-pink-800',
    icon: <Award className="h-4 w-4 text-pink-500" />
  },
  placement: {
    label: 'Placement',
    color: 'bg-green-100 text-green-800',
    icon: <Building className="h-4 w-4 text-green-500" />
  }
};

const Applications = () => {
  const { applications, isLoading, error, counts } = useJobApplications();
  const { profile } = useStudentProfile();
  const isBlocked = profile?.is_blocked || false;

  if (isLoading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin w-8 h-8 border-4 border-shaurya-primary border-t-transparent rounded-full"></div>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Applications</h1>
          <p className="text-gray-600">Track all your job applications in one place</p>
        </div>

        {isBlocked && (
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-4 flex items-center space-x-3">
              <Lock className="h-5 w-5 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-700">Your account is blocked</h3>
                <p className="text-sm text-red-600">
                  Your account has been blocked by the administrator. You cannot apply for new jobs until this restriction is lifted.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 md:grid-cols-8 gap-4">
          <Card className="bg-gray-50">
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <div className="text-3xl font-bold">{counts.total}</div>
              <div className="text-sm text-gray-500">Total</div>
            </CardContent>
          </Card>
          <Card className="bg-blue-50">
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <div className="text-3xl font-bold text-blue-600">{counts.applied}</div>
              <div className="text-sm text-blue-600">Applied</div>
            </CardContent>
          </Card>
          <Card className="bg-yellow-50">
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <div className="text-3xl font-bold text-yellow-600">{counts.underReview}</div>
              <div className="text-sm text-yellow-600">Under Review</div>
            </CardContent>
          </Card>
          <Card className="bg-purple-50">
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <div className="text-3xl font-bold text-purple-600">{counts.shortlisted}</div>
              <div className="text-sm text-purple-600">Shortlisted</div>
            </CardContent>
          </Card>
          <Card className="bg-green-50">
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <div className="text-3xl font-bold text-green-600">{counts.selected}</div>
              <div className="text-sm text-green-600">Selected</div>
            </CardContent>
          </Card>
          <Card className="bg-indigo-50">
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <div className="text-3xl font-bold text-indigo-600">{counts.internship || 0}</div>
              <div className="text-sm text-indigo-600">Internship</div>
            </CardContent>
          </Card>
          <Card className="bg-pink-50">
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <div className="text-3xl font-bold text-pink-600">{counts.ppo || 0}</div>
              <div className="text-sm text-pink-600">PPO</div>
            </CardContent>
          </Card>
          <Card className="bg-green-50">
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <div className="text-3xl font-bold text-green-600">{counts.placement || 0}</div>
              <div className="text-sm text-green-600">Placement</div>
            </CardContent>
          </Card>
        </div>

        {applications.length === 0 ? (
          <Card>
            <CardContent className="p-6 flex flex-col items-center justify-center">
              <AlertTriangle className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-700">No Applications Found</h3>
              <p className="text-gray-500 text-center mt-2">
                You haven't applied to any jobs yet. Check out the job listings to get started.
              </p>
            </CardContent>
          </Card>
        ) : (
          <ScrollArea className="w-full">
            <div className="space-y-4 min-w-[800px] w-full pr-4">
              {applications.map((application) => (
                <Card key={application.id} className="overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    <div className="p-4 md:p-6 flex-grow">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div>
                          <h3 className="text-lg font-bold">{application.job?.title}</h3>
                          <p className="text-gray-600">{application.job?.company_name}</p>
                        </div>
                        <div className="flex items-center mt-2 md:mt-0">
                          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusDisplayConfig[application.status as JobApplicationStatus].color}`}>
                            {statusDisplayConfig[application.status as JobApplicationStatus].icon}
                            <span className="ml-1">{statusDisplayConfig[application.status as JobApplicationStatus].label}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Location</p>
                          <p className="font-medium">{application.job?.location || 'Not specified'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Package</p>
                          <p className="font-medium">{application.job?.package || 'Not specified'}</p>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex justify-between items-end">
                        <div>
                          <p className="text-sm text-gray-500">Applied On</p>
                          <p className="font-medium">{new Date(application.created_at).toLocaleDateString()}</p>
                        </div>
                        
                        {application.offer_letter_url && ['selected', 'internship', 'ppo'].includes(application.status) && (
                          <a 
                            href={application.offer_letter_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-blue-600 hover:text-blue-800"
                          >
                            <FileDown className="h-4 w-4 mr-1" />
                            <span>Download Offer Letter</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </StudentLayout>
  );
};

export default Applications;
