import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, throwError, map, switchMap, firstValueFrom, from, filter, of } from 'rxjs';
import { AuthService } from './auth.service';

// Backend response interfaces
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message: string;
  errors: string[] | null;
}

export interface BackendUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  roles?: string[] | null;
}

export interface BackendBug {
  id: string;
  title: string;
  description: string;
  status: number; // 1 = New, 2 = In Progress, 3 = Resolved, etc.
  priority: number; // 1 = Low, 2 = Medium, 3 = High, 4 = Critical
}

export interface BackendProjectData {
  projectId: string;
  name: string;
  description: string;
  status: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  manager: BackendUser;
  users: BackendUser[];
  bugs: BackendBug[];
}

// Frontend interfaces (transformed from backend)
export interface Bug {
  id: string;
  title: string;
  description: string;
  status: 'New' | 'In Progress' | 'Resolved' | 'Closed' | 'Reopened' | 'Assigned';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  assignedTo: string | null;
}

export interface Member {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'Manager' | 'Developer' | 'Tester' | 'Designer';
  isActive: boolean;
}

export interface ProjectInfo {
  id: string;
  name: string;
  description: string;
  status: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}

export interface Manager {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
}

export interface ProjectData {
  info: ProjectInfo;
  manager: Manager;
  members: Member[];
  bugs: Bug[];
}
export interface SystemUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  roles: { id: string; name: string; description: string }[];
}

export interface ChangeAssignmentDto {
  olduserid: string | null;
  newuserid: string | null;
  assigneddate: string;
}

export interface UpdateBugRequest {
  title: string;
  description: string;
  status: number;
  priority: number;
  changeassignmentdto: ChangeAssignmentDto;
}

export interface UpdateBugResponse {
  success: boolean;
  message: string;
  errors: any;
}

export interface BugDetailsResponse {
  data: {
    id: string;
    title: string;
    description: string;
    status: number;
    priority: number;
    project: {
      projectId: string;
      name: string;
    };
    attachments: any[];
    bugAssignmentUser: Array<{
      userName: string;
    }>;
  };
  success: boolean;
  message: string;
  errors: any;
}

export interface BugAssignee {
  bugId: string;
  userId: string;
  assignedDate: string;
}

export interface AssignBugRequest {
  userid: string;
  assigneddate: string;
}

export interface DeleteBugResponse {
  success: boolean;
  message: string;
  errors: any;
}

