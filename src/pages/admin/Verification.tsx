import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/layouts/AdminLayout';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle,
  Clock,
  FileCheck,
  Calendar,
  Lock,
  Unlock
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { StudentProfile } from '@/types/database.types';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

const Verification = () => {
  const [profiles, setProfiles] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [blockingStudent, setBlockingStudent] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfiles();
  }, [filterStatus]);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('student_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filter if not 'all'
      if (filterStatus !== 'all') {
        query = query.eq('verification_status', filterStatus);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      setProfiles(data?.map(profile => ({
        ...profile,
        is_frozen: profile.is_frozen === true // Ensure boolean type
      })) || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      toast({
        title: 'Error',
        description: 'Failed to load student profiles',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleBlockStatus = async (profileId: string, currentBlockedStatus: boolean) => {
    setBlockingStudent(profileId);
    try {
      const { error } = await supabase
        .from('student_profiles')
        .update({ 
          is_blocked: !currentBlockedStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', profileId);

      if (error) throw error;

      // Create notification for the student
      const { data: profileData } = await supabase
        .from('student_profiles')
        .select('user_id')
        .eq('id', profileId)
        .single();

      if (profileData) {
        const notificationData = {
          user_id: profileData.user_id,
          title: currentBlockedStatus ? 'Account Unblocked' : 'Account Blocked',
          message: currentBlockedStatus 
            ? 'Your account has been unblocked. You can now apply for jobs.'
            : 'Your account has been blocked. Please contact the administrator for more information.',
          is_read: false,
          created_at: new Date().toISOString()
        };

        await supabase.from('notifications').insert(notificationData);
      }

      toast({
        title: 'Success',
        description: `Student ${currentBlockedStatus ? 'unblocked' : 'blocked'} successfully`
      });

      // Refresh profiles
      fetchProfiles();
    } catch (error) {
      console.error('Error toggling block status:', error);
      toast({
        title: 'Error',
        description: `Failed to ${currentBlockedStatus ? 'unblock' : 'block'} student`,
        variant: 'destructive',
      });
    } finally {
      setBlockingStudent(null);
    }
  };

  const filteredProfiles = profiles.filter(profile => {
    const fullName = `${profile.first_name} ${profile.last_name}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <Clock size={14} className="mr-1" /> Pending
        </Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle size={14} className="mr-1" /> Approved
        </Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          <XCircle size={14} className="mr-1" /> Rejected
        </Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Profile Verification</h1>
            <p className="text-gray-600">Review and verify student profiles</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              type="text"
              placeholder="Search by name..."
              className="pl-10 w-full sm:w-80"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2 items-center w-full sm:w-auto">
            <Filter size={18} className="text-gray-500" />
            <select 
              className="border rounded-md px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Profiles</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <>
            {filteredProfiles.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Submission Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Block Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProfiles.map((profile) => (
                      <TableRow key={profile.id}>
                        <TableCell className="font-medium">
                          {profile.first_name} {profile.last_name}
                        </TableCell>
                        <TableCell>{profile.phone}</TableCell>
                        <TableCell>{profile.gender}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Calendar size={14} className="mr-2 text-gray-500" />
                            {profile.created_at ? format(new Date(profile.created_at), 'MMM dd, yyyy') : 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(profile.verification_status)}</TableCell>
                        <TableCell>
                          {profile.is_blocked ? (
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                              <Lock size={14} className="mr-1" /> Blocked
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              <Unlock size={14} className="mr-1" /> Active
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/admin/verification/${profile.id}`)}
                            >
                              <FileCheck size={16} className="mr-1" /> Review
                            </Button>
                            <Button
                              variant={profile.is_blocked ? "outline" : "destructive"}
                              size="sm"
                              disabled={blockingStudent === profile.id}
                              onClick={() => toggleBlockStatus(profile.id, profile.is_blocked || false)}
                            >
                              {blockingStudent === profile.id ? (
                                <span className="flex items-center">
                                  <div className="h-3 w-3 mr-1 rounded-full border-2 border-current border-t-transparent animate-spin" />
                                  Loading...
                                </span>
                              ) : (
                                <>
                                  {profile.is_blocked ? (
                                    <>
                                      <Unlock size={16} className="mr-1" /> Unblock
                                    </>
                                  ) : (
                                    <>
                                      <Lock size={16} className="mr-1" /> Block
                                    </>
                                  )}
                                </>
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 border rounded-lg">
                <p className="text-gray-500">No profiles found matching your criteria</p>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default Verification;
