
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, FileText, ExternalLink } from 'lucide-react';
import { Resume } from '@/types/database.types';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';

interface ResumeSectionProps {
  resume: Resume | null;
  flagged: boolean;
}

const ResumeSection: React.FC<ResumeSectionProps> = ({ resume, flagged }) => {
  return (
    <Card className={flagged ? "border-amber-300" : ""}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Resume</CardTitle>
        {flagged && (
          <div className="flex items-center text-amber-600">
            <AlertTriangle size={16} className="mr-2" />
            <span className="text-sm">This section has been flagged</span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {resume ? (
          <div className="text-center py-6">
            <FileText size={48} className="mx-auto text-gray-400 mb-3" />
            <h3 className="font-medium mb-1">Your Resume</h3>
            <p className="text-sm text-gray-500 mb-4">
              Last updated: {format(new Date(resume.updated_at || resume.created_at || ''), 'MMMM dd, yyyy')}
            </p>
            <div className="flex justify-center">
              <a 
                href={resume.file_url} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button>
                  <FileText size={16} className="mr-2" /> View Resume
                </Button>
              </a>
            </div>
            {flagged && (
              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-md text-left">
                <div className="flex items-start">
                  <AlertTriangle size={18} className="text-amber-600 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm text-amber-800 font-medium">Important Notice</p>
                    <p className="text-sm text-amber-700 mt-1">
                      Your resume has been flagged during verification. Please consider updating it as per admin's feedback.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <FileText size={48} className="mx-auto text-gray-300 mb-3" />
            <h3 className="font-medium text-gray-600 mb-2">No Resume Uploaded</h3>
            <p className="text-sm text-gray-500">
              You haven't uploaded your resume yet.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ResumeSection;
