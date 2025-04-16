
import React, { useState } from 'react';
import StudentLayout from '@/components/layouts/StudentLayout';
import { useJobApplications } from '@/hooks/useJobApplications';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Briefcase, 
  Building, 
  MapPin, 
  Clock, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  Clock3 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { JobApplicationStatus } from '@/types/database.types';
import { Skeleton } from '@/components/ui/skeleton';

const statusIcons = {
  applied: <Clock3 className="h-4 w-4 text-blue-500" />,
  under_review: <Clock className="h-4 w-4 text-orange-500" />,
  shortlisted: <CheckCircle className="h-4 w-4 text-green-500" />,
  rejected: <XCircle className="h-4 w-4 text-red-500" />,
  selected: <CheckCircle className="h-4 w-4 text-emerald-500" />
};

const statusColors = {
  applied: "bg-blue-100 text-blue-800",
  under_review: "bg-orange-100 text-orange-800",
  shortlisted: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800", 
  selected: "bg-emerald-100 text-emerald-800"
};

const statusLabels = {
  applied: "Applied",
  under_review: "Under Review",
  shortlisted: "Shortlisted",
  rejected: "Rejected",
  selected: "Selected"
};

const ApplicationsPage = () => {
  const { applications, isLoading, error, refreshData, counts } = useJobApplications();
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
    toast({
      title: "Refreshed",
      description: "Application data has been updated",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">My Applications</h1>
            <p className="text-gray-600">Track your job applications</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw size={16} className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Application Statistics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-2xl font-bold">{counts.total}</p>
            </CardContent>
          </Card>
          <Card className="bg-blue-50">
            <CardContent className="p-4">
              <p className="text-sm text-blue-700">Applied</p>
              <p className="text-2xl font-bold text-blue-800">{counts.applied}</p>
            </CardContent>
          </Card>
          <Card className="bg-orange-50">
            <CardContent className="p-4">
              <p className="text-sm text-orange-700">Under Review</p>
              <p className="text-2xl font-bold text-orange-800">{counts.underReview}</p>
            </CardContent>
          </Card>
          <Card className="bg-green-50">
            <CardContent className="p-4">
              <p className="text-sm text-green-700">Shortlisted</p>
              <p className="text-2xl font-bold text-green-800">{counts.shortlisted}</p>
            </CardContent>
          </Card>
          <Card className="bg-emerald-50">
            <CardContent className="p-4">
              <p className="text-sm text-emerald-700">Selected</p>
              <p className="text-2xl font-bold text-emerald-800">{counts.selected}</p>
            </CardContent>
          </Card>
        </div>

        {/* Applications List */}
        <Card>
          <CardHeader>
            <CardTitle>Application History</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              // Loading state
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-md" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[200px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              // Error state
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  {error}
                </AlertDescription>
              </Alert>
            ) : applications.length > 0 ? (
              // Applications table
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Job Title</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Package</TableHead>
                    <TableHead>Applied On</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((application) => (
                    <TableRow key={application.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <Building className="h-4 w-4 mr-2 text-gray-500" />
                          {application.job?.company_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Briefcase className="h-4 w-4 mr-2 text-gray-500" />
                          {application.job?.title}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                          {application.job?.location}
                        </div>
                      </TableCell>
                      <TableCell>{application.job?.package}</TableCell>
                      <TableCell>{formatDate(application.created_at || '')}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColors[application.status as JobApplicationStatus]}>
                          <div className="flex items-center">
                            {statusIcons[application.status as JobApplicationStatus]}
                            <span className="ml-1">{statusLabels[application.status as JobApplicationStatus]}</span>
                          </div>
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              // Empty state
              <div className="text-center py-10">
                <div className="mx-auto w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <Briefcase className="h-5 w-5 text-gray-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">No applications yet</h3>
                <p className="text-gray-500 mt-1">
                  You haven't applied to any jobs yet. Check the jobs page to find opportunities.
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => window.location.href = '/student/jobs'}
                >
                  Browse Jobs
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </StudentLayout>
  );
};

export default ApplicationsPage;
