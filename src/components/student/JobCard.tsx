
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { JobPosting, JobApplication } from '@/types/database.types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface JobCardProps {
  job: JobPosting;
  isApplied: boolean;
  isProfileVerified: boolean;
  isFlaggedProfile: boolean;
  onApply: () => void;
  isEligible?: boolean;
}

const JobCard: React.FC<JobCardProps> = ({ 
  job, 
  isApplied, 
  isProfileVerified, 
  isFlaggedProfile,
  onApply,
  isEligible = false
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  const isExpired = new Date(job.application_deadline) < new Date();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const handleApply = async () => {
    // Strictly check eligibility before submitting application
    if (!isEligible) {
      toast.error('You are not eligible for this job');
      return;
    }

    // Check if profile is verified
    if (!isProfileVerified) {
      toast.error('Your profile must be verified before applying');
      return;
    }

    // Check if profile has flagged sections
    if (isFlaggedProfile) {
      toast.error('Your profile has flagged sections that need to be fixed');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const { data: existingApplication, error: fetchError } = await supabase
        .from('job_applications')
        .select('id')
        .eq('job_id', job.id)
        .eq('student_id', user?.profileId || '')
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (existingApplication) {
        toast('You have already applied for this job');
        return;
      }

      const { error: insertError } = await supabase
        .from('job_applications')
        .insert({
          job_id: job.id,
          student_id: user?.profileId || '',
          status: 'applied'
        });

      if (insertError) throw insertError;

      toast.success('Application submitted successfully');
      
      await supabase.from('notifications').insert({
        user_id: user?.id || '',
        title: 'Job Application Submitted',
        message: `You have successfully applied for ${job.title} at ${job.company_name}.`,
        is_read: false
      });

      onApply();
    } catch (error) {
      console.error('Error applying for job:', error);
      toast.error('Failed to submit application');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDisabledReason = () => {
    if (isApplied) return "Already applied";
    if (isExpired) return "Application deadline passed";
    if (!isProfileVerified) return "Profile not verified";
    if (isFlaggedProfile) return "Profile has flagged sections";
    if (!isEligible) return "Not eligible for this job";
    return null;
  };

  const disabledReason = getDisabledReason();

  return (
    <>
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
            onClick={() => setShowDetailsDialog(true)}
          >
            View Details
          </Button>
          <div className="flex flex-col items-end">
            <Button
              variant="default"
              disabled={!!disabledReason || isSubmitting}
              onClick={handleApply}
            >
              {isSubmitting ? 'Applying...' : isApplied ? 'Applied' : 'Apply Now'}
            </Button>
            {disabledReason && (
              <p className="text-xs text-red-500 mt-1">{disabledReason}</p>
            )}
          </div>
        </CardFooter>
      </Card>

      {/* Job Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{job.title}</DialogTitle>
            <DialogDescription>{job.company_name}</DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh] overflow-auto pr-3">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-sm text-gray-500">Description</h4>
                <div className="mt-1 whitespace-pre-line">{job.description}</div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-gray-500">Location</h4>
                  <p>{job.location}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-gray-500">Package</h4>
                  <p>{job.package}</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-sm text-gray-500">Application Deadline</h4>
                <p>{formatDate(job.application_deadline)}</p>
              </div>
              
              <div>
                <h4 className="font-medium text-sm text-gray-500">Eligibility Requirements</h4>
                <ul className="mt-1 ml-5 list-disc space-y-1">
                  {job.min_class_x_marks && <li>Class X: Minimum {job.min_class_x_marks}%</li>}
                  {job.min_class_xii_marks && <li>Class XII: Minimum {job.min_class_xii_marks}%</li>}
                  {job.min_graduation_marks && <li>Graduation: Minimum {job.min_graduation_marks}%</li>}
                  {job.allow_backlog === false && <li>No backlogs allowed</li>}
                  {job.eligible_courses && job.eligible_courses.length > 0 && (
                    <li>Eligible Courses: {job.eligible_courses.join(', ')}</li>
                  )}
                  {job.eligible_passing_years && job.eligible_passing_years.length > 0 && (
                    <li>Eligible Passing Years: {job.eligible_passing_years.join(', ')}</li>
                  )}
                </ul>
              </div>
            </div>
          </ScrollArea>
          
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>Close</Button>
            <Button 
              onClick={handleApply}
              disabled={!!disabledReason || isSubmitting}
            >
              {isApplied ? 'Already Applied' : isSubmitting ? 'Applying...' : 'Apply Now'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default JobCard;
