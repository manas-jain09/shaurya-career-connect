
import { JobApplicationStatus } from "@/types/database.types";

export const getStatusBadgeClass = (status: JobApplicationStatus): string => {
  switch (status) {
    case 'selected':
    case 'placement':
      return "bg-green-100 text-green-800 hover:bg-green-100";
    case 'rejected':
      return "bg-red-100 text-red-800 hover:bg-red-100";
    case 'shortlisted':
    case 'under_review':
      return "bg-blue-100 text-blue-800 hover:bg-blue-100";
    case 'internship':
    case 'ppo':
      return "bg-purple-100 text-purple-800 hover:bg-purple-100";
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-100";
  }
};

export const formatStatus = (status: JobApplicationStatus): string => {
  if (status === 'ppo') return 'PPO';
  return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
};

export const getAllApplicationStatuses = (): JobApplicationStatus[] => {
  return ['applied', 'under_review', 'shortlisted', 'selected', 'rejected', 'internship', 'ppo', 'placement'];
};

export const isFinalStatus = (status: JobApplicationStatus): boolean => {
  return ['selected', 'internship', 'ppo', 'placement'].includes(status);
};
