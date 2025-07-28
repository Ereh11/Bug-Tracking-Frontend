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
   * Get user projects with pagination (includes both member and manager roles)
   */
  getUserProjectsPaginated(userId: string, pageNumber: number = 1, pageSize: number = 8): Observable<PaginatedResponse<Project>> {
    if (!userId) {
      return throwError(() => new Error('User ID is required'));
    }

    // First try the standard user projects endpoint
    const url = `/Projects/user/${userId}?pageNumber=${pageNumber}&pageSize=${pageSize}`;
    
    return this.authService.makeAuthenticatedRequest<BackendPaginatedResponse<Project>>('GET', url)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            console.log('User projects response:', response);
            
            // Handle responses that might not have pagination metadata
            const data = Array.isArray(response.data) ? response.data : [];
            const totalRecords = response.totalRecords ?? data.length;
            const currentPageNumber = response.pageNumber ?? pageNumber;
            const currentPageSize = response.pageSize ?? pageSize;
            const totalPages = response.totalPages ?? Math.ceil(totalRecords / currentPageSize);
            
            return {
              data: data,
              totalRecords: totalRecords,
              pageNumber: currentPageNumber,
              pageSize: currentPageSize,
              totalPages: totalPages,
              hasNextPage: currentPageNumber < totalPages,
              hasPreviousPage: currentPageNumber > 1
            };
          } else {
            throw new Error(response.message || 'Failed to retrieve user projects');
          }
        }),
        catchError(error => {
          console.error('Error fetching user projects:', error);
          console.log('Trying fallback: get all projects and filter by user involvement...');
          
          // Fallback: Get all projects and filter for ones where user is member or manager
          return this.getFilteredProjectsByUserInvolvement(userId, pageNumber, pageSize);
        })
      );
  }

  /**
   * Get all projects and filter for ones where user is involved (member or manager)
   */
  private getFilteredProjectsByUserInvolvement(userId: string, pageNumber: number = 1, pageSize: number = 8): Observable<PaginatedResponse<Project>> {
    console.log(`Getting all projects and filtering for user involvement: ${userId}`);
    
    // Get all projects without pagination first
    return this.authService.makeAuthenticatedRequest<BackendPaginatedResponse<Project>>('GET', '/Projects?pageNumber=1&pageSize=1000')
      .pipe(
        map(response => {
          if (response.success && response.data) {
            console.log(`Retrieved ${response.data.length} total projects for filtering`);
            
            // Filter projects where user is either a member or manager
            const userProjects = response.data.filter(project => {
              // Check if user is a manager
              const isManager = project.manager && project.manager.id === userId;
              
              // Check if user is a member
              const isMember = project.users && project.users.some((user: any) => user.id === userId || user.userId === userId);
              
              const isInvolved = isManager || isMember;
              
              if (isInvolved) {
                const role = isManager ? 'manager' : 'member';
                console.log(`User is ${role} of project: ${project.name}`);
              }
              
              return isInvolved;
            });

            console.log(`Found ${userProjects.length} projects where user is involved`);

            // Apply pagination to filtered results
            const startIndex = (pageNumber - 1) * pageSize;
            const endIndex = startIndex + pageSize;
            const paginatedProjects = userProjects.slice(startIndex, endIndex);
            const totalPages = Math.ceil(userProjects.length / pageSize);

            return {
              data: paginatedProjects,
              totalRecords: userProjects.length,
              pageNumber: pageNumber,
              pageSize: pageSize,
              totalPages: totalPages,
              hasNextPage: pageNumber < totalPages,
              hasPreviousPage: pageNumber > 1
            };
          } else {
            throw new Error(response.message || 'Failed to retrieve projects');
          }
        }),
        catchError(error => {
          console.error('Failed to get all projects for filtering:', error);
          // If this also fails, try the alternative endpoints as last resort
          return this.tryAlternativeUserProjectsEndpoints(userId, pageNumber, pageSize);
        })
      );
  }

  /**
   * Try alternative endpoints for user projects
   */
  private tryAlternativeUserProjectsEndpoints(userId: string, pageNumber: number = 1, pageSize: number = 8): Observable<PaginatedResponse<Project>> {
    console.log('Trying alternative endpoints for user projects...');
    
    // First try to get both member and manager projects separately, then combine
    return this.getMemberAndManagerProjects(userId, pageNumber, pageSize).pipe(
      catchError(() => {
        // If combined approach fails, try individual endpoints
        return this.tryIndividualEndpoints(userId, pageNumber, pageSize);
      })
    );
  }

  /**
   * Get both member and manager projects and combine them
   */
  private getMemberAndManagerProjects(userId: string, pageNumber: number = 1, pageSize: number = 8): Observable<PaginatedResponse<Project>> {
    console.log('Trying to get both member and manager projects...');
    
    // Try to get member projects
    const memberRequest = this.authService.makeAuthenticatedRequest<BackendPaginatedResponse<Project>>('GET', 
      `/Projects/user/${userId}/member?pageNumber=1&pageSize=100`);
    
    // Try to get manager projects  
    const managerRequest = this.authService.makeAuthenticatedRequest<BackendPaginatedResponse<Project>>('GET',
      `/Projects/user/${userId}/manager?pageNumber=1&pageSize=100`);

    // Combine both results
    return new Observable(observer => {
      const allProjects: Project[] = [];
      let completedRequests = 0;
      let hasAnySuccess = false;

      const processResults = () => {
        if (completedRequests === 2) {
          // Remove duplicates based on projectId
          const uniqueProjects = allProjects.filter((project, index, self) => 
            index === self.findIndex(p => p.projectId === project.projectId)
          );

          // Apply pagination to the combined results
          const startIndex = (pageNumber - 1) * pageSize;
          const endIndex = startIndex + pageSize;
          const paginatedProjects = uniqueProjects.slice(startIndex, endIndex);
          const totalPages = Math.ceil(uniqueProjects.length / pageSize);

          console.log(`Combined ${uniqueProjects.length} unique projects (${allProjects.length} total before deduplication)`);

          observer.next({
            data: paginatedProjects,
            totalRecords: uniqueProjects.length,
            pageNumber: pageNumber,
            pageSize: pageSize,
            totalPages: totalPages,
            hasNextPage: pageNumber < totalPages,
            hasPreviousPage: pageNumber > 1
          });
          observer.complete();
        }
      };

      // Get member projects
      memberRequest.subscribe({
        next: (response) => {
          if (response.success && response.data) {
            console.log(`Found ${response.data.length} member projects`);
            allProjects.push(...response.data);
            hasAnySuccess = true;
          }
          completedRequests++;
          processResults();
        },
        error: (error) => {
          console.warn('Member projects request failed:', error);
          completedRequests++;
          processResults();
        }
      });

      // Get manager projects
      managerRequest.subscribe({
        next: (response) => {
          if (response.success && response.data) {
            console.log(`Found ${response.data.length} manager projects`);
            allProjects.push(...response.data);
            hasAnySuccess = true;
          }
          completedRequests++;
          processResults();
        },
        error: (error) => {
          console.warn('Manager projects request failed:', error);
          completedRequests++;
          processResults();
        }
      });
    });
  }

  /**
   * Try individual endpoints as fallback
   */
  private tryIndividualEndpoints(userId: string, pageNumber: number = 1, pageSize: number = 8): Observable<PaginatedResponse<Project>> {
    console.log('Trying individual fallback endpoints...');
    
    // Try different endpoint variations that might work for both members and managers
    const endpoints = [
      // Member endpoints
      `/Projects/user/${userId}/member?pageNumber=${pageNumber}&pageSize=${pageSize}`,
      `/Projects/user/${userId}/all?pageNumber=${pageNumber}&pageSize=${pageSize}`,
      `/Projects/members/${userId}?pageNumber=${pageNumber}&pageSize=${pageSize}`,
      `/User/${userId}/projects?pageNumber=${pageNumber}&pageSize=${pageSize}`,
      // Manager endpoints  
      `/Projects/user/${userId}/manager?pageNumber=${pageNumber}&pageSize=${pageSize}`,
      `/Projects/manager/${userId}?pageNumber=${pageNumber}&pageSize=${pageSize}`,
      `/User/${userId}/managed-projects?pageNumber=${pageNumber}&pageSize=${pageSize}`,
      // Combined endpoints
      `/Projects/user/${userId}/both?pageNumber=${pageNumber}&pageSize=${pageSize}`,
      `/User/${userId}/all-projects?pageNumber=${pageNumber}&pageSize=${pageSize}`
    ];

    const tryEndpoint = (index: number): Observable<PaginatedResponse<Project>> => {
      if (index >= endpoints.length) {
        // If all endpoints fail, return empty result instead of error
        console.warn('All user project endpoints failed, returning empty result');
        return new Observable(observer => {
          observer.next({
            data: [],
            totalRecords: 0,
            pageNumber: 1,
            pageSize: pageSize,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: false
          });
          observer.complete();
        });
      }

      const url = endpoints[index];
      console.log(`Trying endpoint ${index + 1}: ${url}`);
      
      return this.authService.makeAuthenticatedRequest<BackendPaginatedResponse<Project>>('GET', url)
        .pipe(
          map(response => {
            if (response.success && response.data) {
              console.log(`Endpoint ${index + 1} succeeded:`, response);
              
              // Handle responses that might not have pagination metadata
              const data = Array.isArray(response.data) ? response.data : [];
              const totalRecords = response.totalRecords ?? data.length;
              const currentPageNumber = response.pageNumber ?? pageNumber;
              const currentPageSize = response.pageSize ?? pageSize;
              const totalPages = response.totalPages ?? Math.ceil(totalRecords / currentPageSize);
              
              return {
                data: data,
                totalRecords: totalRecords,
                pageNumber: currentPageNumber,
                pageSize: currentPageSize,
                totalPages: totalPages,
                hasNextPage: currentPageNumber < totalPages,
                hasPreviousPage: currentPageNumber > 1
              };
            } else {
              throw new Error(`Endpoint ${index + 1} failed: ${response.message}`);
            }
          }),
          catchError(error => {
            console.warn(`Endpoint ${index + 1} failed:`, error);
            return tryEndpoint(index + 1);
          })
        );
    };

    return tryEndpoint(0);
  }

  /**
   * Fallback method for getting only projects where user is a member
   */
  private getUserProjectsMemberOnly(userId: string, pageNumber: number = 1, pageSize: number = 8): Observable<PaginatedResponse<Project>> {
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
    const currentUserId = this.authService.getCurrentUserId();
    const userRoles = this.authService.getCurrentUserRoles();
    
    console.log(`Getting projects for user: ${currentUserId}, roles:`, userRoles);
    
    if (!currentUserId) {
      return throwError(() => new Error('User is not authenticated'));
    }

    // Check if user is admin
    const isAdmin = userRoles.some((role: string) => 
      role.toLowerCase() === 'admin' || role.toLowerCase() === 'administrator'
    );

    if (isAdmin) {
      // If admin, get all projects
      console.log('User is admin, getting all projects');
      return this.getAllProjectsPaginated(pageNumber, pageSize);
    } else {
      // If regular user, use the comprehensive filtering approach
      // This will get all projects and filter for ones where user is member or manager
      console.log('User is regular user, using comprehensive filtering approach');
      return this.getFilteredProjectsByUserInvolvement(currentUserId, pageNumber, pageSize);
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
    const currentUserId = this.authService.getCurrentUserId();
    if (!currentUserId) {
      return throwError(() => new Error('User is not authenticated'));
    }

    return this.getAllProjects().pipe(
      map(projects => projects.map(project => ({
        projectId: project.projectId,
        userId: currentUserId,
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
    const currentUserId = this.authService.getCurrentUserId();
    const userRoles = this.authService.getCurrentUserRoles();
    
    if (!currentUserId) {
      return throwError(() => new Error('User is not authenticated'));
    }

    // Admin has access to all projects
    const isAdmin = userRoles.some((role: string) => 
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
  leaveProject(projectId: string): Observable<ApiResponse<any>> {
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
  deleteProject(projectId: string): Observable<ApiResponse<any>> {
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
