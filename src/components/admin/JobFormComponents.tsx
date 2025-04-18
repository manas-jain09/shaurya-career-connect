
import React from 'react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

export const JobEligibilityFields = ({ 
  formData, 
  setFormData 
}: { 
  formData: any; 
  setFormData: (data: any) => void;
}) => {
  // Generate a list of years for graduation criteria
  const currentYear = new Date().getFullYear();
  const futureYears = Array.from({ length: 5 }, (_, i) => currentYear + i);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Eligibility Criteria</h3>
      
      <div className="space-y-4 border p-4 rounded-md">
        <h4 className="font-medium">Class X Requirements</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="min_class_x_marks">Minimum Percentage (%)</Label>
            <Input
              id="min_class_x_marks"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={formData.min_class_x_marks || ''}
              onChange={(e) => setFormData({
                ...formData,
                min_class_x_marks: e.target.value ? parseFloat(e.target.value) : null,
              })}
              placeholder="e.g., 60"
            />
          </div>
          <div>
            <Label htmlFor="min_class_x_cgpa">Minimum CGPA</Label>
            <Input
              id="min_class_x_cgpa"
              type="number"
              min="0"
              max="10"
              step="0.1"
              value={formData.min_class_x_cgpa || ''}
              onChange={(e) => setFormData({
                ...formData,
                min_class_x_cgpa: e.target.value ? parseFloat(e.target.value) : null,
              })}
              placeholder="e.g., 7.5"
            />
          </div>
        </div>
      </div>
      
      <div className="space-y-4 border p-4 rounded-md">
        <h4 className="font-medium">Class XII Requirements</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="min_class_xii_marks">Minimum Percentage (%)</Label>
            <Input
              id="min_class_xii_marks"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={formData.min_class_xii_marks || ''}
              onChange={(e) => setFormData({
                ...formData,
                min_class_xii_marks: e.target.value ? parseFloat(e.target.value) : null,
              })}
              placeholder="e.g., 60"
            />
          </div>
          <div>
            <Label htmlFor="min_class_xii_cgpa">Minimum CGPA</Label>
            <Input
              id="min_class_xii_cgpa"
              type="number"
              min="0"
              max="10"
              step="0.1"
              value={formData.min_class_xii_cgpa || ''}
              onChange={(e) => setFormData({
                ...formData,
                min_class_xii_cgpa: e.target.value ? parseFloat(e.target.value) : null,
              })}
              placeholder="e.g., 7.5"
            />
          </div>
        </div>
      </div>
      
      <div className="space-y-4 border p-4 rounded-md">
        <h4 className="font-medium">Graduation Requirements</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="min_graduation_marks">Minimum Percentage (%)</Label>
            <Input
              id="min_graduation_marks"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={formData.min_graduation_marks || ''}
              onChange={(e) => setFormData({
                ...formData,
                min_graduation_marks: e.target.value ? parseFloat(e.target.value) : null,
              })}
              placeholder="e.g., 60"
            />
          </div>
          <div>
            <Label htmlFor="min_graduation_cgpa">Minimum CGPA</Label>
            <Input
              id="min_graduation_cgpa"
              type="number"
              min="0"
              max="10"
              step="0.1"
              value={formData.min_graduation_cgpa || ''}
              onChange={(e) => setFormData({
                ...formData,
                min_graduation_cgpa: e.target.value ? parseFloat(e.target.value) : null,
              })}
              placeholder="e.g., 7.5"
            />
          </div>
        </div>
        
        <div className="space-y-2 mt-2">
          <Label>Eligible Passing Years</Label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {futureYears.map(year => (
              <div key={year} className="flex items-center space-x-2">
                <Checkbox 
                  id={`year-${year}`}
                  checked={(formData.eligible_passing_years || []).includes(year)}
                  onCheckedChange={(checked) => {
                    let years = [...(formData.eligible_passing_years || [])];
                    if (checked) {
                      if (!years.includes(year)) years.push(year);
                    } else {
                      years = years.filter(y => y !== year);
                    }
                    setFormData({
                      ...formData,
                      eligible_passing_years: years,
                    });
                  }}
                />
                <Label htmlFor={`year-${year}`}>{year}</Label>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex items-center space-x-2 mt-4">
          <Checkbox
            id="allow_backlog"
            checked={formData.allow_backlog}
            onCheckedChange={(checked) => setFormData({
              ...formData,
              allow_backlog: !!checked,
            })}
          />
          <Label htmlFor="allow_backlog">Allow students with backlog</Label>
        </div>
      </div>
    </div>
  );
};
