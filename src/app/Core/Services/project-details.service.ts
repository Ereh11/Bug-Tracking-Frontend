import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, throwError, map, switchMap } from 'rxjs';
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
    this.authService.makeAuthenticatedRequest<ApiResponse<SystemUser[]>>('GET', '/users')
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message || 'Failed to load users');
          }
          return response.data;
        }),
        catchError(error => {
          console.error('Error loading users:', error);
          return throwError(() => error);
        })
      )
      .subscribe(users => {
        this.allUsersSubject.next(users);
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
      assignedTo: null // Backend doesn't provide this, you might need to add it
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
        map(response => {
          console.log('Backend response:', response);
          if (!response.success) {
            throw new Error(response.message || 'Failed to load project');
          }
          console.log('Transforming backend data:', response.data);
          const transformedData = this.transformBackendData(response.data);
          console.log('Transformed data:', transformedData);
          this.projectDataSubject.next(transformedData);
          this.loadingSubject.next(false);
          return transformedData;
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

  updateBug(projectId: string, bugId: string, updates: Partial<Bug>): Observable<ProjectData> {
    const bugData: any = {};
    if (updates.title) bugData.title = updates.title;
    if (updates.description) bugData.description = updates.description;
    if (updates.status) bugData.status = this.reverseStatusMap[updates.status];
    if (updates.priority) bugData.priority = this.reversePriorityMap[updates.priority];

    return this.authService.makeAuthenticatedRequest<ApiResponse<BackendProjectData>>('PUT', `/projects/${projectId}/bugs/${bugId}`, bugData)
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message || 'Failed to update bug');
          }
          const transformedData = this.transformBackendData(response.data);
          this.projectDataSubject.next(transformedData);
          return transformedData;
        }),
        catchError(error => {
          this.errorSubject.next(error.message || 'Failed to update bug');
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