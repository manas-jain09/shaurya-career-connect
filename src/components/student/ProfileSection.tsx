
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { StudentProfile } from '@/types/database.types';
import { AlertTriangle, User, Calendar, Phone, MapPin } from 'lucide-react';

interface ProfileSectionProps {
  profile: StudentProfile | null;
  flagged: boolean;
}

const ProfileSection: React.FC<ProfileSectionProps> = ({ profile, flagged }) => {
  if (!profile) {
    return <div className="text-center py-8">Profile information not available</div>;
  }

  return (
    <Card className={flagged ? "border-amber-300" : ""}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Personal Information</CardTitle>
        {flagged && (
          <div className="flex items-center text-amber-600">
            <AlertTriangle size={16} className="mr-2" />
            <span className="text-sm">This section has been flagged</span>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <User className="text-gray-500" size={16} />
              <div>
                <div className="text-sm font-medium text-gray-500">Full Name</div>
                <div>{profile.first_name} {profile.last_name}</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 mb-4">
              <Calendar className="text-gray-500" size={16} />
              <div>
                <div className="text-sm font-medium text-gray-500">Date of Birth</div>
                <div>{format(new Date(profile.dob), 'MMMM dd, yyyy')}</div>
              </div>
            </div>
          </div>
          
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Phone className="text-gray-500" size={16} />
              <div>
                <div className="text-sm font-medium text-gray-500">Phone Number</div>
                <div>{profile.phone}</div>
              </div>
            </div>
            
            {profile.address && (
              <div className="flex items-start space-x-2">
                <MapPin className="text-gray-500 mt-1" size={16} />
                <div>
                  <div className="text-sm font-medium text-gray-500">Address</div>
                  <div>{profile.address}</div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {profile.department && (
          <div className="pt-4 border-t border-gray-100">
            <div className="text-sm font-medium text-gray-500 mb-1">Department</div>
            <div>{profile.department}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfileSection;
