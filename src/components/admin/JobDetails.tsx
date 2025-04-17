
import React from 'react';
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { JobPosting } from '@/types/database.types';
import { CalendarIcon, MapPinIcon, BriefcaseIcon, BadgeIndianRupeeIcon, ClockIcon } from 'lucide-react';

interface JobDetailsProps {
  job: JobPosting;
  onEdit: () => void;
  onClose: () => void;
  isCompanyView?: boolean;
}

const JobDetails: React.FC<JobDetailsProps> = ({ job, onEdit, onClose, isCompanyView = false }) => {
  // Format eligibility criteria for display
  const formatMarksCriteria = (regular: number | null | undefined, cgpa: number | null | undefined) => {
    if (regular && cgpa) {
      return `${regular}% or CGPA ${cgpa}/${job.cgpa_scale || 10}`;
    } else if (regular) {
      return `${regular}%`;
    } else if (cgpa) {
      return `CGPA ${cgpa}/${job.cgpa_scale || 10}`;
    }
    return 'No criteria set';
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

  return (
    <>
      <DialogHeader className="space-y-2">
        <DialogTitle>
          <div className="flex items-center justify-between">
            <span className="text-xl">{job.title}</span>
            {getStatusBadge(job.status)}
          </div>
        </DialogTitle>
        <DialogDescription>
          <div className="flex flex-col sm:flex-row sm:items-center text-sm text-gray-600 gap-2 sm:gap-6 mt-1">
            <div className="flex items-center">
              <BriefcaseIcon className="mr-1 h-4 w-4" />
              {job.company_name}
            </div>
            <div className="flex items-center">
              <MapPinIcon className="mr-1 h-4 w-4" />
              {job.location}
            </div>
            <div className="flex items-center">
              <BadgeIndianRupeeIcon className="mr-1 h-4 w-4" />
              {job.package}
            </div>
          </div>
        </DialogDescription>
      </DialogHeader>

      <div className="py-4 space-y-6">
        <div>
          <h3 className="font-medium mb-2">Job Description</h3>
          <div className="text-sm text-gray-700 space-y-2">
            {job.description.split('\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="font-medium mb-2">Key Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center text-sm text-gray-600 mb-4">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  <span>Application Deadline: {format(new Date(job.application_deadline), 'MMMM dd, yyyy')}</span>
                </div>
                
                <CardTitle className="text-base mb-3">Eligibility Criteria</CardTitle>
                <ul className="space-y-2 text-sm">
                  <li className="flex justify-between">
                    <span className="text-gray-600">Class X:</span>
                    <span>{formatMarksCriteria(job.min_class_x_marks, job.min_class_x_cgpa)}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-gray-600">Class XII:</span>
                    <span>{formatMarksCriteria(job.min_class_xii_marks, job.min_class_xii_cgpa)}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-gray-600">Graduation:</span>
                    <span>{formatMarksCriteria(job.min_graduation_marks, job.min_graduation_cgpa)}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-gray-600">Backlog Policy:</span>
                    <span>{job.allow_backlog ? 'Allowed' : 'Not Allowed'}</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center text-sm text-gray-600 mb-4">
                  <ClockIcon className="mr-2 h-4 w-4" />
                  <span>Posted: {job.created_at ? format(new Date(job.created_at), 'MMMM dd, yyyy') : 'N/A'}</span>
                </div>
                
                <CardTitle className="text-base mb-3">Additional Criteria</CardTitle>
                <ul className="space-y-2 text-sm">
                  <li>
                    <span className="text-gray-600">Eligible Courses:</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {job.eligible_courses && job.eligible_courses.length > 0 ? (
                        job.eligible_courses.map((course, index) => (
                          <Badge key={index} variant="outline" className="bg-blue-50 border-blue-200">
                            {course}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-gray-500">All courses eligible</span>
                      )}
                    </div>
                  </li>
                  <li className="mt-3">
                    <span className="text-gray-600">Eligible Passing Years:</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {job.eligible_passing_years && job.eligible_passing_years.length > 0 ? (
                        job.eligible_passing_years.map((year, index) => (
                          <Badge key={index} variant="outline" className="bg-green-50 border-green-200">
                            {year}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-gray-500">All years eligible</span>
                      )}
                    </div>
                  </li>
                  {job.company_code && (
                    <li className="mt-3">
                      <span className="text-gray-600">Company Code:</span>
                      <div className="mt-1">
                        <Badge variant="outline" className="bg-gray-50 border-gray-200">
                          {job.company_code}
                        </Badge>
                      </div>
                    </li>
                  )}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <DialogFooter>
        <div className="flex justify-between w-full">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {!isCompanyView && (
            <Button onClick={onEdit}>
              Edit Job
            </Button>
          )}
        </div>
      </DialogFooter>
    </>
  );
};

export default JobDetails;
