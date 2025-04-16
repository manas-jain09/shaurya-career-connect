
import React, { useState, useEffect } from 'react';
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
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle,
  Clock,
  Eye,
  User,
  Download,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck
} from 'lucide-react';
import { StudentProfile } from '@/types/database.types';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

const Students = () => {
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVerified, setFilterVerified] = useState('all');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchStudents();
  }, [filterVerified]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('student_profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (filterVerified === 'verified') {
        query = query.eq('is_verified', true);
      } else if (filterVerified === 'unverified') {
        query = query.eq('is_verified', false);
      } else if (filterVerified === 'blocked') {
        query = query.eq('is_blocked', true);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({
        title: 'Error',
        description: 'Failed to load student profiles',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleBlockStatus = async (student: StudentProfile) => {
    setIsProcessing(true);
    try {
      const newBlockedStatus = !student.is_blocked;
      
      const { error } = await supabase
        .from('student_profiles')
        .update({ is_blocked: newBlockedStatus })
        .eq('id', student.id);
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: `Student ${newBlockedStatus ? 'blocked' : 'unblocked'} successfully`,
        variant: 'default',
      });
      
      // Create notification
      await supabase.from('notifications').insert({
        user_id: student.user_id,
        title: newBlockedStatus ? 'Account Blocked' : 'Account Unblocked',
        message: newBlockedStatus 
          ? 'Your account has been blocked by the admin. Please contact the placement office.'
          : 'Your account has been unblocked. You can now use all features.',
        is_read: false,
      });
      
      // Refresh student list
      fetchStudents();
      setConfirmDialogOpen(false);
    } catch (error) {
      console.error('Error toggling block status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update student status',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredStudents = students.filter(student => {
    const fullName = `${student.first_name} ${student.last_name}`.toLowerCase();
    const phone = student.phone.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase()) || phone.includes(searchTerm.toLowerCase());
  });

  const getVerificationBadge = (isVerified: boolean, status: string) => {
    if (isVerified) {
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
        <CheckCircle size={14} className="mr-1" /> Verified
      </Badge>;
    } else if (status === 'pending') {
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
        <Clock size={14} className="mr-1" /> Pending
      </Badge>;
    } else {
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
        <XCircle size={14} className="mr-1" /> Rejected
      </Badge>;
    }
  };

  const getPlacementStatusBadge = (student: StudentProfile) => {
    if (student.is_blocked) {
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
        <ShieldAlert size={14} className="mr-1" /> Blocked
      </Badge>;
    }
    
    if (student.placement_interest && student.placement_interest !== 'placement/internship') {
      return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
        <AlertTriangle size={14} className="mr-1" /> Opted Out
      </Badge>;
    }
    
    if (student.is_verified && student.agreed_to_policies) {
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
        <ShieldCheck size={14} className="mr-1" /> Eligible
      </Badge>;
    }
    
    return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
      Incomplete
    </Badge>;
  };

  const exportToCSV = () => {
    if (filteredStudents.length === 0) {
      toast({
        title: "No Data",
        description: "There are no students to export",
        variant: "destructive"
      });
      return;
    }
    
    // CSV Headers
    let csvContent = "Name,Gender,Phone,Address,Verification Status,Placement Interest,Profile Status,Registration Date\n";
    
    // Add rows
    filteredStudents.forEach(student => {
      const name = `${student.first_name} ${student.last_name}`;
      const status = student.is_verified ? "Verified" : student.verification_status;
      const date = student.created_at ? new Date(student.created_at).toLocaleDateString() : "N/A";
      const placementStatus = student.is_blocked 
        ? "Blocked" 
        : (student.placement_interest !== 'placement/internship' ? "Opted Out" : "Eligible");
      
      csvContent += `"${name}","${student.gender}","${student.phone}","${student.address || ""}","${status}","${student.placement_interest || ''}","${placementStatus}","${date}"\n`;
    });
    
    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "students.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenBlockDialog = (student: StudentProfile) => {
    setSelectedStudent(student);
    setConfirmDialogOpen(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Student Management</h1>
            <p className="text-gray-600">View and manage all student profiles</p>
          </div>
          <Button variant="outline" onClick={exportToCSV}>
            <Download size={16} className="mr-1" /> Export to CSV
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              type="text"
              placeholder="Search by name or phone..."
              className="pl-10 w-full sm:w-80"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2 items-center w-full sm:w-auto">
            <Filter size={18} className="text-gray-500" />
            <select 
              className="border rounded-md px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filterVerified}
              onChange={(e) => setFilterVerified(e.target.value)}
            >
              <option value="all">All Students</option>
              <option value="verified">Verified Only</option>
              <option value="unverified">Unverified Only</option>
              <option value="blocked">Blocked Students</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <>
            {filteredStudents.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Verification</TableHead>
                      <TableHead>Placement Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student) => (
                      <TableRow 
                        key={student.id}
                        className={student.is_blocked ? "bg-red-50" : ""}
                      >
                        <TableCell className="font-medium">
                          {student.first_name} {student.last_name}
                        </TableCell>
                        <TableCell>{student.gender}</TableCell>
                        <TableCell>{student.phone}</TableCell>
                        <TableCell>{student.address || 'Not provided'}</TableCell>
                        <TableCell>{getVerificationBadge(student.is_verified, student.verification_status)}</TableCell>
                        <TableCell>{getPlacementStatusBadge(student)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/admin/verification/${student.id}`)}
                            >
                              <Eye size={16} className="mr-1" /> View Profile
                            </Button>
                            <Button
                              variant={student.is_blocked ? "outline" : "destructive"}
                              size="sm"
                              onClick={() => handleOpenBlockDialog(student)}
                            >
                              {student.is_blocked ? (
                                <>
                                  <ShieldCheck size={16} className="mr-1" /> Unblock
                                </>
                              ) : (
                                <>
                                  <ShieldAlert size={16} className="mr-1" /> Block
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
                <User size={40} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">No students found matching your criteria</p>
              </div>
            )}
          </>
        )}
      </div>

      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedStudent?.is_blocked ? 'Unblock Student' : 'Block Student'}
            </DialogTitle>
            <DialogDescription>
              {selectedStudent?.is_blocked 
                ? 'This will allow the student to apply for jobs and access all features.'
                : 'This will prevent the student from applying for jobs or proceeding with existing applications.'}
            </DialogDescription>
          </DialogHeader>
          
          {selectedStudent && (
            <div className="py-4">
              <p className="mb-2"><strong>Student:</strong> {selectedStudent.first_name} {selectedStudent.last_name}</p>
              <p><strong>Phone:</strong> {selectedStudent.phone}</p>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant={selectedStudent?.is_blocked ? "default" : "destructive"}
              onClick={() => selectedStudent && toggleBlockStatus(selectedStudent)}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <div className="flex items-center">
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-t-transparent rounded-full"></div>
                  Processing...
                </div>
              ) : (
                selectedStudent?.is_blocked ? 'Unblock Student' : 'Block Student'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default Students;
