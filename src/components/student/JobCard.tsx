
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { JobPosting, JobApplication } from '@/types/database.types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface JobCardProps {
  job: JobPosting;
  isApplied: boolean;
  isProfileVerified: boolean;
  onApply: () => void;
}

const JobCard: React.FC<JobCardProps> = ({ job, isApplied, isProfileVerified, onApply }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isApplying, setIsApplying] = React.useState(false);

  const isExpired = new Date(job.application_deadline) < new Date();

  const handleApply = async () => {
    if (!user?.profileId) {
      toast({
        title: 'Profile Required',
        description: 'Please complete your profile before applying',
        variant: 'destructive',
      });
      navigate('/student/profile');
      return;
    }

    if (!isProfileVerified) {
      toast({
        title: 'Profile Not Verified',
        description: 'Your profile must be verified by admin before you can apply',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsApplying(true);
      
      const application: Partial<JobApplication> = {
        job_id: job.id!,
        student_id: user.profileId,
        status: 'applied',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('job_applications')
        .insert(application);

      if (error) throw error;

      toast({
        title: 'Application Submitted',
        description: 'Your application has been submitted successfully',
      });

      onApply();
    } catch (error) {
      console.error('Error applying for job:', error);
      toast({
        title: 'Application Failed',
        description: 'Failed to submit your application. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold">{job.title}</h3>
            <p className="text-gray-600">{job.company_name}</p>
          </div>
          {isExpired ? (
            <Badge variant="destructive">Expired</Badge>
          ) : (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-100">
              Active
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <p className="text-sm text-gray-500">Location</p>
            <p className="font-medium">{job.location}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Package</p>
            <p className="font-medium">{job.package}</p>
          </div>
        </div>
        <div>
          <p className="text-sm text-gray-500 mb-1">Deadline</p>
          <p className="font-medium">
            {new Date(job.application_deadline).toLocaleDateString()}
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <Button
          variant="outline"
          onClick={() => {
            // View job details logic
          }}
        >
          View Details
        </Button>
        <Button
          variant="default"
          disabled={isApplied || isExpired || isApplying || !isProfileVerified}
          onClick={handleApply}
        >
          {isApplying ? 'Applying...' : isApplied ? 'Applied' : 'Apply Now'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default JobCard;
