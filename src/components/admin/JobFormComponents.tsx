import React from 'react';
import {
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormField,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Controller } from 'react-hook-form';
import { MultiSelect } from "@/components/ui/multi-select";

interface SectionProps {
  control: any;
  register: any;
}

const courseOptions = [
  { label: "B.Tech", value: "btech" },
  { label: "M.Tech", value: "mtech" },
  { label: "MBA", value: "mba" },
  { label: "BBA", value: "bba" },
  { label: "B.Com", value: "bcom" },
  { label: "M.Com", value: "mcom" },
  { label: "BSc", value: "bsc" },
  { label: "MSc", value: "msc" },
  { label: "BA", value: "ba" },
  { label: "MA", value: "ma" },
];

const currentYear = new Date().getFullYear();
const passingYearsOptions = Array.from({ length: 10 }, (_, i) => currentYear + i)
  .map(year => ({ label: year.toString(), value: year }));

export const BasicInfoSection = ({ register }: SectionProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Basic Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <FormLabel>Job Title</FormLabel>
          <Input type="text" placeholder="Software Engineer" {...register("title")} required />
        </div>
        <div>
          <FormLabel>Company Name</FormLabel>
          <Input type="text" placeholder="Acme Corp" {...register("company_name")} required />
        </div>
        <div>
          <FormLabel>Location</FormLabel>
          <Input type="text" placeholder="New York, NY" {...register("location")} required />
        </div>
        <div>
          <FormLabel>Package (CTC)</FormLabel>
          <Input type="text" placeholder="₹12,00,000" {...register("package")} required />
        </div>
        <div>
          <FormLabel>Application Deadline</FormLabel>
          <Input type="date" {...register("application_deadline")} required />
        </div>
      </div>
    </div>
  );
};

export const DescriptionSection = ({ register }: SectionProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Description</h3>
      <div>
        <FormLabel>Job Description</FormLabel>
        <textarea
          className="w-full border rounded-md p-2"
          rows={5}
          placeholder="Detailed job description..."
          {...register("description")}
          required
        />
      </div>
    </div>
  );
};

export const EligibilitySection = ({ control, register }: SectionProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Eligibility</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={control}
          name="eligible_courses"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Eligible Courses</FormLabel>
              <Controller
                name="eligible_courses"
                control={control}
                render={({ field }) => (
                  <MultiSelect
                    options={courseOptions}
                    value={field.value?.map((course: string) => ({ label: course, value: course })) || []}
                    onChange={(selected) => {
                      field.onChange(selected.map((item) => item.value));
                    }}
                    placeholder="Select courses..."
                  />
                )}
              />
              <FormDescription>
                Select eligible courses for this job
              </FormDescription>
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="eligible_passing_years"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Eligible Passing Years</FormLabel>
              <Controller
                name="eligible_passing_years"
                control={control}
                render={({ field }) => (
                  <MultiSelect
                    options={passingYearsOptions}
                    value={field.value?.map((year: number) => ({ label: year.toString(), value: year })) || []}
                    onChange={(selected) => {
                      field.onChange(selected.map((item) => Number(item.value)));
                    }}
                    placeholder="Select passing years..."
                  />
                )}
              />
              <FormDescription>
                Select eligible graduation years
              </FormDescription>
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="allow_backlog"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Allow Backlog</FormLabel>
                <FormDescription>
                  Allow students with backlogs to apply
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};
