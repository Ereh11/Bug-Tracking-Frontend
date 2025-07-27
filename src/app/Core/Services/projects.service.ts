import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AuthService, ApiResponse } from '../../Core/Services/auth.service';

export interface CreateProjectRequest {
  name: string;
  description: string;
  status: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface ProjectMember {
  projectId: string;
  userId: string;
  notes: string;
  joinedDate: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  roles?: string[];
}

export interface Manager {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  roles?: string[] | null;
}

export interface Bug {
  id: string;
  title: string;
  description: string;
  status: number;
  priority: number;
}

export interface Project {
  projectId: string;
  name: string;
  description: string;
  status: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  manager?: Manager | null;
  users: User[];
  bugs: Bug[];
}

export interface UserProject {
  projectId: string;
  userId: string;
  notes: string;
  joinedDate: Date;
  project?: Project;
}

// Add pagination interfaces to match backend response
export interface PaginationParams {
  pageNumber: number;
  pageSize: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  totalRecords: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

export interface BackendPaginatedResponse<T> {
  pageNumber: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
  data: T[];
  success: boolean;
  message: string;
  errors: any;
}

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private apiUrl = 'http://localhost:5279/api';

  constructor(private authService: AuthService) {}

  /**
   * Get all projects with pagination (admin only)
   */
  getAllProjectsPaginated(pageNumber: number = 1, pageSize: number = 8): Observable<PaginatedResponse<Project>> {
    const url = `/Projects?pageNumber=${pageNumber}&pageSize=${pageSize}`;
    
    return this.authService.makeAuthenticatedRequest<BackendPaginatedResponse<Project>>('GET', url)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            // Transform backend response to our interface
            return {
              data: response.data,
              totalRecords: response.totalRecords,
              pageNumber: response.pageNumber,
              pageSize: response.pageSize,
              totalPages: response.totalPages,
              hasNextPage: response.pageNumber < response.totalPages,
              hasPreviousPage: response.pageNumber > 1
            };
          } else {
            throw new Error(response.message || 'Failed to retrieve projects');
          }
        }),
        catchError(error => {
          console.error('Error fetching paginated projects:', error);
          return throwError(() => new Error(error.message || 'Failed to retrieve projects'));
        })
      );
  }

  /**
   * Get user projects with pagination
   */
  getUserProjectsPaginated(userId: string, pageNumber: number = 1, pageSize: number = 8): Observable<PaginatedResponse<Project>> {
    if (!userId) {
      return throwError(() => new Error('User ID is required'));
    }

    const url = `/Projects/user/${userId}?pageNumber=${pageNumber}&pageSize=${pageSize}`;
    
    return this.authService.makeAuthenticatedRequest<BackendPaginatedResponse<Project>>('GET', url)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            // Transform backend response to our interface
            return {
              data: response.data,
              totalRecords: response.totalRecords,
              pageNumber: response.pageNumber,
              pageSize: response.pageSize,
              totalPages: response.totalPages,
              hasNextPage: response.pageNumber < response.totalPages,
              hasPreviousPage: response.pageNumber > 1
            };
          } else {
            throw new Error(response.message || 'Failed to retrieve user projects');
          }
        }),
        catchError(error => {
          console.error('Error fetching user projects:', error);
          return throwError(() => new Error(error.message || 'Failed to retrieve user projects'));
        })
      );
  }

  /**
   * Get projects for current user with pagination based on role
   */
  getProjectsForCurrentUserPaginated(pageNumber: number = 1, pageSize: number = 8): Observable<{ projects: UserProject[], pagination: PaginatedResponse<any> }> {
    const currentUserId = this.authService.getCurrentUserId();
    
    if (!currentUserId) {
      return throwError(() => new Error('User not authenticated'));
    }

    let projectsObservable: Observable<PaginatedResponse<Project>>;

    if (this.authService.isAdmin()) {
      projectsObservable = this.getAllProjectsPaginated(pageNumber, pageSize);
    } else {
      projectsObservable = this.getUserProjectsPaginated(currentUserId, pageNumber, pageSize);
    }

    return projectsObservable.pipe(
      map(paginatedResponse => {
        const userProjects = paginatedResponse.data.map(project => ({
          projectId: project.projectId,
          userId: currentUserId,
          notes: project.description || '',
          joinedDate: new Date(project.startDate),
          project: project
        }));

        return {
          projects: userProjects,
          pagination: paginatedResponse
        };
      }),
      catchError(error => {
        console.error('Error fetching projects for current user:', error);
        return throwError(() => new Error(error.message || 'Failed to retrieve projects'));
      })
    );
  }

  // Keep existing non-paginated methods for backward compatibility
  getAllProjects(): Observable<Project[]> {
    const url = `/Projects`;
    
    return this.authService.makeAuthenticatedRequest<ApiResponse<Project[]>>('GET', url)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          } else {
            throw new Error(response.message || 'Failed to retrieve all projects');
          }
        }),
        catchError(error => {
          console.error('Error fetching all projects:', error);
          return throwError(() => new Error(error.message || 'Failed to retrieve all projects'));
        })
      );
  }

  getAllProjectsAsUserProjects(): Observable<UserProject[]> {
    const currentUserId = this.authService.getCurrentUserId();
    
    if (!currentUserId) {
      return throwError(() => new Error('User not authenticated'));
    }

    return this.getAllProjects().pipe(
      map(projects => {
        return projects.map(project => ({
          projectId: project.projectId,
          userId: currentUserId,
          notes: project.description || '',
          joinedDate: new Date(project.startDate),
          project: project
        }));
      }),
      catchError(error => {
        console.error('Error fetching all projects as user projects:', error);
        return throwError(() => new Error(error.message || 'Failed to retrieve all projects'));
      })
    );
  }

  getProjectsForCurrentUser(): Observable<UserProject[]> {
    if (this.authService.isAdmin()) {
      return this.getAllProjectsAsUserProjects();
    } else {
      return this.getCurrentUserProjects();
    }
  }

  getCurrentUserProjects(): Observable<UserProject[]> {
    const currentUserId = this.authService.getCurrentUserId();
    
    if (!currentUserId) {
      return throwError(() => new Error('User not authenticated'));
    }

    return this.getUserProjects(currentUserId);
  }

  getUserProjects(userId: string): Observable<UserProject[]> {
    if (!userId) {
      return throwError(() => new Error('User ID is required'));
    }

    const url = `/Projects/user/${userId}`;
    
    return this.authService.makeAuthenticatedRequest<ApiResponse<Project[]>>('GET', url)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data.map(project => ({
              projectId: project.projectId,
              userId: userId,
              notes: '',
              joinedDate: new Date(project.startDate),
              project: project
            }));
          } else {
            throw new Error(response.message || 'Failed to retrieve user projects');
          }
        }),
        catchError(error => {
          console.error('Error fetching user projects:', error);
          return throwError(() => new Error(error.message || 'Failed to retrieve user projects'));
        })
      );
  }

  // ... keep all other existing methods unchanged ...
  getProjectById(projectId: string): Observable<Project> {
    if (!projectId) {
      return throwError(() => new Error('Project ID is required'));
    }

    const url = `/Projects/${projectId}`;
    
    return this.authService.makeAuthenticatedRequest<ApiResponse<Project>>('GET', url)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          } else {
            throw new Error(response.message || 'Failed to retrieve project details');
          }
        }),
        catchError(error => {
          console.error('Error fetching project details:', error);
          return throwError(() => new Error(error.message || 'Failed to retrieve project details'));
        })
      );
  }

  hasProjectAccess(projectId: string): Observable<boolean> {
    if (this.authService.isAdmin()) {
      return this.getAllProjects().pipe(
        map(projects => {
          return projects.some(project => project.projectId === projectId);
        }),
        catchError(error => {
          console.error('Error checking project access:', error);
          return throwError(() => error);
        })
      );
    }

    return this.getCurrentUserProjects().pipe(
      map(userProjects => {
        return userProjects.some(project => project.projectId === projectId);
      }),
      catchError(error => {
        console.error('Error checking project access:', error);
        return throwError(() => error);
      })
    );
  }

  leaveProject(projectId: string): Observable<boolean> {
    const currentUserId = this.authService.getCurrentUserId();
    
    if (!currentUserId) {
      return throwError(() => new Error('User not authenticated'));
    }

    if (!projectId) {
      return throwError(() => new Error('Project ID is required'));
    }

    const url = `/ProjectMembers/${projectId}/users/${currentUserId}`;
    
    return this.authService.makeAuthenticatedRequest<ApiResponse<any>>('DELETE', url)
      .pipe(
        map(response => {
          if (response.success) {
            return true;
          } else {
            throw new Error(response.message || 'Failed to leave project');
          }
        }),
        catchError(error => {
          console.error('Error leaving project:', error);
          return throwError(() => new Error(error.message || 'Failed to leave project'));
        })
      );
  }

  deleteProject(projectId: string): Observable<boolean> {
    if (!projectId) {
      return throwError(() => new Error('Project ID is required'));
    }

    const url = `/Projects/${projectId}`;
    
    return this.authService.makeAuthenticatedRequest<ApiResponse<any>>('DELETE', url)
      .pipe(
        map(response => {
          if (response.success) {
            return true;
          } else {
            throw new Error(response.message || 'Failed to delete project');
          }
        }),
        catchError(error => {
          console.error('Error deleting project:', error);
          return throwError(() => new Error(error.message || 'Failed to delete project'));
        })
      );
  }

  createProject(projectData: CreateProjectRequest): Observable<Project> {
    if (!projectData.name || !projectData.name.trim()) {
      return throwError(() => new Error('Project name is required'));
    }

    const url = `/Projects`;
    
    // Send the object directly as backend expects (no wrapper, status as number)
    const requestBody = {
      name: projectData.name,
      description: projectData.description,
      status: projectData.status, // Send as number (1-5)
      startDate: projectData.startDate,
      endDate: projectData.endDate,
      isActive: projectData.isActive
    };
    
    console.log('Sending project data:', requestBody);
    
    return this.authService.makeAuthenticatedRequest<ApiResponse<Project>>('POST', url, requestBody)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          } else {
            throw new Error(response.message || 'Failed to create project');
          }
        }),
        catchError(error => {
          console.error('Error creating project:', error);
          let errorMessage = 'Failed to create project';
          
          if (error.status === 403) {
            errorMessage = 'You do not have permission to create projects';
          } else if (error.status === 400) {
            // Handle validation errors from backend
            if (error.error?.errors && Array.isArray(error.error.errors)) {
              // Handle array of error objects with code and message
              const validationErrors = error.error.errors;
              const errorMessages: string[] = [];
              
              validationErrors.forEach((err: any) => {
                if (err.message) {
                  errorMessages.push(err.message);
                }
              });
              
              if (errorMessages.length > 0) {
                errorMessage = errorMessages.join('. ');
              } else {
                errorMessage = error.error?.message || 'Invalid project data provided';
              }
            } else if (error.error?.errors && typeof error.error.errors === 'object') {
              // Handle object-based validation errors (ASP.NET Core ModelState)
              const validationErrors = error.error.errors;
              const errorMessages: string[] = [];
              
              for (const field in validationErrors) {
                if (validationErrors[field] && Array.isArray(validationErrors[field])) {
                  validationErrors[field].forEach((msg: string) => {
                    errorMessages.push(msg);
                  });
                }
              }
              
              if (errorMessages.length > 0) {
                errorMessage = errorMessages.join('. ');
              } else {
                errorMessage = error.error?.message || 'Invalid project data provided';
              }
            } else if (error.error?.message) {
              errorMessage = error.error.message;
            } else if (typeof error.error === 'string') {
              errorMessage = error.error;
            } else {
              errorMessage = 'Invalid project data provided';
            }
          } else if (error.status === 409) {
            errorMessage = 'A project with this name already exists';
          } else if (error.status === 401) {
            errorMessage = 'You are not authenticated. Please log in again.';
          } else if (error.status >= 500) {
            errorMessage = 'Server error. Please try again later.';
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          return throwError(() => new Error(errorMessage));
        })
      );
  }
}