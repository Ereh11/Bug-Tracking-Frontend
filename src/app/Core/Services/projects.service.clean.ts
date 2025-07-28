import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AuthService } from '../../Core/Services/auth.service';
import { environment } from '../../../environments/environment';
import { 
  ApiResponse, 
  PaginationParams,
  PaginatedResponse,
  BackendPaginatedResponse,
  CreateProjectRequest, 
  ProjectMember, 
  BackendUser as User,
  ProjectSummary,
  BackendProjectData,
  Project,
  UserProject
} from '../interfaces';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private apiUrl = environment.apiUrl;

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
          return throwError(() => new Error(error.message || 'Failed to retrieve user projects'));
        })
      );
  }

  /**
   * Get projects for current user with pagination based on role
   */
  getCurrentUserProjectsPaginated(pageNumber: number = 1, pageSize: number = 8): Observable<PaginatedResponse<Project>> {
    const currentUser = this.authService.currentUserValue;
    
    if (!currentUser) {
      return throwError(() => new Error('User is not authenticated'));
    }

    // Check if user is admin
    const isAdmin = currentUser.roles.some((role: string) => 
      role.toLowerCase() === 'admin' || role.toLowerCase() === 'administrator'
    );

    if (isAdmin) {
      // If admin, get all projects
      return this.getAllProjectsPaginated(pageNumber, pageSize);
    } else {
      // If regular user, get only their projects
      return this.getUserProjectsPaginated(currentUser.userId, pageNumber, pageSize);
    }
  }

  /**
   * Get all projects (admin only)
   * @deprecated Use getAllProjectsPaginated instead
   */
  getAllProjects(): Observable<Project[]> {
    return this.authService.makeAuthenticatedRequest<ApiResponse<Project[]>>('GET', '/Projects')
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          } else {
            throw new Error(response.message || 'Failed to fetch projects');
          }
        }),
        catchError(error => {
          return throwError(() => new Error(error.message || 'Failed to retrieve projects'));
        })
      );
  }

  /**
   * Get all projects as user projects (for filtering/mapping)
   * @deprecated Use getCurrentUserProjectsPaginated instead
   */
  getAllProjectsAsUserProjects(): Observable<UserProject[]> {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser) {
      return throwError(() => new Error('User is not authenticated'));
    }

    return this.getAllProjects().pipe(
      map(projects => projects.map(project => ({
        projectId: project.projectId,
        userId: currentUser.userId,
        notes: '',
        joinedDate: new Date(),
        project: project
      }))),
      catchError(error => {
        return throwError(() => new Error(error.message || 'Failed to retrieve projects'));
      })
    );
  }

  /**
   * Get user projects
   * @deprecated Use getUserProjectsPaginated instead
   */
  getUserProjects(userId: string): Observable<UserProject[]> {
    if (!userId) {
      return throwError(() => new Error('User ID is required'));
    }

    return this.authService.makeAuthenticatedRequest<ApiResponse<UserProject[]>>('GET', `/Projects/user/${userId}`)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data.map(userProject => ({
              ...userProject,
              joinedDate: new Date(userProject.joinedDate)
            }));
          } else {
            throw new Error(response.message || 'Failed to fetch user projects');
          }
        }),
        catchError(error => {
          return throwError(() => new Error(error.message || 'Failed to retrieve user projects'));
        })
      );
  }

  /**
   * Get project details by ID
   */
  getProjectById(projectId: string): Observable<Project> {
    return this.authService.makeAuthenticatedRequest<ApiResponse<Project>>('GET', `/Projects/${projectId}`)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          } else {
            throw new Error(response.message || 'Failed to fetch project details');
          }
        }),
        catchError(error => {
          return throwError(() => new Error(error.message || 'Failed to retrieve project details'));
        })
      );
  }

  /**
   * Check if user has access to project
   */
  hasProjectAccess(projectId: string): Observable<boolean> {
    return this.authService.makeAuthenticatedRequest<ApiResponse<boolean>>('GET', `/Projects/${projectId}/access`)
      .pipe(
        map(response => response.success && response.data),
        catchError(error => {
          return throwError(() => new Error(error.message || 'Failed to check project access'));
        })
      );
  }

  /**
   * Check if user has access to project (alternative implementation)
   */
  checkProjectAccess(projectId: string): Observable<boolean> {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser) {
      return throwError(() => new Error('User is not authenticated'));
    }

    // Admin has access to all projects
    const isAdmin = currentUser.roles.some((role: string) => 
      role.toLowerCase() === 'admin' || role.toLowerCase() === 'administrator'
    );
    
    if (isAdmin) {
      return new Observable(observer => {
        observer.next(true);
        observer.complete();
      });
    }

    // For regular users, check if they're part of the project
    return this.hasProjectAccess(projectId).pipe(
      catchError(error => {
        return throwError(() => new Error(error.message || 'Failed to check project access'));
      })
    );
  }

  /**
   * Leave a project
   */
  leaveProject(projectId: string): Observable<any> {
    return this.authService.makeAuthenticatedRequest<ApiResponse<any>>('DELETE', `/Projects/${projectId}/leave`)
      .pipe(
        map(response => {
          if (response.success) {
            return response;
          } else {
            throw new Error(response.message || 'Failed to leave project');
          }
        }),
        catchError(error => {
          return throwError(() => new Error(error.message || 'Failed to leave project'));
        })
      );
  }

  /**
   * Delete a project (admin only)
   */
  deleteProject(projectId: string): Observable<any> {
    return this.authService.makeAuthenticatedRequest<ApiResponse<any>>('DELETE', `/Projects/${projectId}`)
      .pipe(
        map(response => {
          if (response.success) {
            return response;
          } else {
            throw new Error(response.message || 'Failed to delete project');
          }
        }),
        catchError(error => {
          return throwError(() => new Error(error.message || 'Failed to delete project'));
        })
      );
  }

  /**
   * Create a new project
   */
  createProject(projectData: CreateProjectRequest): Observable<any> {
    const requestBody = {
      name: projectData.name,
      description: projectData.description,
      status: Number(projectData.status),      
      startDate: projectData.startDate,       
      endDate: projectData.endDate,           
      isActive: Boolean(projectData.isActive) 
    };

    return this.authService.makeAuthenticatedRequest<ApiResponse<any>>('POST', '/Projects', requestBody)
      .pipe(
        map(response => {
          if (response.success) {
            return response;
          } else {
            throw new Error(response.message || 'Failed to create project');
          }
        }),
        catchError(error => {
          return throwError(() => new Error(error.message || 'Failed to create project'));
        })
      );
  }

  /**
   * Update project
   */
  updateProject(projectId: string, projectData: Partial<CreateProjectRequest>): Observable<any> {
    return this.authService.makeAuthenticatedRequest<ApiResponse<any>>('PUT', `/Projects/${projectId}`, projectData)
      .pipe(
        map(response => {
          if (response.success) {
            return response;
          } else {
            throw new Error(response.message || 'Failed to update project');
          }
        }),
        catchError(error => {
          return throwError(() => new Error(error.message || 'Failed to update project'));
        })
      );
  }

  /**
   * Add member to project
   */
  addProjectMember(projectMember: ProjectMember): Observable<any> {
    return this.authService.makeAuthenticatedRequest<ApiResponse<any>>('POST', '/Projects/members', projectMember)
      .pipe(
        map(response => {
          if (response.success) {
            return response;
          } else {
            throw new Error(response.message || 'Failed to add project member');
          }
        }),
        catchError(error => {
          return throwError(() => new Error(error.message || 'Failed to add project member'));
        })
      );
  }

  /**
   * Remove member from project
   */
  removeProjectMember(projectId: string, userId: string): Observable<any> {
    return this.authService.makeAuthenticatedRequest<ApiResponse<any>>('DELETE', `/Projects/${projectId}/members/${userId}`)
      .pipe(
        map(response => {
          if (response.success) {
            return response;
          } else {
            throw new Error(response.message || 'Failed to remove project member');
          }
        }),
        catchError(error => {
          return throwError(() => new Error(error.message || 'Failed to remove project member'));
        })
      );
  }

  /**
   * Get project members
   */
  getProjectMembers(projectId: string): Observable<User[]> {
    return this.authService.makeAuthenticatedRequest<ApiResponse<User[]>>('GET', `/Projects/${projectId}/members`)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          } else {
            throw new Error(response.message || 'Failed to fetch project members');
          }
        }),
        catchError(error => {
          return throwError(() => new Error(error.message || 'Failed to retrieve project members'));
        })
      );
  }
}
