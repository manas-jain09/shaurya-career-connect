
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import { ClassXDetails, ClassXIIDetails, GraduationDetails } from '@/types/database.types';

interface EducationSectionProps {
  classX: ClassXDetails | null;
  classXII: ClassXIIDetails | null;
  graduation: GraduationDetails | null;
  flaggedClassX: boolean;
  flaggedClassXII: boolean;
  flaggedGraduation: boolean;
}

const EducationSection: React.FC<EducationSectionProps> = ({
  classX,
  classXII,
  graduation,
  flaggedClassX,
  flaggedClassXII,
  flaggedGraduation
}) => {
  return (
    <div className="space-y-6">
      <Card className={flaggedClassX ? "border-amber-300" : ""}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Class X Details</CardTitle>
          {flaggedClassX && (
            <div className="flex items-center text-amber-600">
              <AlertTriangle size={16} className="mr-2" />
              <span className="text-sm">This section has been flagged</span>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {classX ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">School Name</p>
                <p>{classX.school_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Board</p>
                <p>{classX.board}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Passing Year</p>
                <p>{classX.passing_year}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Marks</p>
                <p>{classX.is_cgpa ? `${classX.marks} CGPA` : `${classX.marks}%`}</p>
              </div>
              {classX.marksheet_url && (
                <div className="col-span-2">
                  <p className="text-sm font-medium text-gray-500">Marksheet</p>
                  <a 
                    href={classX.marksheet_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center"
                  >
                    View Marksheet <ExternalLink size={14} className="ml-1" />
                  </a>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No Class X details provided</p>
          )}
        </CardContent>
      </Card>

      <Card className={flaggedClassXII ? "border-amber-300" : ""}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Class XII Details</CardTitle>
          {flaggedClassXII && (
            <div className="flex items-center text-amber-600">
              <AlertTriangle size={16} className="mr-2" />
              <span className="text-sm">This section has been flagged</span>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {classXII ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">School Name</p>
                <p>{classXII.school_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Board</p>
                <p>{classXII.board}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Passing Year</p>
                <p>{classXII.passing_year}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Marks</p>
                <p>{classXII.is_cgpa ? `${classXII.marks} CGPA` : `${classXII.marks}%`}</p>
              </div>
              {classXII.marksheet_url && (
                <div className="col-span-2">
                  <p className="text-sm font-medium text-gray-500">Marksheet</p>
                  <a 
                    href={classXII.marksheet_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center"
                  >
                    View Marksheet <ExternalLink size={14} className="ml-1" />
                  </a>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No Class XII details provided</p>
          )}
        </CardContent>
      </Card>

      <Card className={flaggedGraduation ? "border-amber-300" : ""}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Graduation Details</CardTitle>
          {flaggedGraduation && (
            <div className="flex items-center text-amber-600">
              <AlertTriangle size={16} className="mr-2" />
              <span className="text-sm">This section has been flagged</span>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {graduation ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">College Name</p>
                <p>{graduation.college_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Course</p>
                <p>{graduation.course}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Passing Year</p>
                <p>{graduation.passing_year}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Marks</p>
                <p>{graduation.is_cgpa ? `${graduation.marks} CGPA` : `${graduation.marks}%`}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm font-medium text-gray-500">Backlog Status</p>
                <p>{graduation.has_backlog ? 'Has Backlog' : 'No Backlog'}</p>
              </div>
              {graduation.marksheet_url && (
                <div className="col-span-2">
                  <p className="text-sm font-medium text-gray-500">Marksheet</p>
                  <a 
                    href={graduation.marksheet_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center"
                  >
                    View Marksheet <ExternalLink size={14} className="ml-1" />
                  </a>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No Graduation details provided</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EducationSection;
