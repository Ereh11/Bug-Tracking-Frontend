// interfaces/filter.interfaces.ts
export interface FilterData {
  searchTerm: string;
  status: string;
  isActive?: boolean;
}

export interface ProjectFilters {
  searchTerm?: string;
  status?: string;
  isActive?: boolean;
  startDate?: string;
  endDate?: string;
}

export interface PaginationInfo {
  totalRecords: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

// Status mapping for consistent status handling
export const PROJECT_STATUS_MAP = {
  0: 'Planning',
  1: 'In Progress', 
  2: 'Completed',
  3: 'On Hold',
  4: 'Cancelled'
} as const;

export const STATUS_OPTIONS = [
  'All status',
  'Completed',
  'In Progress',
  'Planning', 
  'On Hold',
  'Cancelled'
] as const;