
import React from 'react';
import { JobPosting } from '@/types/database.types';
import {
  DialogHeader,
  DialogTitle,
  DialogContent,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Package, GraduationCap, Clock, Check, X } from 'lucide-react';
import { format } from 'date-fns';

interface JobDetailsDialogProps {
  job: JobPosting;
}

const JobDetailsDialog: React.FC<JobDetailsDialogProps> = ({ job }) => {
  const formatCriteria = (value: number | null, type: string) => {
    if (value === null) return 'Not specified';
    return `${value}${type === 'cgpa' ? ' CGPA' : '%'}`;
  };

  return (
    <DialogContent className="max-w-3xl">
      <DialogHeader>
        <DialogTitle className="text-2xl font-bold">{job.title}</DialogTitle>
      </DialogHeader>

      <div className="space-y-6 py-4">
        {/* Company and Location */}
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center text-gray-600">
            <Package className="w-4 h-4 mr-2" />
            {job.company_name}
          </div>
          <div className="flex items-center text-gray-600">
            <MapPin className="w-4 h-4 mr-2" />
            {job.location}
          </div>
          <div className="flex items-center text-gray-600">
            <Calendar className="w-4 h-4 mr-2" />
            Deadline: {format(new Date(job.application_deadline), 'MMM dd, yyyy')}
          </div>
        </div>

        {/* Description */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Job Description</h3>
          <p className="whitespace-pre-wrap text-gray-700">{job.description}</p>
        </div>

        {/* Package */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Package</h3>
          <p className="text-gray-700">{job.package}</p>
        </div>

        {/* Eligibility Criteria */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Eligibility Criteria</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Class X</h4>
              <p className="text-gray-700">
                Minimum Marks: {formatCriteria(job.min_class_x_marks || job.min_class_x_cgpa, 
                job.min_class_x_cgpa ? 'cgpa' : 'percentage')}
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Class XII</h4>
              <p className="text-gray-700">
                Minimum Marks: {formatCriteria(job.min_class_xii_marks || job.min_class_xii_cgpa,
                job.min_class_xii_cgpa ? 'cgpa' : 'percentage')}
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Graduation</h4>
              <p className="text-gray-700">
                Minimum Marks: {formatCriteria(job.min_graduation_marks || job.min_graduation_cgpa,
                job.min_graduation_cgpa ? 'cgpa' : 'percentage')}
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Backlog Policy</h4>
              <div className="flex items-center">
                {job.allow_backlog ? (
                  <Check className="w-4 h-4 text-green-500 mr-2" />
                ) : (
                  <X className="w-4 h-4 text-red-500 mr-2" />
                )}
                <span className="text-gray-700">
                  {job.allow_backlog ? 'Backlog allowed' : 'No backlog allowed'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Requirements */}
        {(job.eligible_courses?.length > 0 || job.eligible_passing_years?.length > 0) && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Additional Requirements</h3>
            <div className="space-y-4">
              {job.eligible_courses && job.eligible_courses.length > 0 && (
                <div>
                  <h4 className="font-medium">Eligible Courses</h4>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {job.eligible_courses.map((course, index) => (
                      <Badge key={index} variant="secondary">
                        <GraduationCap className="w-3 h-3 mr-1" />
                        {course}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {job.eligible_passing_years && job.eligible_passing_years.length > 0 && (
                <div>
                  <h4 className="font-medium">Eligible Passing Years</h4>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {job.eligible_passing_years.map((year, index) => (
                      <Badge key={index} variant="secondary">
                        <Clock className="w-3 h-3 mr-1" />
                        {year}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DialogContent>
  );
};

export default JobDetailsDialog;
