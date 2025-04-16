
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
  Unlock,
  GraduationCap
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { StudentProfile } from '@/types/database.types';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';

const Verification = () => {
  const [profiles, setProfiles] = useState<StudentProfile[]>([]);
  const [graduationData, setGraduationData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<number[]>([]);
  const [availableCourses, setAvailableCourses] = useState<string[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfiles();
    fetchGraduationData();
  }, [filterStatus, selectedCourses, selectedYears]);

  const fetchGraduationData = async () => {
    try {
      const { data, error } = await supabase
        .from('graduation_details')
        .select('course, passing_year, student_id');

      if (error) {
        throw error;
      }

      setGraduationData(data || []);

      // Extract unique courses and years
      const courses = [...new Set(data?.map(item => item.course) || [])];
      const years = [...new Set(data?.map(item => item.passing_year) || [])];

      setAvailableCourses(courses.filter(Boolean));
      setAvailableYears(years.filter(Boolean).sort((a, b) => b - a)); // Sort years in descending order
    } catch (error) {
      console.error('Error fetching graduation data:', error);
    }
  };

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

      let filteredData = data || [];

      // If course or year filters are selected, filter the profiles
      if (selectedCourses.length > 0 || selectedYears.length > 0) {
        // Get student IDs that match the selected courses or years
        const matchingStudentIds = graduationData
          .filter(grad => {
            const courseMatch = selectedCourses.length === 0 || selectedCourses.includes(grad.course);
            const yearMatch = selectedYears.length === 0 || selectedYears.includes(grad.passing_year);
            return courseMatch && yearMatch;
          })
          .map(grad => grad.student_id);

        // Filter profiles based on matching student IDs
        filteredData = filteredData.filter(profile => 
          matchingStudentIds.includes(profile.id)
        );
      }

      setProfiles(filteredData);
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

  const handleCourseToggle = (course: string) => {
    setSelectedCourses(prev => 
      prev.includes(course) 
        ? prev.filter(c => c !== course) 
        : [...prev, course]
    );
  };

  const handleYearToggle = (year: number) => {
    setSelectedYears(prev => 
      prev.includes(year) 
        ? prev.filter(y => y !== year) 
        : [...prev, year]
    );
  };

  const toggleBlockStatus = async (profileId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('student_profiles')
        .update({ is_blocked: !currentStatus })
        .eq('id', profileId);

      if (error) throw error;

      // Update the local state
      setProfiles(prevProfiles => 
        prevProfiles.map(profile => 
          profile.id === profileId 
            ? { ...profile, is_blocked: !currentStatus } 
            : profile
        )
      );

      toast({
        title: 'Success',
        description: `Student ${currentStatus ? 'unblocked' : 'blocked'} successfully`,
      });
    } catch (error) {
      console.error('Error toggling block status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update student block status',
        variant: 'destructive',
      });
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              type="text"
              placeholder="Search by name..."
              className="pl-10 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2 items-center">
            <Filter size={18} className="text-gray-500" />
            <select 
              className="border rounded-md px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Profiles</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="flex gap-2 items-center">
            <GraduationCap size={18} className="text-gray-500" />
            <Button variant="outline" className="w-full">
              <div className="w-full text-left">
                {selectedCourses.length > 0 || selectedYears.length > 0 ? 
                  `Filters: ${selectedCourses.length} courses, ${selectedYears.length} years` : 
                  'Course & Year Filters'}
              </div>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium mb-2">Course Filters</h3>
            <ScrollArea className="h-32 border rounded-md p-2">
              {availableCourses.length > 0 ? (
                <div className="space-y-2">
                  {availableCourses.map(course => (
                    <div key={course} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`course-${course}`} 
                        checked={selectedCourses.includes(course)}
                        onCheckedChange={() => handleCourseToggle(course)}
                      />
                      <label htmlFor={`course-${course}`} className="text-sm">{course}</label>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No courses available</p>
              )}
            </ScrollArea>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Passing Year Filters</h3>
            <ScrollArea className="h-32 border rounded-md p-2">
              {availableYears.length > 0 ? (
                <div className="space-y-2">
                  {availableYears.map(year => (
                    <div key={year} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`year-${year}`} 
                        checked={selectedYears.includes(year)}
                        onCheckedChange={() => handleYearToggle(year)}
                      />
                      <label htmlFor={`year-${year}`} className="text-sm">{year}</label>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No years available</p>
              )}
            </ScrollArea>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <>
            {filteredProfiles.length > 0 ? (
              <ScrollArea className="h-[calc(100vh-25rem)]">
                <div className="rounded-lg border">
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
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/admin/verification/${profile.id}`)}
                              >
                                <FileCheck size={16} className="mr-1" /> Review
                              </Button>
                              <Button
                                variant={profile.is_blocked ? "destructive" : "outline"}
                                size="sm"
                                onClick={() => toggleBlockStatus(profile.id, profile.is_blocked)}
                              >
                                {profile.is_blocked ? (
                                  <><Unlock size={16} className="mr-1" /> Unblock</>
                                ) : (
                                  <><Lock size={16} className="mr-1" /> Block</>
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </ScrollArea>
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
