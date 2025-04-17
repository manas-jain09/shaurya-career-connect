
import React, { useState } from 'react';
import StudentLayout from '@/components/layouts/StudentLayout';
import { useStudentProfile } from '@/hooks/useStudentProfile';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle } from 'lucide-react';

// Import specific sections (modify paths as needed)
import ProfileSection from '@/components/student/ProfileSection';
import EducationSection from '@/components/student/EducationSection';
import ResumeSection from '@/components/student/ResumeSection';

const Profile = () => {
  const { profile, classX, classXII, graduation, resume, flaggedSections, isLoading } = useStudentProfile();
  const [activeTab, setActiveTab] = useState('personal');

  if (isLoading) {
    return (
      <StudentLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </StudentLayout>
    );
  }

  const isPersonalFlagged = flaggedSections?.includes('personal');
  const isClass10Flagged = flaggedSections?.includes('class_x');
  const isClass12Flagged = flaggedSections?.includes('class_xii');
  const isGraduationFlagged = flaggedSections?.includes('graduation');
  const isResumeFlagged = flaggedSections?.includes('resume');

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap justify-between items-center">
          <h1 className="text-2xl font-bold">My Profile</h1>
          <Link to="/student/profile/edit">
            <Button>Edit Profile</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1">
            {/* Profile Status Card */}
            <Card className="mb-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Profile Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Verification Status:</span>
                    <span className={`text-sm font-medium ${profile?.is_verified ? 'text-green-600' : 'text-amber-600'}`}>
                      {profile?.verification_status === 'pending' 
                        ? 'Pending' 
                        : profile?.verification_status === 'approved'
                        ? 'Verified'
                        : 'Rejected'}
                    </span>
                  </div>
                  {flaggedSections && flaggedSections.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex items-start text-amber-600">
                        <AlertTriangle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium">Flagged sections:</p>
                          <ul className="text-xs mt-1 space-y-1">
                            {isPersonalFlagged && <li>• Personal Information</li>}
                            {isClass10Flagged && <li>• Class X Details</li>}
                            {isClass12Flagged && <li>• Class XII Details</li>}
                            {isGraduationFlagged && <li>• Graduation Details</li>}
                            {isResumeFlagged && <li>• Resume</li>}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Profile Navigation Menu */}
            <div className="hidden md:block">
              <Tabs 
                orientation="vertical" 
                value={activeTab} 
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="flex flex-col h-auto w-full bg-muted/50">
                  <TabsTrigger 
                    value="personal" 
                    className={`justify-start ${isPersonalFlagged ? 'text-amber-700' : ''}`}
                  >
                    {isPersonalFlagged && <AlertTriangle size={14} className="mr-2 text-amber-600" />}
                    Personal Information
                  </TabsTrigger>
                  <TabsTrigger 
                    value="education" 
                    className={`justify-start ${isClass10Flagged || isClass12Flagged || isGraduationFlagged ? 'text-amber-700' : ''}`}
                  >
                    {(isClass10Flagged || isClass12Flagged || isGraduationFlagged) && 
                      <AlertTriangle size={14} className="mr-2 text-amber-600" />
                    }
                    Education
                  </TabsTrigger>
                  <TabsTrigger 
                    value="resume" 
                    className={`justify-start ${isResumeFlagged ? 'text-amber-700' : ''}`}
                  >
                    {isResumeFlagged && <AlertTriangle size={14} className="mr-2 text-amber-600" />}
                    Resume
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          <div className="md:col-span-3">
            {/* Mobile tabs - only visible on small screens */}
            <div className="md:hidden mb-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="personal" className="relative">
                    Personal
                    {isPersonalFlagged && (
                      <span className="absolute top-0 right-0 h-2 w-2 bg-amber-500 rounded-full"></span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="education" className="relative">
                    Education
                    {(isClass10Flagged || isClass12Flagged || isGraduationFlagged) && (
                      <span className="absolute top-0 right-0 h-2 w-2 bg-amber-500 rounded-full"></span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="resume" className="relative">
                    Resume
                    {isResumeFlagged && (
                      <span className="absolute top-0 right-0 h-2 w-2 bg-amber-500 rounded-full"></span>
                    )}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Tab Contents */}
            <div>
              {activeTab === 'personal' && (
                <ProfileSection profile={profile} flagged={isPersonalFlagged} />
              )}
              {activeTab === 'education' && (
                <EducationSection 
                  classX={classX} 
                  classXII={classXII} 
                  graduation={graduation}
                  flaggedClassX={isClass10Flagged}
                  flaggedClassXII={isClass12Flagged}
                  flaggedGraduation={isGraduationFlagged}
                />
              )}
              {activeTab === 'resume' && (
                <ResumeSection resume={resume} flagged={isResumeFlagged} />
              )}
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
};

export default Profile;
