
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
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Verification = () => {
  const [profiles, setProfiles] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [courseFilter, setCourseFilter] = useState<string[]>([]);
  const [passingYearFilter, setPassingYearFilter] = useState<string[]>([]);
  const [courses, setCourses] = useState<string[]>([]);
  const [passingYears, setPassingYears] = useState<number[]>([]);
  const [blockProfileId, setBlockProfileId] = useState<string | null>(null);
  const [blockAction, setBlockAction] = useState<'block' | 'unblock'>('block');
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfiles();
  }, [filterStatus, courseFilter, passingYearFilter]);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      // Fetch profiles
      let query = supabase
        .from('student_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply verification status filter if not 'all'
      if (filterStatus !== 'all') {
        query = query.eq('verification_status', filterStatus);
      }

      const { data: profilesData, error: profilesError } = await query;

      if (profilesError) {
        throw profilesError;
      }

      // Fetch graduation details to apply course and year filters
      const { data: graduationData, error: gradError } = await supabase
        .from('graduation_details')
        .select('*');

      if (gradError) {
        throw gradError;
      }

      // Extract all available courses and passing years for filters
      const allCourses = new Set<string>();
      const allYears = new Set<number>();
      
      graduationData.forEach(grad => {
        if (grad.course) allCourses.add(grad.course);
        if (grad.passing_year) allYears.add(grad.passing_year);
      });
      
      setCourses(Array.from(allCourses).sort());
      setPassingYears(Array.from(allYears).sort());

      // Apply course and passing year filters
      let filteredProfiles = profilesData || [];
      
      if (courseFilter.length > 0 || passingYearFilter.length > 0) {
        filteredProfiles = filteredProfiles.filter(profile => {
          const gradDetails = graduationData.find(g => g.student_id === profile.id);
          
          if (!gradDetails) return false;
          
          const matchesCourse = courseFilter.length === 0 || 
            (gradDetails.course && courseFilter.includes(gradDetails.course));
            
          const matchesYear = passingYearFilter.length === 0 || 
            (gradDetails.passing_year && passingYearFilter.includes(gradDetails.passing_year.toString()));
            
          return matchesCourse && matchesYear;
        });
      }

      setProfiles(filteredProfiles);
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

  const handleBlockAction = async () => {
    if (!blockProfileId) return;
    
    setBlockLoading(true);
    try {
      const { error } = await supabase
        .from('student_profiles')
        .update({ is_blocked: blockAction === 'block' })
        .eq('id', blockProfileId);
      
      if (error) throw error;
      
      // Update the local state
      setProfiles(profiles.map(profile => {
        if (profile.id === blockProfileId) {
          return { ...profile, is_blocked: blockAction === 'block' };
        }
        return profile;
      }));
      
      toast({
        title: 'Success',
        description: `Student has been ${blockAction === 'block' ? 'blocked' : 'unblocked'} successfully`,
      });
    } catch (error) {
      console.error(`Error ${blockAction}ing student:`, error);
      toast({
        title: 'Error',
        description: `Failed to ${blockAction} student profile`,
        variant: 'destructive',
      });
    } finally {
      setBlockLoading(false);
      setShowBlockDialog(false);
      setBlockProfileId(null);
    }
  };

  const openBlockDialog = (profileId: string, action: 'block' | 'unblock') => {
    setBlockProfileId(profileId);
    setBlockAction(action);
    setShowBlockDialog(true);
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
          
          <div className="flex gap-2 items-center flex-wrap w-full sm:w-auto">
            <div className="flex gap-2 items-center">
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
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex gap-1 items-center">
                  Course <Filter size={14} />
                  {courseFilter.length > 0 && (
                    <Badge className="ml-1 bg-primary">{courseFilter.length}</Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Filter by Course</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setCourseFilter([])}>
                  Clear all
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <div className="max-h-56 overflow-y-auto">
                  {courses.map(course => (
                    <DropdownMenuCheckboxItem
                      key={course}
                      checked={courseFilter.includes(course)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setCourseFilter([...courseFilter, course]);
                        } else {
                          setCourseFilter(courseFilter.filter(c => c !== course));
                        }
                      }}
                    >
                      {course}
                    </DropdownMenuCheckboxItem>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex gap-1 items-center">
                  Year <Filter size={14} />
                  {passingYearFilter.length > 0 && (
                    <Badge className="ml-1 bg-primary">{passingYearFilter.length}</Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Filter by Passing Year</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setPassingYearFilter([])}>
                  Clear all
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <div className="max-h-56 overflow-y-auto">
                  {passingYears.map(year => (
                    <DropdownMenuCheckboxItem
                      key={year}
                      checked={passingYearFilter.includes(year.toString())}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setPassingYearFilter([...passingYearFilter, year.toString()]);
                        } else {
                          setPassingYearFilter(passingYearFilter.filter(y => y !== year.toString()));
                        }
                      }}
                    >
                      {year}
                    </DropdownMenuCheckboxItem>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
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
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProfiles.map((profile) => (
                      <TableRow key={profile.id} className={profile.is_blocked ? "bg-red-50" : ""}>
                        <TableCell className="font-medium">
                          {profile.first_name} {profile.last_name}
                          {profile.is_blocked && (
                            <Badge variant="outline" className="ml-2 bg-red-50 text-red-700 border-red-200">
                              <Lock size={10} className="mr-1" /> Blocked
                            </Badge>
                          )}
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
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/admin/verification/${profile.id}`)}
                            >
                              <FileCheck size={16} className="mr-1" /> Review
                            </Button>
                            
                            {profile.is_blocked ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openBlockDialog(profile.id!, 'unblock')}
                                className="border-blue-200 text-blue-700 hover:bg-blue-50"
                              >
                                <Unlock size={16} className="mr-1" /> Unblock
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openBlockDialog(profile.id!, 'block')}
                                className="border-red-200 text-red-700 hover:bg-red-50"
                              >
                                <Lock size={16} className="mr-1" /> Block
                              </Button>
                            )}
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

      {/* Block/Unblock Confirmation Dialog */}
      <AlertDialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {blockAction === 'block' ? 'Block this student?' : 'Unblock this student?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {blockAction === 'block' 
                ? 'This will prevent the student from applying to jobs and their profile will be marked as blocked.'
                : 'This will allow the student to apply to jobs again and their profile will no longer be marked as blocked.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={blockLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleBlockAction();
              }}
              disabled={blockLoading}
              className={blockAction === 'block' ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"}
            >
              {blockLoading ? 'Processing...' : blockAction === 'block' ? 'Block' : 'Unblock'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default Verification;
