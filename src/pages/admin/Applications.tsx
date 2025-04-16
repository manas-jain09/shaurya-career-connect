
import React, { useState, useEffect, useMemo } from 'react';
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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  Search, 
  Filter, 
  FileText, 
  Check, 
  X, 
  ChevronDown,
  SlidersHorizontal,
  Calendar,
  Download,
  MoreHorizontal,
  User,
  Users
} from 'lucide-react';
import { format } from 'date-fns';
import { JobApplication, JobApplicationStatus } from '@/types/database.types';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';

const Applications = () => {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [jobFilter, setJobFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedApplications, setSelectedApplications] = useState<string[]>([]);
  const [showBulkUpdateDialog, setShowBulkUpdateDialog] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<JobApplicationStatus>('under_review');
  const [showOfferUploadModal, setShowOfferUploadModal] = useState(false);
  const [currentApplicationId, setCurrentApplicationId] = useState<string | null>(null);
  const [offerFile, setOfferFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [currentNotes, setCurrentNotes] = useState('');
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [classXMarksRange, setClassXMarksRange] = useState<[number, number]>([0, 100]);
  const [classXIIMarksRange, setClassXIIMarksRange] = useState<[number, number]>([0, 100]);
  const [graduationMarksRange, setGraduationMarksRange] = useState<[number, number]>([0, 100]);
  const [courseFilter, setCourseFilter] = useState<string[]>([]);
  const [passingYearFilter, setPassingYearFilter] = useState<string[]>([]);
  const [departmentFilter, setDepartmentFilter] = useState<string[]>([]);
  const [courses, setCourses] = useState<string[]>([]);
  const [passingYears, setPassingYears] = useState<number[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  
  const { toast } = useToast();

  const statusColors = {
    applied: 'bg-gray-100 text-gray-800',
    under_review: 'bg-blue-100 text-blue-800',
    shortlisted: 'bg-yellow-100 text-yellow-800',
    selected: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    internship: 'bg-purple-100 text-purple-800',
    ppo: 'bg-indigo-100 text-indigo-800',
    placement: 'bg-teal-100 text-teal-800'
  };

  const fetchApplications = async () => {
    setLoading(true);
    try {
      // First, fetch all applications with job details
      const { data: applicationsData, error: applicationsError } = await supabase
        .from('job_applications')
        .select(`
          *,
          job:job_id(id, title, company_name, package)
        `)
        .order('created_at', { ascending: false });

      if (applicationsError) throw applicationsError;

      // Get all unique student IDs
      const studentIds = [...new Set(applicationsData.map(app => app.student_id))];

      // Fetch student profiles in a single query
      const { data: studentProfiles, error: profilesError } = await supabase
        .from('student_profiles')
        .select('*')
        .in('id', studentIds);

      if (profilesError) throw profilesError;

      // Fetch education details
      const { data: classXDetails, error: classXError } = await supabase
        .from('class_x_details')
        .select('*')
        .in('student_id', studentIds);

      if (classXError) throw classXError;

      const { data: classXIIDetails, error: classXIIError } = await supabase
        .from('class_xii_details')
        .select('*')
        .in('student_id', studentIds);

      if (classXIIError) throw classXIIError;

      const { data: graduationDetails, error: graduationError } = await supabase
        .from('graduation_details')
        .select('*')
        .in('student_id', studentIds);

      if (graduationError) throw graduationError;

      // Combine all the data
      const completeApplications = applicationsData.map(app => {
        const studentProfile = studentProfiles.find(profile => profile.id === app.student_id);
        const classX = classXDetails.find(detail => detail.student_id === app.student_id);
        const classXII = classXIIDetails.find(detail => detail.student_id === app.student_id);
        const graduation = graduationDetails.find(detail => detail.student_id === app.student_id);

        return {
          ...app,
          student_profile: studentProfile,
          education: {
            classX,
            classXII,
            graduation
          }
        };
      });

      // Extract unique courses, passing years, and departments for filters
      const uniqueCourses = new Set<string>();
      const uniqueYears = new Set<number>();
      const uniqueDepartments = new Set<string>();

      graduationDetails.forEach(grad => {
        if (grad.course) uniqueCourses.add(grad.course);
        if (grad.passing_year) uniqueYears.add(grad.passing_year);
      });

      studentProfiles.forEach(profile => {
        if (profile.department) uniqueDepartments.add(profile.department);
      });

      setCourses(Array.from(uniqueCourses).sort());
      setPassingYears(Array.from(uniqueYears).sort());
      setDepartments(Array.from(uniqueDepartments).sort());

      setApplications(completeApplications);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast({
        title: 'Error',
        description: 'Failed to load applications',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('job_postings')
        .select('id, title, company_name')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  useEffect(() => {
    fetchApplications();
    fetchJobs();
  }, []);

  const handleStatusChange = async (id: string, newStatus: JobApplicationStatus) => {
    try {
      const { error } = await supabase
        .from('job_applications')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setApplications(prev =>
        prev.map(app =>
          app.id === id ? { ...app, status: newStatus } : app
        )
      );

      toast({
        title: 'Status updated',
        description: `Application status has been updated to ${newStatus.replace('_', ' ')}`,
      });

      // Refresh applications to get the latest data
      fetchApplications();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update application status',
        variant: 'destructive',
      });
    }
  };

  const handleUploadOffer = async () => {
    if (!currentApplicationId || !offerFile) return;

    setUploadLoading(true);
    try {
      // Upload file to Supabase Storage
      const fileName = `${Date.now()}_${offerFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('offer_letters')
        .upload(fileName, offerFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = await supabase.storage
        .from('offer_letters')
        .getPublicUrl(fileName);

      // Update application with file URL
      const { error: updateError } = await supabase
        .from('job_applications')
        .update({ offer_letter_url: urlData.publicUrl })
        .eq('id', currentApplicationId);

      if (updateError) throw updateError;

      // Update local state
      setApplications(prev =>
        prev.map(app =>
          app.id === currentApplicationId
            ? { ...app, offer_letter_url: urlData.publicUrl }
            : app
        )
      );

      toast({
        title: 'Success',
        description: 'Offer letter uploaded successfully',
      });

      // Close modal and reset state
      setShowOfferUploadModal(false);
      setCurrentApplicationId(null);
      setOfferFile(null);
    } catch (error) {
      console.error('Error uploading offer letter:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload offer letter',
        variant: 'destructive',
      });
    } finally {
      setUploadLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!currentApplicationId) return;

    try {
      const { error } = await supabase
        .from('job_applications')
        .update({ admin_notes: adminNotes })
        .eq('id', currentApplicationId);

      if (error) throw error;

      // Update local state
      setApplications(prev =>
        prev.map(app =>
          app.id === currentApplicationId
            ? { ...app, admin_notes: adminNotes }
            : app
        )
      );

      toast({
        title: 'Success',
        description: 'Notes saved successfully',
      });

      // Close modal and reset state
      setShowNotesModal(false);
      setCurrentApplicationId(null);
      setAdminNotes('');
    } catch (error) {
      console.error('Error saving notes:', error);
      toast({
        title: 'Error',
        description: 'Failed to save notes',
        variant: 'destructive',
      });
    }
  };

  const handleBulkUpdate = async () => {
    if (selectedApplications.length === 0) return;

    try {
      const { error } = await supabase
        .from('job_applications')
        .update({ status: bulkStatus })
        .in('id', selectedApplications);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `${selectedApplications.length} applications updated to ${bulkStatus.replace('_', ' ')}`,
      });

      // Reset selection and refresh data
      setSelectedApplications([]);
      setShowBulkUpdateDialog(false);
      fetchApplications();
    } catch (error) {
      console.error('Error updating applications:', error);
      toast({
        title: 'Error',
        description: 'Failed to update applications',
        variant: 'destructive',
      });
    }
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedApplications(filteredApplications.map(app => app.id!));
    } else {
      setSelectedApplications([]);
    }
  };

  const handleSelectApplication = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedApplications(prev => [...prev, id]);
    } else {
      setSelectedApplications(prev => prev.filter(appId => appId !== id));
    }
  };

  // Filter applications
  const filteredApplications = useMemo(() => {
    return applications.filter(app => {
      // Search filter
      const searchMatch = 
        searchTerm === '' ||
        `${app.student_profile?.first_name} ${app.student_profile?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.job?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.job?.company_name.toLowerCase().includes(searchTerm.toLowerCase());

      // Status filter
      const statusMatch = statusFilter === 'all' || app.status === statusFilter;

      // Job filter
      const jobMatch = jobFilter === 'all' || app.job_id === jobFilter;

      // Date filter
      let dateMatch = true;
      if (dateFilter) {
        const appDate = new Date(app.created_at || '');
        dateMatch = 
          appDate.getDate() === dateFilter.getDate() && 
          appDate.getMonth() === dateFilter.getMonth() && 
          appDate.getFullYear() === dateFilter.getFullYear();
      }

      // Course filter
      const courseMatch = courseFilter.length === 0 || 
        (app.education?.graduation?.course && courseFilter.includes(app.education.graduation.course));

      // Passing year filter
      const passingYearMatch = passingYearFilter.length === 0 || 
        (app.education?.graduation?.passing_year && 
          passingYearFilter.includes(app.education.graduation.passing_year.toString()));

      // Department filter
      const departmentMatch = departmentFilter.length === 0 || 
        (app.student_profile?.department && departmentFilter.includes(app.student_profile.department));

      // Class X marks filter
      const classXMarksMatch = !app.education?.classX?.marks || 
        (app.education.classX.marks >= classXMarksRange[0] && 
         app.education.classX.marks <= classXMarksRange[1]);

      // Class XII marks filter
      const classXIIMarksMatch = !app.education?.classXII?.marks || 
        (app.education.classXII.marks >= classXIIMarksRange[0] && 
         app.education.classXII.marks <= classXIIMarksRange[1]);

      // Graduation marks filter
      const graduationMarksMatch = !app.education?.graduation?.marks || 
        (app.education.graduation.marks >= graduationMarksRange[0] && 
         app.education.graduation.marks <= graduationMarksRange[1]);

      return searchMatch && statusMatch && jobMatch && dateMatch && 
             courseMatch && passingYearMatch && departmentMatch && 
             classXMarksMatch && classXIIMarksMatch && graduationMarksMatch;
    });
  }, [
    applications, 
    searchTerm, 
    statusFilter, 
    jobFilter, 
    dateFilter, 
    courseFilter, 
    passingYearFilter, 
    departmentFilter,
    classXMarksRange,
    classXIIMarksRange,
    graduationMarksRange
  ]);

  // Render multi-select dropdown
  const renderMultiSelect = (
    label: string, 
    options: string[] | number[], 
    selectedValues: string[], 
    setSelectedValues: (values: string[]) => void
  ) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full md:w-[180px] justify-between">
          <span className="truncate">{label}</span>
          {selectedValues.length > 0 && (
            <Badge className="ml-2 bg-primary text-primary-foreground">
              {selectedValues.length}
            </Badge>
          )}
          <Filter className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[220px] max-h-[400px] overflow-auto">
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => setSelectedValues([])}
          className="justify-between"
        >
          Clear all
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {options.map((option) => (
          <DropdownMenuCheckboxItem
            key={option.toString()}
            checked={selectedValues.includes(option.toString())}
            onCheckedChange={(checked) => {
              if (checked) {
                setSelectedValues([...selectedValues, option.toString()]);
              } else {
                setSelectedValues(selectedValues.filter(v => v !== option.toString()));
              }
            }}
          >
            {option.toString()}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Applications</h1>
            <p className="text-gray-600">Manage student job applications and track their status</p>
          </div>
          {selectedApplications.length > 0 && (
            <Button onClick={() => setShowBulkUpdateDialog(true)}>
              Update {selectedApplications.length} Applications
            </Button>
          )}
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>All Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4 flex-wrap">
                <div className="w-full md:w-auto grow">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <Input
                      type="text"
                      placeholder="Search applications..."
                      className="pl-10 w-full"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="applied">Applied</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="shortlisted">Shortlisted</SelectItem>
                    <SelectItem value="selected">Selected</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                    <SelectItem value="ppo">PPO</SelectItem>
                    <SelectItem value="placement">Placement</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={jobFilter} onValueChange={setJobFilter}>
                  <SelectTrigger className="w-full md:w-[220px]">
                    <SelectValue placeholder="Filter by job" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Jobs</SelectItem>
                    {jobs.map((job) => (
                      <SelectItem key={job.id} value={job.id}>
                        {job.company_name} - {job.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={`w-full md:w-[200px] justify-between ${
                        dateFilter ? 'text-foreground' : 'text-muted-foreground'
                      }`}
                    >
                      {dateFilter ? format(dateFilter, 'PPP') : 'Application Date'}
                      <Calendar className="ml-2 h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={dateFilter}
                      onSelect={setDateFilter}
                      initialFocus
                    />
                    {dateFilter && (
                      <div className="p-3 border-t border-border flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDateFilter(undefined)}
                        >
                          Clear
                        </Button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>

                {renderMultiSelect(
                  "Course",
                  courses,
                  courseFilter,
                  setCourseFilter
                )}

                {renderMultiSelect(
                  "Passing Year",
                  passingYears,
                  passingYearFilter,
                  setPassingYearFilter
                )}

                {renderMultiSelect(
                  "Department",
                  departments,
                  departmentFilter,
                  setDepartmentFilter
                )}

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full md:w-[180px] justify-between">
                      Class X Marks
                      <SlidersHorizontal className="ml-2 h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-4 p-2">
                      <h4 className="font-medium">Class X Marks Range</h4>
                      <div className="flex gap-4 items-center">
                        <Input
                          type="number"
                          value={classXMarksRange[0]}
                          onChange={(e) => {
                            const newMin = Math.max(0, parseFloat(e.target.value) || 0);
                            setClassXMarksRange([newMin, Math.max(newMin, classXMarksRange[1])]);
                          }}
                          className="w-20"
                        />
                        <Slider
                          value={classXMarksRange}
                          min={0}
                          max={100}
                          step={1}
                          onValueChange={(value) => setClassXMarksRange(value as [number, number])}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          value={classXMarksRange[1]}
                          onChange={(e) => {
                            const newMax = Math.min(100, parseFloat(e.target.value) || 100);
                            setClassXMarksRange([Math.min(classXMarksRange[0], newMax), newMax]);
                          }}
                          className="w-20"
                        />
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full md:w-[180px] justify-between">
                      Class XII Marks
                      <SlidersHorizontal className="ml-2 h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-4 p-2">
                      <h4 className="font-medium">Class XII Marks Range</h4>
                      <div className="flex gap-4 items-center">
                        <Input
                          type="number"
                          value={classXIIMarksRange[0]}
                          onChange={(e) => {
                            const newMin = Math.max(0, parseFloat(e.target.value) || 0);
                            setClassXIIMarksRange([newMin, Math.max(newMin, classXIIMarksRange[1])]);
                          }}
                          className="w-20"
                        />
                        <Slider
                          value={classXIIMarksRange}
                          min={0}
                          max={100}
                          step={1}
                          onValueChange={(value) => setClassXIIMarksRange(value as [number, number])}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          value={classXIIMarksRange[1]}
                          onChange={(e) => {
                            const newMax = Math.min(100, parseFloat(e.target.value) || 100);
                            setClassXIIMarksRange([Math.min(classXIIMarksRange[0], newMax), newMax]);
                          }}
                          className="w-20"
                        />
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full md:w-[180px] justify-between">
                      Graduation Marks
                      <SlidersHorizontal className="ml-2 h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-4 p-2">
                      <h4 className="font-medium">Graduation Marks Range</h4>
                      <div className="flex gap-4 items-center">
                        <Input
                          type="number"
                          value={graduationMarksRange[0]}
                          onChange={(e) => {
                            const newMin = Math.max(0, parseFloat(e.target.value) || 0);
                            setGraduationMarksRange([newMin, Math.max(newMin, graduationMarksRange[1])]);
                          }}
                          className="w-20"
                        />
                        <Slider
                          value={graduationMarksRange}
                          min={0}
                          max={100}
                          step={1}
                          onValueChange={(value) => setGraduationMarksRange(value as [number, number])}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          value={graduationMarksRange[1]}
                          onChange={(e) => {
                            const newMax = Math.min(100, parseFloat(e.target.value) || 100);
                            setGraduationMarksRange([Math.min(graduationMarksRange[0], newMax), newMax]);
                          }}
                          className="w-20"
                        />
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {loading ? (
                <div className="flex justify-center p-8">
                  <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
                </div>
              ) : (
                <div className="border rounded-md overflow-hidden">
                  <ScrollArea className="h-[calc(100vh-350px)]">
                    <div className="min-w-[1200px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-10">
                              <Checkbox 
                                onCheckedChange={handleSelectAll}
                                checked={selectedApplications.length === filteredApplications.length && filteredApplications.length > 0}
                              />
                            </TableHead>
                            <TableHead>Student</TableHead>
                            <TableHead>Job</TableHead>
                            <TableHead>Company</TableHead>
                            <TableHead>Applied On</TableHead>
                            <TableHead>Marks (X/XII/Grad)</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Offer Letter</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredApplications.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                                No applications found matching your filters
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredApplications.map((application) => (
                              <TableRow key={application.id}>
                                <TableCell>
                                  <Checkbox 
                                    checked={selectedApplications.includes(application.id!)}
                                    onCheckedChange={(checked) => handleSelectApplication(application.id!, !!checked)}
                                  />
                                </TableCell>
                                <TableCell className="font-medium">
                                  {application.student_profile?.first_name} {application.student_profile?.last_name}
                                  <div className="text-sm text-gray-500">
                                    {application.student_profile?.department || 'No department'}
                                  </div>
                                </TableCell>
                                <TableCell>{application.job?.title}</TableCell>
                                <TableCell>{application.job?.company_name}</TableCell>
                                <TableCell>
                                  {application.created_at ? format(new Date(application.created_at), 'dd MMM yyyy') : '-'}
                                </TableCell>
                                <TableCell>
                                  <div className="space-y-1 text-sm">
                                    <div>X: {application.education?.classX?.marks || '-'}</div>
                                    <div>XII: {application.education?.classXII?.marks || '-'}</div>
                                    <div>Grad: {application.education?.graduation?.marks || '-'}</div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge className={statusColors[application.status as JobApplicationStatus]}>
                                    {application.status === 'ppo' 
                                      ? 'PPO' 
                                      : application.status.charAt(0).toUpperCase() + application.status.slice(1).replace('_', ' ')}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {application.offer_letter_url ? (
                                    <a 
                                      href={application.offer_letter_url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:underline flex items-center"
                                    >
                                      <FileText size={16} className="mr-1" /> View Offer
                                    </a>
                                  ) : (
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => {
                                        setCurrentApplicationId(application.id!);
                                        setShowOfferUploadModal(true);
                                      }}
                                    >
                                      Upload Offer
                                    </Button>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm">
                                        <MoreHorizontal size={16} />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setCurrentApplicationId(application.id!);
                                          setCurrentNotes(application.admin_notes || '');
                                          setAdminNotes(application.admin_notes || '');
                                          setShowNotesModal(true);
                                        }}
                                      >
                                        Admin Notes
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                                      <DropdownMenuItem onClick={() => handleStatusChange(application.id!, 'applied')}>
                                        Applied
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleStatusChange(application.id!, 'under_review')}>
                                        Under Review
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleStatusChange(application.id!, 'shortlisted')}>
                                        Shortlisted
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleStatusChange(application.id!, 'selected')}>
                                        Selected
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleStatusChange(application.id!, 'rejected')}>
                                        Rejected
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleStatusChange(application.id!, 'internship')}>
                                        Internship
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleStatusChange(application.id!, 'ppo')}>
                                        PPO
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleStatusChange(application.id!, 'placement')}>
                                        Placement
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Update Dialog */}
      <Dialog open={showBulkUpdateDialog} onOpenChange={setShowBulkUpdateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Applications</DialogTitle>
            <DialogDescription>
              Change status for {selectedApplications.length} application(s)
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={bulkStatus} onValueChange={(value) => setBulkStatus(value as JobApplicationStatus)}>
              <SelectTrigger>
                <SelectValue placeholder="Select new status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="applied">Applied</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="shortlisted">Shortlisted</SelectItem>
                <SelectItem value="selected">Selected</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="internship">Internship</SelectItem>
                <SelectItem value="ppo">PPO</SelectItem>
                <SelectItem value="placement">Placement</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkUpdateDialog(false)}>Cancel</Button>
            <Button onClick={handleBulkUpdate}>Update Applications</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Offer Upload Modal */}
      <Dialog open={showOfferUploadModal} onOpenChange={setShowOfferUploadModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Offer Letter</DialogTitle>
            <DialogDescription>
              Upload the offer letter for this application
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setOfferFile(e.target.files[0]);
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOfferUploadModal(false)}>Cancel</Button>
            <Button onClick={handleUploadOffer} disabled={!offerFile || uploadLoading}>
              {uploadLoading ? 'Uploading...' : 'Upload'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notes Modal */}
      <Dialog open={showNotesModal} onOpenChange={setShowNotesModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Admin Notes</DialogTitle>
            <DialogDescription>
              Add or edit notes for this application
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <textarea
              className="w-full h-40 p-3 border rounded-md"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Enter notes here..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNotesModal(false)}>Cancel</Button>
            <Button onClick={handleSaveNotes}>Save Notes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default Applications;