@Injectable({
  providedIn: 'root'
})
export class ProjectDetailsService {
  private projectDataSubject = new BehaviorSubject<ProjectData | null>(null);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);

  // Observables for components to subscribe to
  public projectData$ = this.projectDataSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public error$ = this.errorSubject.asObservable();
  private allUsersSubject = new BehaviorSubject<SystemUser[]>([]);
  public allUsers$ = this.allUsersSubject.asObservable();
  private usersLoaded = false;

   constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    this.loadAllUsers(); // Load all users on service initialization
  }

  // Status mappings
  private readonly statusMap: { [key: number]: Bug['status'] } = {
    1: 'New',
    2: 'Assigned',
    3: 'In Progress', 
    4: 'Resolved',
    5: 'Closed',
    6: 'Reopened'
  };

  private readonly priorityMap: { [key: number]: Bug['priority'] } = {
    1: 'Low',
    2: 'Medium',
    3: 'High',
    4: 'Critical'
  };

  private readonly reverseStatusMap: { [key in Bug['status']]: number } = {
    'New': 1,
    'Assigned': 2,
    'In Progress': 3,
    'Resolved': 4,
    'Closed': 5,
    'Reopened': 6
  };

  private readonly reversePriorityMap: { [key in Bug['priority']]: number } = {
    'Low': 1,
    'Medium': 2,
    'High': 3,
    'Critical': 4
  };
  loadAllUsers(): void {
    console.log('Loading all users...');
    this.authService.makeAuthenticatedRequest<ApiResponse<SystemUser[]>>('GET', '/users')
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message || 'Failed to load users');
          }
          console.log('Users loaded successfully:', response.data.length, 'users');
          console.log('User details:', response.data.map(u => `${u.firstName} ${u.lastName} (${u.id})`));
          return response.data;
        }),
        catchError(error => {
          console.error('Error loading users:', error);
          return throwError(() => error);
        })
      )
      .subscribe(users => {
        this.allUsersSubject.next(users);
        this.usersLoaded = true;
        console.log('Users set in allUsersSubject:', users.length);
      });
  }
  // Transform backend data to frontend format
  private transformBackendData(backendData: BackendProjectData): ProjectData {
    const transformUser = (user: BackendUser, isManager = false): Member => ({
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: isManager ? 'Manager' : 'Developer', // Default role, you can enhance this
      isActive: user.isActive
    });

    const transformBug = (bug: BackendBug): Bug => ({
      id: bug.id,
      title: bug.title,
      description: bug.description,
      status: this.statusMap[bug.status] || 'New',
      priority: this.priorityMap[bug.priority] || 'Low',
      assignedTo: null // Will be populated separately via loadBugAssignees
    });

    return {
      info: {
        id: backendData.projectId,
        name: backendData.name,
        description: backendData.description,
        status: backendData.status,
        startDate: new Date(backendData.startDate),
        endDate: new Date(backendData.endDate),
        isActive: backendData.isActive
      },
      manager: backendData.manager ? {
        id: backendData.manager.id,
        name: `${backendData.manager.firstName} ${backendData.manager.lastName}`,
        firstName: backendData.manager.firstName,
        lastName: backendData.manager.lastName,
        email: backendData.manager.email,
        isActive: backendData.manager.isActive
      } : {
        id: '',
        name: 'No Manager Assigned',
        firstName: '',
        lastName: '',
        email: '',
        isActive: false
      },
      members: backendData.users.map(user => 
        transformUser(user, backendData.manager && user.id === backendData.manager.id)
      ),
      bugs: backendData.bugs.map(transformBug)
    };
  }

  // Load project data from backend
  loadProject(projectId: string): Observable<ProjectData> {
    console.log('Loading project with ID:', projectId);
    this.loadingSubject.next(true);
    this.errorSubject.next(null);
    // Clear any existing project data when starting a new load
    this.projectDataSubject.next(null);

    return this.authService.makeAuthenticatedRequest<ApiResponse<BackendProjectData>>('GET', `/projects/${projectId}`)
      .pipe(
        switchMap(response => {
          console.log('Backend response:', response);
          if (!response.success) {
            throw new Error(response.message || 'Failed to load project');
          }
          console.log('Transforming backend data:', response.data);
          const transformedData = this.transformBackendData(response.data);
          console.log('Transformed data:', transformedData);
          
          // Load assignee information for all bugs before setting the project data
          return from(
            this.loadBugAssignees(transformedData.bugs).then((bugsWithAssignees: Bug[]) => {
              const updatedData = { ...transformedData, bugs: bugsWithAssignees };
              this.projectDataSubject.next(updatedData);
              console.log('Updated data with assignees:', updatedData);
              this.loadingSubject.next(false);
              return updatedData;
            }).catch(error => {
              console.log('Failed to load bug assignees, continuing without them:', error);
              // Keep the original data without assignees
              this.projectDataSubject.next(transformedData);
              this.loadingSubject.next(false);
              return transformedData;
            })
          );
        }),
        catchError(error => {
          console.error('Error in loadProject:', error);
          this.loadingSubject.next(false);
          this.projectDataSubject.next(null); // Clear project data on error
          this.errorSubject.next(error.message || 'Failed to load project');
          return throwError(() => error);
        })
      );
  }

  // Getters for current values
  get currentProjectData(): ProjectData | null {
    return this.projectDataSubject.value;
  }

  get projectInfo(): ProjectInfo | null {
    return this.currentProjectData?.info || null;
  }

  get manager(): Manager | null {
    return this.currentProjectData?.manager || null;
  }

  get members(): Member[] {
    return this.currentProjectData?.members || [];
  }

  get bugs(): Bug[] {
    return this.currentProjectData?.bugs || [];
  }

  // Project Info Methods
  updateProjectInfo(projectId: string, info: Partial<Omit<ProjectInfo, 'id'>>): Observable<ProjectData> {
    const updateData = {
      name: info.name,
      description: info.description,
      status: info.status,
      startDate: info.startDate?.toISOString(),
      endDate: info.endDate?.toISOString(),
      isActive: info.isActive
    };

    return this.authService.makeAuthenticatedRequest<ApiResponse<any>>('PUT', `/projects/${projectId}`, updateData)
      .pipe(
        switchMap(response => {
          if (!response.success) {
            throw new Error(response.message || 'Failed to update project');
          }
          
          // Since backend returns data: null, we need to reload the project
          return this.loadProject(projectId);
        }),
        catchError(error => {
          this.errorSubject.next(error.message || 'Failed to update project');
          return throwError(() => error);
        })
      );
  }

  // Manager Methods
  updateManager(projectId: string, managerId: string): Observable<ProjectData> {
    return this.authService.makeAuthenticatedRequest<ApiResponse<BackendProjectData>>('PUT', `/projects/${projectId}/manager`, { managerId })
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message || 'Failed to update manager');
          }
          const transformedData = this.transformBackendData(response.data);
          this.projectDataSubject.next(transformedData);
          return transformedData;
        }),
        catchError(error => {
          this.errorSubject.next(error.message || 'Failed to update manager');
          return throwError(() => error);
        })
      );
  }

  // Member Methods
  addMember(projectId: string, userId: string): Observable<ProjectData> {
    return this.authService.makeAuthenticatedRequest<ApiResponse<BackendProjectData>>('POST', `/projects/${projectId}/members`, { userId })
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message || 'Failed to add member');
          }
          const transformedData = this.transformBackendData(response.data);
          this.projectDataSubject.next(transformedData);
          return transformedData;
        }),
        catchError(error => {
          this.errorSubject.next(error.message || 'Failed to add member');
          return throwError(() => error);
        })
      );
  }

  // Add member to project using ProjectMembers endpoint
  addMemberToProject(projectId: string, userId: string, notes: string = ''): Observable<ProjectData> {
    const requestBody = {
      projectid: projectId,
      userid: userId,
      notes: notes,
      joindate: new Date().toISOString()
    };

    return this.authService.makeAuthenticatedRequest<ApiResponse<any>>('POST', '/ProjectMembers', requestBody)
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message || 'Failed to add member to project');
          }
          
          // Return the current project data - don't trigger any refresh here
          const currentData = this.currentProjectData;
          if (!currentData) {
            throw new Error('No current project data available');
          }
          
          return currentData;
        }),
        catchError(error => {
          this.errorSubject.next(error.message || 'Failed to add member to project');
          return throwError(() => error);
        })
      );
  }

  removeMember(projectId: string, userId: string): Observable<ProjectData> {
    return this.authService.makeAuthenticatedRequest<ApiResponse<any>>('DELETE', `/projects/${projectId}/member/${userId}`)
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message || 'Failed to remove member');
          }
          
          // Return the current project data - don't trigger any refresh here
          const currentData = this.currentProjectData;
          if (!currentData) {
            throw new Error('No current project data available');
          }
          
          return currentData;
        }),
        catchError(error => {
          this.errorSubject.next(error.message || 'Failed to remove member');
          return throwError(() => error);
        })
      );
  }

  // Bug Methods
  addBug(projectId: string, bug: Omit<Bug, 'id' | 'assignedTo'>): Observable<ProjectData> {
    const bugData = {
      title: bug.title,
      description: bug.description,
      status: this.reverseStatusMap[bug.status],
      priority: this.reversePriorityMap[bug.priority]
    };

    return this.authService.makeAuthenticatedRequest<ApiResponse<BackendProjectData>>('POST', `/projects/${projectId}/bugs`, bugData)
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message || 'Failed to add bug');
          }
          const transformedData = this.transformBackendData(response.data);
          this.projectDataSubject.next(transformedData);
          return transformedData;
        }),
        catchError(error => {
          this.errorSubject.next(error.message || 'Failed to add bug');
          return throwError(() => error);
        })
      );
  }

  // New method for the specific API endpoint you provided
  createBug(projectId: string, title: string, description: string, status: number, priority: number): Observable<any> {
    const bugData = {
      title: title,
      description: description,
      projectId: projectId,
      status: status,
      priority: priority
    };

    return this.authService.makeAuthenticatedRequest<ApiResponse<any>>('POST', '/bugs', bugData)
      .pipe(
        switchMap(response => {
          if (!response.success) {
            throw new Error(response.message || 'Failed to create bug');
          }
          
          // Since backend returns success message only, reload project data
          return this.loadProject(projectId);
        }),
        catchError(error => {
          this.errorSubject.next(error.message || 'Failed to create bug');
          return throwError(() => error);
        })
      );
  }

  updateBug(bugId: string, updates: Partial<Bug>, oldAssigneeId?: string | null, newAssigneeId?: string | null): Observable<UpdateBugResponse> {
    const updateBugData: UpdateBugRequest = {
      title: updates.title || '',
      description: updates.description || '',
      status: updates.status ? this.reverseStatusMap[updates.status] : 1,
      priority: updates.priority ? this.reversePriorityMap[updates.priority] : 1,
      changeassignmentdto: {
        olduserid: oldAssigneeId || null,
        newuserid: newAssigneeId || null,
        assigneddate: new Date().toISOString().split('T')[0]
      }
    };

    console.log('Updating bug with data:', updateBugData);
    console.log('Bug ID being updated:', bugId);

    return this.authService.makeAuthenticatedRequest<UpdateBugResponse>('PUT', `/bugs/${bugId}`, updateBugData)
      .pipe(
        switchMap(response => {
          if (!response.success) {
            throw new Error(response.message || 'Failed to update bug');
          }
          
          console.log('Bug update response:', response);
          
          // Add a delay before reloading to allow backend to process
          return from(
            new Promise<UpdateBugResponse>(resolve => {
              setTimeout(() => {
                console.log('Waiting 2 seconds before reloading project to allow backend processing...');
                // Since backend returns success message only, reload project data
                const currentProject = this.currentProjectData;
                if (currentProject?.info?.id) {
                  this.loadProject(currentProject.info.id).subscribe({
                    next: () => {
                      console.log('Project reloaded after bug update');
                      resolve(response);
                    },
                    error: (error) => {
                      console.error('Error reloading project:', error);
                      resolve(response); // Still resolve with the original response
                    }
                  });
                } else {
                  resolve(response);
                }
              }, 2000); // Wait 2 seconds
            })
          );
        }),
        catchError(error => {
          this.errorSubject.next(error.message || 'Failed to update bug');
          return throwError(() => error);
        })
      );
  }

  // Delete bug using the new endpoint
  deleteBug(bugId: string): Observable<DeleteBugResponse> {
    return this.authService.makeAuthenticatedRequest<DeleteBugResponse>('DELETE', `/bugs/${bugId}`)
      .pipe(
        switchMap(response => {
          if (!response.success) {
            throw new Error(response.message || 'Failed to delete bug');
          }
          
          console.log('Bug deleted successfully:', response.message);
          
          // Reload project data to reflect the deletion
          const currentProject = this.currentProjectData;
          if (currentProject?.info?.id) {
            this.loadProject(currentProject.info.id).subscribe();
          }
          
          return of(response);
        }),
        catchError(error => {
          this.errorSubject.next(error.message || 'Failed to delete bug');
          return throwError(() => error);
        })
      );
  }

  removeBug(projectId: string, bugId: string): Observable<ProjectData> {
    return this.authService.makeAuthenticatedRequest<ApiResponse<BackendProjectData>>('DELETE', `/projects/${projectId}/bugs/${bugId}`)
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message || 'Failed to remove bug');
          }
          const transformedData = this.transformBackendData(response.data);
          this.projectDataSubject.next(transformedData);
          return transformedData;
        }),
        catchError(error => {
          this.errorSubject.next(error.message || 'Failed to remove bug');
          return throwError(() => error);
        })
      );
  }

  // Utility Methods
  getMemberById(memberId: string): Member | undefined {
    return this.members.find(member => member.id === memberId);
  }

  getBugById(bugId: string): Bug | undefined {
    return this.bugs.find(bug => bug.id === bugId);
  }

  // Get bug details including assignees using the new endpoint
  getBugDetails(bugId: string): Observable<BugDetailsResponse> {
    return this.authService.makeAuthenticatedRequest<BugDetailsResponse>('GET', `/bugs/${bugId}`)
      .pipe(
        catchError(error => {
          console.error(`Failed to get bug details for ${bugId}:`, error);
          return throwError(() => error);
        })
      );
  }

  // Get current assignees of a bug (deprecated - use getBugDetails instead)
  getBugAssignees(bugId: string): Observable<any> {
    return this.authService.makeAuthenticatedRequest<any>('GET', `/bugs/${bugId}/assignees`)
      .pipe(
        catchError(error => {
          // Don't log 404 errors as they're expected for bugs without assignees
          if (error.status !== 404) {
            this.errorSubject.next(error.message || 'Failed to get bug assignees');
          }
          return throwError(() => error);
        })
      );
  }

  // Assign bug to user
  assignBugToUser(bugId: string, assignmentData: AssignBugRequest): Observable<any> {
    return this.authService.makeAuthenticatedRequest<any>('POST', `/bugs/${bugId}/assign`, assignmentData)
      .pipe(
        catchError(error => {
          console.error(`Failed to assign bug ${bugId}:`, error);
          return throwError(() => error);
        })
      );
  }

  // Unassign bug from user
  unassignBugFromUser(bugId: string, userId: string): Observable<any> {
    return this.authService.makeAuthenticatedRequest<any>('DELETE', `/bugs/${bugId}/assignees/${userId}`)
      .pipe(
        catchError(error => {
          console.error(`Failed to unassign bug ${bugId} from user ${userId}:`, error);
          return throwError(() => error);
        })
      );
  }

  // Load assignee information for multiple bugs using the new bug details endpoint
  private async loadBugAssignees(bugs: Bug[]): Promise<Bug[]> {
    console.log('Loading assignees for', bugs.length, 'bugs using new bug details endpoint');
    
    const bugsWithAssignees = await Promise.all(
      bugs.map(async (bug) => {
        try {
          const response = await firstValueFrom(this.getBugDetails(bug.id));
          console.log(`Bug details response for bug ${bug.id}:`, response);
          
          if (response && response.success && response.data) {
            const bugData = response.data;
            let assigneeName: string | null = null;
            
            // Check if there are any assigned users
            if (bugData.bugAssignmentUser && bugData.bugAssignmentUser.length > 0) {
              // Get the first assigned user (assuming one assignee per bug for now)
              assigneeName = bugData.bugAssignmentUser[0].userName;
              console.log(`Bug ${bug.id} assigned to: ${assigneeName}`);
            } else {
              console.log(`Bug ${bug.id} has no assignee`);
            }
            
            return {
              ...bug,
              assignedTo: assigneeName
            };
          }
          
          console.log(`Bug ${bug.id} - invalid response or no data`);
          return bug; // Return bug with assignedTo: null if invalid response
        } catch (error: any) {
          console.error(`Failed to load details for bug ${bug.id}:`, error);
          return bug; // Return bug with assignedTo: null on error
        }
      })
    );
    
    console.log('Finished loading assignees. Bugs with assignees:', bugsWithAssignees.filter(b => b.assignedTo).length);
    console.log('Final bugs array:', bugsWithAssignees.map(b => ({ id: b.id, title: b.title, assignedTo: b.assignedTo })));
    
    // Special debug for recently updated bugs
    const recentUpdateBugId = '4a5ad7a5-1131-4411-6e59-08ddca9b986b'; // The bug from your logs
    const recentBug = bugsWithAssignees.find(b => b.id === recentUpdateBugId);
    if (recentBug) {
      console.log(`DEBUG: Recently updated bug ${recentUpdateBugId} now has assignedTo: "${recentBug.assignedTo}"`);
    }
    
    return bugsWithAssignees;
  }

  getBugsByAssignee(assigneeName: string): Bug[] {
    return this.bugs.filter(bug => bug.assignedTo === assigneeName);
  }

  getBugsByStatus(status: Bug['status']): Bug[] {
    return this.bugs.filter(bug => bug.status === status);
  }

  getBugsByPriority(priority: Bug['priority']): Bug[] {
    return this.bugs.filter(bug => bug.priority === priority);
  }

  // Refresh current project
  refreshProject(): Observable<ProjectData> | null {
    const currentProject = this.currentProjectData;
    if (currentProject) {
      return this.loadProject(currentProject.info.id);
    }
    return null;
  }

  // Clear current project data
  clearProject(): void {
    this.projectDataSubject.next(null);
    this.errorSubject.next(null);
  }
}