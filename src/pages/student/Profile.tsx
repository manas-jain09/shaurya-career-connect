import React, { useState, useEffect } from 'react';
import StudentLayout from '@/components/layouts/StudentLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useStudentProfile } from '@/hooks/useStudentProfile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { EditIcon, CheckCircle2, XCircle, Upload, AlertTriangle, GraduationCap, Briefcase, Building2, Rocket } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { uploadFile } from '@/utils/helpers';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ProfilePage = () => {
  const { user } = useAuth();
  const { profile, classX, classXII, graduation, resume, isLoading, refreshData, isEligibleForJobs } = useStudentProfile();
  const [editing, setEditing] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);

  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    placementInterest: 'placement/internship'
  });

  const [classXForm, setClassXForm] = useState({
    schoolName: '',
    board: '',
    marks: '',
    passingYear: '',
    isCgpa: false,
    cgpaScale: '10'
  });

  const [classXIIForm, setClassXIIForm] = useState({
    schoolName: '',
    board: '',
    marks: '',
    passingYear: '',
    isCgpa: false,
    cgpaScale: '10'
  });

  const [graduationForm, setGraduationForm] = useState({
    collegeName: '',
    course: '',
    marks: '',
    passingYear: '',
    hasBacklog: false,
    isCgpa: false,
    cgpaScale: '10',
    division: ''
  });

  const getPlacementInterestIcon = () => {
    if (!profile?.placement_interest) return <Briefcase />;
    
    switch (profile.placement_interest) {
      case 'higher_studies':
        return <GraduationCap className="text-purple-500" />;
      case 'family_business':
        return <Building2 className="text-orange-500" />;
      case 'entrepreneurship':
        return <Rocket className="text-red-500" />;
      default:
        return <Briefcase className="text-blue-500" />;
    }
  };

  const getPlacementInterestText = () => {
    if (!profile?.placement_interest) return 'Interested in Placement/Internship';
    
    switch (profile.placement_interest) {
      case 'higher_studies':
        return 'Interested in Higher Studies';
      case 'family_business':
        return 'Interested in Family Business';
      case 'entrepreneurship':
        return 'Interested in Entrepreneurship';
      default:
        return 'Interested in Placement/Internship';
    }
  };

  const isSectionEditable = (section: string) => {
    if (!profile) return false;
    if (section === 'personal') return true;
    return !profile.is_verified;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    if (type !== 'resume' && !isSectionEditable(type)) {
      toast.error('You cannot modify this section after verification');
      return;
    }

    setUploading(true);
    try {
      let fileUrl = '';
      const folderPath = `student_${profile.id}`;
      
      fileUrl = await uploadFile(file, 'student_documents', folderPath) || '';
      
      if (!fileUrl) {
        toast.error('Failed to upload file');
        return;
      }

      if (type === 'resume') {
        if (resume) {
          await supabase
            .from('resumes')
            .update({ file_url: fileUrl })
            .eq('id', resume.id);
        } else {
          await supabase
            .from('resumes')
            .insert({ 
              student_id: profile.id, 
              file_url: fileUrl
            });
        }
      } else if (type === 'class_x') {
        await supabase
          .from('class_x_details')
          .update({ marksheet_url: fileUrl })
          .eq('student_id', profile.id);
      } else if (type === 'class_xii') {
        await supabase
          .from('class_xii_details')
          .update({ marksheet_url: fileUrl })
          .eq('student_id', profile.id);
      } else if (type === 'graduation') {
        if (graduation) {
          await supabase
            .from('graduation_details')
            .update({ marksheet_url: fileUrl })
            .eq('student_id', profile.id);
        } else {
          await supabase
            .from('graduation_details')
            .insert({
              student_id: profile.id,
              college_name: 'Please update',
              course: 'Please update',
              marks: 0,
              passing_year: new Date().getFullYear(),
              has_backlog: false,
              marksheet_url: fileUrl
            });
        }
      }

      await refreshData();
      toast.success('File uploaded successfully');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleEditProfile = async () => {
    if (!profile) return;
    
    try {
      await supabase
        .from('student_profiles')
        .update({
          first_name: profileForm.firstName,
          last_name: profileForm.lastName,
          phone: profileForm.phone,
          address: profileForm.address || null,
          placement_interest: profileForm.placementInterest
        })
        .eq('id', profile.id);
      
      await refreshData();
      setEditing(null);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const handleEditEducation = async (section: string) => {
    if (!profile || !isSectionEditable(section)) {
      toast.error('You cannot modify this section after verification');
      return;
    }
    
    setEditing(section);
    
    if (section === 'class_x' && classX) {
      setClassXForm({
        schoolName: classX.school_name,
        board: classX.board,
        marks: classX.marks.toString(),
        passingYear: classX.passing_year.toString(),
        isCgpa: classX.is_cgpa,
        cgpaScale: classX.cgpa_scale?.toString() || '10'
      });
    } else if (section === 'class_xii' && classXII) {
      setClassXIIForm({
        schoolName: classXII.school_name,
        board: classXII.board,
        marks: classXII.marks.toString(),
        passingYear: classXII.passing_year.toString(),
        isCgpa: classXII.is_cgpa,
        cgpaScale: classXII.cgpa_scale?.toString() || '10'
      });
    } else if (section === 'graduation' && graduation) {
      setGraduationForm({
        collegeName: graduation.college_name,
        course: graduation.course,
        marks: graduation.marks.toString(),
        passingYear: graduation.passing_year.toString(),
        hasBacklog: graduation.has_backlog,
        isCgpa: graduation.is_cgpa,
        cgpaScale: graduation.cgpa_scale?.toString() || '10',
        division: graduation.division || ''
      });
    }
  };

  const handleSaveEducation = async (section: string) => {
    if (!profile) return;
    
    try {
      if (section === 'class_x') {
        await supabase
          .from('class_x_details')
          .update({
            school_name: classXForm.schoolName,
            board: classXForm.board,
            marks: Number(classXForm.marks),
            passing_year: Number(classXForm.passingYear),
            is_cgpa: classXForm.isCgpa,
            cgpa_scale: classXForm.isCgpa ? Number(classXForm.cgpaScale) : null
          })
          .eq('student_id', profile.id);
      } else if (section === 'class_xii') {
        await supabase
          .from('class_xii_details')
          .update({
            school_name: classXIIForm.schoolName,
            board: classXIIForm.board,
            marks: Number(classXIIForm.marks),
            passing_year: Number(classXIIForm.passingYear),
            is_cgpa: classXIIForm.isCgpa,
            cgpa_scale: classXIIForm.isCgpa ? Number(classXIIForm.cgpaScale) : null
          })
          .eq('student_id', profile.id);
      } else if (section === 'graduation') {
        await supabase
          .from('graduation_details')
          .update({
            college_name: graduationForm.collegeName,
            course: graduationForm.course,
            marks: Number(graduationForm.marks),
            passing_year: Number(graduationForm.passingYear),
            has_backlog: graduationForm.hasBacklog,
            is_cgpa: graduationForm.isCgpa,
            cgpa_scale: graduationForm.isCgpa ? Number(graduationForm.cgpaScale) : null,
            division: graduationForm.division || null
          })
          .eq('student_id', profile.id);
      }
      
      await refreshData();
      setEditing(null);
      toast.success('Education details updated successfully');
    } catch (error) {
      console.error('Error updating education details:', error);
      toast.error('Failed to update education details');
    }
  };

  React.useEffect(() => {
    if (profile) {
      setProfileForm({
        firstName: profile.first_name,
        lastName: profile.last_name,
        phone: profile.phone,
        address: profile.address || '',
        placementInterest: profile.placement_interest || 'placement/internship'
      });
    }
  }, [profile]);

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
          <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>
          <p className="text-gray-600">View and update your profile information</p>
        </div>
        
        <Card className={profile?.is_verified ? "bg-green-50" : "bg-yellow-50"}>
          <CardContent className="p-4">
            <div className="flex items-center">
              {profile?.is_verified ? (
                <>
                  <CheckCircle2 className="text-green-500 mr-2" size={20} />
                  <div>
                    <p className="font-medium text-green-700">Profile Verified</p>
                    <p className="text-sm text-green-600">Your profile has been verified by the admin</p>
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="text-yellow-500 mr-2" size={20} />
                  <div>
                    <p className="font-medium text-yellow-700">Verification Pending</p>
                    <p className="text-sm text-yellow-600">
                      Your profile is awaiting verification. Status: {profile?.verification_status}
                    </p>
                    {profile?.verification_notes && (
                      <p className="text-sm text-yellow-600 mt-1">Note: {profile.verification_notes}</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card className={isEligibleForJobs ? "bg-blue-50" : "bg-orange-50"}>
          <CardContent className="p-4">
            <div className="flex items-center">
              {isEligibleForJobs ? (
                <>
                  <Briefcase className="text-blue-500 mr-2" size={20} />
                  <div>
                    <p className="font-medium text-blue-700">Eligible for Placements</p>
                    <p className="text-sm text-blue-600">You can apply for job postings</p>
                  </div>
                </>
              ) : (
                <>
                  <AlertTriangle className="text-orange-500 mr-2" size={20} />
                  <div>
                    <p className="font-medium text-orange-700">Opted Out of Placements</p>
                    <p className="text-sm text-orange-600">
                      {profile?.placement_interest === 'placement/internship' 
                        ? 'Your profile needs to be verified before you can apply for jobs'
                        : `You have indicated interest in ${profile?.placement_interest === 'higher_studies' 
                           ? 'higher studies' 
                           : profile?.placement_interest === 'family_business' 
                             ? 'family business' 
                             : 'entrepreneurship'}`
                      }
                    </p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg font-semibold">Personal Information</CardTitle>
              {editing === 'personal' ? (
                <Button size="sm" onClick={handleEditProfile}>Save</Button>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setEditing('personal')}>
                  <EditIcon size={16} className="mr-1" /> Edit
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {editing === 'personal' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input 
                    id="firstName" 
                    value={profileForm.firstName} 
                    onChange={e => setProfileForm({...profileForm, firstName: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input 
                    id="lastName" 
                    value={profileForm.lastName} 
                    onChange={e => setProfileForm({...profileForm, lastName: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input 
                    id="phone" 
                    value={profileForm.phone} 
                    onChange={e => setProfileForm({...profileForm, phone: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Textarea 
                    id="address" 
                    value={profileForm.address} 
                    onChange={e => setProfileForm({...profileForm, address: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="placementInterest">Career Interest</Label>
                  <Select 
                    value={profileForm.placementInterest} 
                    onValueChange={(value) => setProfileForm({...profileForm, placementInterest: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your career interest" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="placement/internship">Interested in Placement/Internship</SelectItem>
                      <SelectItem value="higher_studies">Interested in Higher Studies</SelectItem>
                      <SelectItem value="family_business">Interested in Family Business</SelectItem>
                      <SelectItem value="entrepreneurship">Interested in Entrepreneurship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">First Name</p>
                  <p>{profile?.first_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Last Name</p>
                  <p>{profile?.last_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p>{user?.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Phone</p>
                  <p>{profile?.phone}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Date of Birth</p>
                  <p>{profile?.dob ? new Date(profile.dob).toLocaleDateString() : '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Gender</p>
                  <p>{profile?.gender}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Career Interest</p>
                  <div className="flex items-center mt-1">
                    {getPlacementInterestIcon()}
                    <span className="ml-2">{getPlacementInterestText()}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Placement Policies</p>
                  <p>{profile?.agreed_to_policies ? 'Agreed to policies' : 'Not agreed to policies'}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm font-medium text-gray-500">Address</p>
                  <p>{profile?.address || '-'}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg font-semibold">Class X Details</CardTitle>
              {isSectionEditable('class_x') && classX && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleEditEducation('class_x')}
                >
                  <EditIcon size={16} className="mr-1" /> Edit
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {classX ? (
              <div>
                {editing === 'class_x' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="schoolName">School Name</Label>
                      <Input 
                        id="schoolName" 
                        value={classXForm.schoolName} 
                        onChange={e => setClassXForm({...classXForm, schoolName: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="board">Board</Label>
                      <Input 
                        id="board" 
                        value={classXForm.board} 
                        onChange={e => setClassXForm({...classXForm, board: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="marks">Marks</Label>
                      <Input 
                        id="marks" 
                        type="number"
                        value={classXForm.marks} 
                        onChange={e => setClassXForm({...classXForm, marks: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="passingYear">Passing Year</Label>
                      <Input 
                        id="passingYear" 
                        type="number"
                        value={classXForm.passingYear} 
                        onChange={e => setClassXForm({...classXForm, passingYear: e.target.value})}
                      />
                    </div>
                    <div className="md:col-span-2 flex justify-end space-x-2 mt-4">
                      <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
                      <Button onClick={() => handleSaveEducation('class_x')}>Save Changes</Button>
                    </div>
                  </div>
                ) : (
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
                      <p className="text-sm font-medium text-gray-500">Marks</p>
                      <p>{classX.marks}{classX.is_cgpa ? ` CGPA (Scale: ${classX.cgpa_scale})` : '%'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Passing Year</p>
                      <p>{classX.passing_year}</p>
                    </div>
                  </div>
                )}
                
                <Separator className="my-4" />
                
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Marksheet</p>
                  {classX.marksheet_url ? (
                    <div className="flex space-x-2">
                      <a 
                        href={classX.marksheet_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-shaurya-primary hover:underline"
                      >
                        View Uploaded Marksheet
                      </a>
                      {isSectionEditable('class_x') && (
                        <>
                          <span className="text-gray-400">|</span>
                          <label className="cursor-pointer text-gray-500 hover:text-shaurya-primary">
                            <span>Replace</span>
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              className="hidden"
                              onChange={(e) => handleFileUpload(e, 'class_x')}
                              disabled={uploading}
                            />
                          </label>
                        </>
                      )}
                    </div>
                  ) : (
                    <div>
                      <label className={`flex items-center gap-2 cursor-pointer inline-block px-4 py-2 border border-dashed border-gray-300 rounded-md hover:border-shaurya-primary ${!isSectionEditable('class_x') ? 'opacity-50 pointer-events-none' : ''}`}>
                        <Upload size={16} />
                        <span>Upload Marksheet</span>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, 'class_x')}
                          disabled={uploading || !isSectionEditable('class_x')}
                        />
                      </label>
                      {!isSectionEditable('class_x') && (
                        <p className="text-xs text-orange-500 mt-1">
                          You cannot modify this section after verification
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-gray-500 italic">No Class X details available. Please add your details.</p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg font-semibold">Class XII Details</CardTitle>
              {isSectionEditable('class_xii') && classXII && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleEditEducation('class_xii')}
                >
                  <EditIcon size={16} className="mr-1" /> Edit
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {classXII ? (
              <div>
                {editing === 'class_xii' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="schoolName">School Name</Label>
                      <Input 
                        id="schoolName" 
                        value={classXIIForm.schoolName} 
                        onChange={e => setClassXIIForm({...classXIIForm, schoolName: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="board">Board</Label>
                      <Input 
                        id="board" 
                        value={classXIIForm.board} 
                        onChange={e => setClassXIIForm({...classXIIForm, board: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="marks">Marks</Label>
                      <Input 
                        id="marks" 
                        type="number"
                        value={classXIIForm.marks} 
                        onChange={e => setClassXIIForm({...classXIIForm, marks: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="passingYear">Passing Year</Label>
                      <Input 
                        id="passingYear" 
                        type="number"
                        value={classXIIForm.passingYear} 
                        onChange={e => setClassXIIForm({...classXIIForm, passingYear: e.target.value})}
                      />
                    </div>
                    <div className="md:col-span-2 flex justify-end space-x-2 mt-4">
                      <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
                      <Button onClick={() => handleSaveEducation('class_xii')}>Save Changes</Button>
                    </div>
                  </div>
                ) : (
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
                      <p className="text-sm font-medium text-gray-500">Marks</p>
                      <p>{classXII.marks}{classXII.is_cgpa ? ` CGPA (Scale: ${classXII.cgpa_scale})` : '%'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Passing Year</p>
                      <p>{classXII.passing_year}</p>
                    </div>
                  </div>
                )}
                
                <Separator className="my-4" />
                
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Marksheet</p>
                  {classXII.marksheet_url ? (
                    <div className="flex space-x-2">
                      <a 
                        href={classXII.marksheet_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-shaurya-primary hover:underline"
                      >
                        View Uploaded Marksheet
                      </a>
                      {isSectionEditable('class_xii') && (
                        <>
                          <span className="text-gray-400">|</span>
                          <label className="cursor-pointer text-gray-500 hover:text-shaurya-primary">
                            <span>Replace</span>
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              className="hidden"
                              onChange={(e) => handleFileUpload(e, 'class_xii')}
                              disabled={uploading}
                            />
                          </label>
                        </>
                      )}
                    </div>
                  ) : (
                    <div>
                      <label className={`flex items-center gap-2 cursor-pointer inline-block px-4 py-2 border border-dashed border-gray-300 rounded-md hover:border-shaurya-primary ${!isSectionEditable('class_xii') ? 'opacity-50 pointer-events-none' : ''}`}>
                        <Upload size={16} />
                        <span>Upload Marksheet</span>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, 'class_xii')}
                          disabled={uploading || !isSectionEditable('class_xii')}
                        />
                      </label>
                      {!isSectionEditable('class_xii') && (
                        <p className="text-xs text-orange-500 mt-1">
                          You cannot modify this section after verification
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-gray-500 italic">No Class XII details available. Please add your details.</p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg font-semibold">Graduation Details</CardTitle>
              {isSectionEditable('graduation') && graduation && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleEditEducation('graduation')}
                >
                  <EditIcon size={16} className="mr-1" /> Edit
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {graduation ? (
              <div>
                {editing === 'graduation' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="collegeName">College Name</Label>
                      <Input 
                        id="collegeName" 
                        value={graduationForm.collegeName} 
                        onChange={e => setGraduationForm({...graduationForm, collegeName: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="course">Course</Label>
                      <Input 
                        id="course" 
                        value={graduationForm.course} 
                        onChange={e => setGraduationForm({...graduationForm, course: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="marks">Marks</Label>
                      <Input 
                        id="marks" 
                        type="number"
                        value={graduationForm.marks} 
                        onChange={e => setGraduationForm({...graduationForm, marks: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="passingYear">Passing Year</Label>
                      <Input 
                        id="passingYear" 
                        type="number"
                        value={graduationForm.passingYear} 
                        onChange={e => setGraduationForm({...graduationForm, passingYear: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="hasBacklog">Backlog Status</Label>
                      <div className="flex items-center mt-1">
                        <input 
                          type="checkbox" 
                          checked={graduationForm.hasBacklog} 
                          onChange={e => setGraduationForm({...graduationForm, hasBacklog: e.target.checked})}
                        />
                        <span className="ml-2">{graduationForm.hasBacklog ? "Has Backlog" : "No Backlog"}</span>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="division">Division</Label>
                      <Input 
                        id="division" 
                        value={graduationForm.division} 
                        onChange={e => setGraduationForm({...graduationForm, division: e.target.value})}
                      />
                    </div>
                    <div className="md:col-span-2 flex justify-end space-x-2 mt-4">
                      <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
                      <Button onClick={() => handleSaveEducation('graduation')}>Save Changes</Button>
                    </div>
                  </div>
                ) : (
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
                      <p className="text-sm font-medium text-gray-500">Marks</p>
                      <p>{graduation.marks}{graduation.is_cgpa ? ` CGPA (Scale: ${graduation.cgpa_scale})` : '%'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Passing Year</p>
                      <p>{graduation.passing_year}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Backlog Status</p>
                      <p className={graduation.has_backlog ? "text-red-500" : "text-green-500"}>
                        {graduation.has_backlog ? "Has Backlog" : "No Backlog"}
                      </p>
                    </div>
                    {graduation.division && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Division</p>
                        <p>{graduation.division}</p>
                      </div>
                    )}
                  </div>
                )}
                
                <Separator className="my-4" />
                
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Marksheet</p>
                  {graduation.marksheet_url ? (
                    <div className="flex space-x-2">
                      <a 
                        href={graduation.marksheet_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-shaurya-primary hover:underline"
                      >
                        View Uploaded Marksheet
                      </a>
                      {isSectionEditable('graduation') && (
                        <>
                          <span className="text-gray-400">|</span>
                          <label className="cursor-pointer text-gray-500 hover:text-shaurya-primary">
                            <span>Replace</span>
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              className="hidden"
                              onChange={(e) => handleFileUpload(e, 'graduation')}
                              disabled={uploading}
                            />
                          </label>
                        </>
                      )}
                    </div>
                  ) : (
                    <div>
                      <label className={`flex items-center gap-2 cursor-pointer inline-block px-4 py-2 border border-dashed border-gray-300 rounded-md hover:border-shaurya-primary ${!isSectionEditable('graduation') ? 'opacity-50 pointer-events-none' : ''}`}>
                        <Upload size={16} />
                        <span>Upload Marksheet</span>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, 'graduation')}
                          disabled={uploading || !isSectionEditable('graduation')}
                        />
                      </label>
                      {!isSectionEditable('graduation') && (
                        <p className="text-xs text-orange-500 mt-1">
                          You cannot modify this section after verification
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <p className="text-gray-500 italic mb-4">No Graduation details available. Please upload your marksheet to add your details.</p>
                {isSectionEditable('graduation') ? (
                  <label className="flex items-center gap-2 cursor-pointer inline-block px-4 py-2 border border-dashed border-gray-300 rounded-md hover:border-shaurya-primary">
                    <Upload size={16} />
                    <span>Upload Marksheet</span>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 'graduation')}
                      disabled={uploading}
                    />
                  </label>
                ) : (
                  <Alert variant="default">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Access Restricted</AlertTitle>
                    <AlertDescription>
                      You cannot add graduation details after your profile has been verified.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Resume</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {resume ? (
              <div>
                <div className="flex space-x-2">
                  <a 
                    href={resume.file_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-shaurya-primary hover:underline"
                  >
                    View Uploaded Resume
                  </a>
                  <span className="text-gray-400">|</span>
                  <label className="cursor-pointer text-gray-500 hover:text-shaurya-primary">
                    <span>Replace</span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 'resume')}
                      disabled={uploading}
                    />
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Last updated: {new Date(resume.updated_at).toLocaleString()}
                </p>
              </div>
            ) : (
              <div>
                <label className="flex items-center gap-2 cursor-pointer inline-block px-4 py-2 border border-dashed border-gray-300 rounded-md hover:border-shaurya-primary">
                  <Upload size={16} />
                  <span>Upload Resume</span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, 'resume')}
                    disabled={uploading}
                  />
                </label>
                <p className="text-xs text-gray-500 mt-2">
                  Accepted file formats: PDF, DOC, DOCX
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </StudentLayout>
  );
};

export default ProfilePage;
