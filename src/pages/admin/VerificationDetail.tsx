import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  CheckCircle2, 
  XCircle, 
  User, 
  GraduationCap, 
  Calendar, 
  Phone, 
  MapPin,
  FileText,
  ArrowLeft,
  ExternalLink,
  AlertTriangle
} from 'lucide-react';
import { 
  StudentProfile, 
  ClassXDetails, 
  ClassXIIDetails, 
  GraduationDetails,
  Resume 
} from '@/types/database.types';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

const VerificationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [classX, setClassX] = useState<ClassXDetails | null>(null);
  const [classXII, setClassXII] = useState<ClassXIIDetails | null>(null);
  const [graduation, setGraduation] = useState<GraduationDetails | null>(null);
  const [resume, setResume] = useState<Resume | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [flaggedSections, setFlaggedSections] = useState<string[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      fetchStudentData();
    }
  }, [id]);

  const fetchStudentData = async () => {
    setLoading(true);
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('student_profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);
      setNotes(profileData.verification_notes || '');
      
      if (profileData.flagged_sections) {
        setFlaggedSections(profileData.flagged_sections);
      }

      const { data: classXData } = await supabase
        .from('class_x_details')
        .select('*')
        .eq('student_id', id)
        .maybeSingle();
      
      setClassX(classXData);

      const { data: classXIIData } = await supabase
        .from('class_xii_details')
        .select('*')
        .eq('student_id', id)
        .maybeSingle();
      
      setClassXII(classXIIData);

      const { data: graduationData } = await supabase
        .from('graduation_details')
        .select('*')
        .eq('student_id', id)
        .maybeSingle();
      
      setGraduation(graduationData);

      const { data: resumeData } = await supabase
        .from('resumes')
        .select('*')
        .eq('student_id', id)
        .maybeSingle();
      
      setResume(resumeData);
    } catch (error) {
      console.error('Error fetching student data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load student data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFlag = (section: string) => {
    setFlaggedSections(prev => {
      if (prev?.includes(section)) {
        return prev.filter(s => s !== section);
      } else {
        return [...(prev || []), section];
      }
    });
  };

  const handleVerify = async (approved: boolean) => {
    if (!profile || !id) return;

    setActionLoading(true);
    try {
      const status = approved ? 'approved' : 'rejected';
      
      const { error } = await supabase
        .from('student_profiles')
        .update({
          verification_status: status,
          is_verified: approved,
          verification_notes: notes,
          flagged_sections: flaggedSections || [],
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      let notificationTitle = approved 
        ? 'Profile Verification Approved' 
        : 'Profile Verification Rejected';
      
      let notificationMsg = '';
      
      if (approved) {
        if (flaggedSections.length > 0) {
          notificationMsg = `Your profile has been verified with some concerns in the following sections: ${flaggedSections.join(', ')}. This may limit your eligibility for some job postings.`;
        } else {
          notificationMsg = 'Your profile has been verified successfully. You can now apply for job postings.';
        }
      } else {
        notificationMsg = `Your profile verification was not approved. Reason: ${notes || 'No specific reason provided.'}`;
      }

      await supabase.from('notifications').insert({
        user_id: profile.user_id,
        title: notificationTitle,
        message: notificationMsg,
        is_read: false
      });

      toast({
        title: 'Success',
        description: `Profile has been ${approved ? 'approved' : 'rejected'} successfully`,
      });

      navigate('/admin/verification');
    } catch (error) {
      console.error('Error updating verification status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update verification status',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!profile) {
    return (
      <AdminLayout>
        <div className="text-center py-10">
          <h2 className="text-2xl font-bold text-gray-700">Student profile not found</h2>
          <p className="text-gray-500 mt-2">The profile you're looking for doesn't exist or has been removed.</p>
          <Button 
            className="mt-4" 
            onClick={() => navigate('/admin/verification')}
          >
            <ArrowLeft size={16} className="mr-2" /> Back to Verification
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/admin/verification')}
            >
              <ArrowLeft size={16} className="mr-1" /> Back
            </Button>
            <h1 className="text-2xl font-bold">Profile Verification</h1>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 hover:bg-red-50 border-red-200"
              onClick={() => handleVerify(false)}
              disabled={actionLoading}
            >
              <XCircle size={16} className="mr-1" /> Reject
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-green-600 hover:bg-green-50 border-green-200"
              onClick={() => handleVerify(true)}
              disabled={actionLoading}
            >
              <CheckCircle2 size={16} className="mr-1" /> Approve
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User size={18} className="mr-2" /> Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">
                    {profile.first_name} {profile.last_name}
                  </h3>
                  <div className="text-sm text-gray-500">
                    Student ID: {profile.id}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <Calendar size={16} className="mr-2 text-gray-500" />
                    <span>DOB: {format(new Date(profile.dob), 'dd MMM yyyy')}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Phone size={16} className="mr-2 text-gray-500" />
                    <span>{profile.phone}</span>
                  </div>
                  {profile.address && (
                    <div className="flex items-start text-sm">
                      <MapPin size={16} className="mr-2 mt-1 text-gray-500 flex-shrink-0" />
                      <span>{profile.address}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="mt-5">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText size={18} className="mr-2" /> Verification Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes about this profile verification..."
                    rows={6}
                  />
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="md:col-span-2">
            <Tabs defaultValue="education">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="education">
                  <GraduationCap size={16} className="mr-2" /> Education Details
                </TabsTrigger>
                <TabsTrigger value="resume">
                  <FileText size={16} className="mr-2" /> Resume
                </TabsTrigger>
              </TabsList>
              <div className="mt-4">
                <TabsContent value="education" className="space-y-5">
                  <Card className={flaggedSections.includes('class_x') ? 'border-yellow-300' : ''}>
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                      <CardTitle className="text-base">Class X Details</CardTitle>
                      <div className="flex items-center">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="flag-class-x" 
                            checked={flaggedSections.includes('class_x')}
                            onCheckedChange={() => handleToggleFlag('class_x')}
                          />
                          <label
                            htmlFor="flag-class-x"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center text-yellow-600"
                          >
                            <AlertTriangle size={16} className="mr-1" /> Flag this section
                          </label>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {classX ? (
                        <div className="grid grid-cols-2 gap-4">
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

                  <Card className={flaggedSections.includes('class_xii') ? 'border-yellow-300' : ''}>
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                      <CardTitle className="text-base">Class XII Details</CardTitle>
                      <div className="flex items-center">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="flag-class-xii" 
                            checked={flaggedSections.includes('class_xii')}
                            onCheckedChange={() => handleToggleFlag('class_xii')}
                          />
                          <label
                            htmlFor="flag-class-xii"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center text-yellow-600"
                          >
                            <AlertTriangle size={16} className="mr-1" /> Flag this section
                          </label>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {classXII ? (
                        <div className="grid grid-cols-2 gap-4">
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

                  <Card className={flaggedSections.includes('graduation') ? 'border-yellow-300' : ''}>
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                      <CardTitle className="text-base">Graduation Details</CardTitle>
                      <div className="flex items-center">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="flag-graduation" 
                            checked={flaggedSections.includes('graduation')}
                            onCheckedChange={() => handleToggleFlag('graduation')}
                          />
                          <label
                            htmlFor="flag-graduation"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center text-yellow-600"
                          >
                            <AlertTriangle size={16} className="mr-1" /> Flag this section
                          </label>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {graduation ? (
                        <div className="grid grid-cols-2 gap-4">
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
                </TabsContent>

                <TabsContent value="resume">
                  <Card className={flaggedSections.includes('resume') ? 'border-yellow-300' : ''}>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle>Student Resume</CardTitle>
                      <div className="flex items-center">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="flag-resume" 
                            checked={flaggedSections.includes('resume')}
                            onCheckedChange={() => handleToggleFlag('resume')}
                          />
                          <label
                            htmlFor="flag-resume"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center text-yellow-600"
                          >
                            <AlertTriangle size={16} className="mr-1" /> Flag this section
                          </label>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {resume ? (
                        <div className="text-center">
                          <a 
                            href={resume.file_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            <Button>
                              <FileText size={16} className="mr-2" /> View Resume
                            </Button>
                          </a>
                          <p className="mt-2 text-sm text-gray-500">
                            Last updated: {resume.updated_at ? format(new Date(resume.updated_at), 'dd MMM yyyy') : 'N/A'}
                          </p>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-500">No resume uploaded by the student</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default VerificationDetail;
