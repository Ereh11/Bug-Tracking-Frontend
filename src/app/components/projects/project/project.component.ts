import { CommonModule } from '@angular/common';
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { RouterModule, Router } from '@angular/router';
import { ProjectService, UserProject, PaginatedResponse } from '../../../Core/Services/projects.service';
import { AuthService } from '../../../Core/Services/auth.service'; 

@Component({
  selector: 'app-project',
  imports: [LucideAngularModule, CommonModule, RouterModule],
  templateUrl: './project.component.html',
  styleUrl: './project.component.css',
})
export class ProjectComponent implements OnInit {
  @Input() currentPage: number = 1;
  @Input() pageSize: number = 8;
  @Output() paginationChange = new EventEmitter<PaginatedResponse<any>>();

  showConfirmPopup = false;
  projects: UserProject[] = [];
  allProjects: UserProject[] = []; // For system-wide statistics
  allLoadedProjects: UserProject[] = []; // Store all projects for filtering
  currentFilter: string = 'All status'; // Track current filter
  currentSearch: string = ''; // Track current search term
  isLoading = false;
  errorMessage: string | null = null;
  errorType: 'general' | 'server' | 'network' | null = null;
  selectedProjectId: string | null = null;
  currentUserId: string | null = null;
  isDeleting = false;
  isAdmin = false;
  paginationInfo: PaginatedResponse<any> | null = null;

  constructor(
    private projectService: ProjectService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.currentUserId = this.authService.getCurrentUserId();
    this.isAdmin = this.authService.isAdmin();
    this.loadProjects();
    
    // Load system-wide statistics for admins
    if (this.isAdmin) {
      this.loadSystemStatistics();
    }
  }

  ngOnChanges() {
    // Reload projects when page changes
    this.loadProjects();
  }

  loadProjects() {
    this.isLoading = true;
    this.errorMessage = null;
    this.errorType = null;
    
    if (this.isAdmin) {
      // For admin users, get all projects directly
      this.projectService.getAllProjectsPaginated(this.currentPage, this.pageSize).subscribe({
        next: (paginatedResponse: any) => {
          console.log('Admin projects loaded:', paginatedResponse);
          
          // Transform Project[] to UserProject[] format for consistency
          const userProjects = paginatedResponse.data.map((project: any) => ({
            projectId: project.projectId,
            userId: this.currentUserId,
            notes: project.description || '',
            joinedDate: new Date(project.startDate || Date.now()),
            project: project
          }));
          
          this.projects = userProjects;
          this.paginationInfo = paginatedResponse;
          this.isLoading = false;
          
          // Emit pagination info to parent component
          this.paginationChange.emit(paginatedResponse);
          
          if (!userProjects || userProjects.length === 0) {
            console.warn('No projects found for the current page.');
          }
        },
        error: (error: any) => {
          console.error('Error loading admin projects:', error);
          this.handleLoadError(error);
        }
      });
    } else {
      // For regular users, get their projects
      this.projectService.getProjectsForCurrentUserPaginated(this.currentPage, this.pageSize).subscribe({
        next: (response: any) => {
          console.log('User projects loaded:', response);
          
          this.projects = response.projects;
          this.paginationInfo = response.pagination;
          this.isLoading = false;
          
          // Emit pagination info to parent component
          this.paginationChange.emit(response.pagination);
          
          if (!response.projects || response.projects.length === 0) {
            console.warn('No projects found for the current page.');
          }
        },
        error: (error: any) => {
          console.error('Error loading user projects:', error);
          this.handleLoadError(error);
        }
      });
    }
  }

  private handleLoadError(error: any) {
    this.isLoading = false;
    
    if (error.status === 500 || error.message?.includes('500') || error.message?.includes('Internal Server Error')) {
      this.errorType = 'server';
      this.errorMessage = 'Server is experiencing issues. Please try again later.';
    } else if (error.status === 0 || error.message?.includes('network') || error.message?.includes('connection')) {
      this.errorType = 'network';
      this.errorMessage = 'Network connection failed. Please check your internet connection.';
    } else {
      this.errorType = 'general';
      this.errorMessage = error.message || 'Failed to load projects';
    }
  }

  loadSystemStatistics() {
    // Load all projects for system-wide statistics (admin only)
    if (this.isAdmin) {
      this.projectService.getAllProjectsPaginated(1, 1000).subscribe({
        next: (response: any) => {
          console.log('Admin projects loaded:', response);
          
          // Extract the actual projects data from the response
          const allProjectsData = response.data || [];
          
          // Convert to UserProject format for consistency
          this.allProjects = allProjectsData.map((project: any) => ({
            projectId: project.projectId,
            userId: this.currentUserId || '',
            notes: project.description || '',
            joinedDate: new Date(project.startDate || Date.now()),
            project: project
          }));
          
          console.log('System statistics loaded:', this.allProjects.length, 'total projects');
          console.log('Total bugs in system:', this.getTotalBugsCount());
          
          // Debug: Log each project's bug count
          this.allProjects.forEach(userProject => {
            const bugCount = userProject.project?.bugs?.length || 0;
            console.log(`Project "${userProject.project?.name}": ${bugCount} bugs`, userProject.project?.bugs);
          });
        },
        error: (error: any) => {
          console.error('Error loading system statistics:', error);
          // Don't show error to user for statistics, just log it
        }
      });
    }
  }

  openDeleteConfirmation(projectId: string, event: Event) {
    event.stopPropagation();
    this.selectedProjectId = projectId;
    this.showConfirmPopup = true;
  }

  confirmDelete() {
    if (this.selectedProjectId) {
      this.isDeleting = true;
      
      if (this.isCurrentUserAdmin()) {
        console.log('Deleting project:', this.selectedProjectId);
        
        this.projectService.deleteProject(this.selectedProjectId).subscribe({
          next: () => {
            console.log('Successfully deleted project');
            // Reload current page after deletion
            this.loadProjects();
            this.closeDeleteConfirmation();
            this.isDeleting = false;
          },
          error: (error) => {
            console.error('Error deleting project:', error);
            this.errorMessage = error.message || 'Failed to delete project';
            this.closeDeleteConfirmation();
            this.isDeleting = false;
          }
        });
      } else {
        console.log('Leaving project:', this.selectedProjectId);
        
        this.projectService.leaveProject(this.selectedProjectId).subscribe({
          next: () => {
            console.log('Successfully left project');
            // Reload current page after leaving
            this.loadProjects();
            this.closeDeleteConfirmation();
            this.isDeleting = false;
          },
          error: (error) => {
            console.error('Error leaving project:', error);
            this.errorMessage = error.message || 'Failed to leave project';
            this.closeDeleteConfirmation();
            this.isDeleting = false;
          }
        });
      }
    } else {
      this.closeDeleteConfirmation();
    }
  }

  cancelDelete() {
    this.closeDeleteConfirmation();
  }

  private closeDeleteConfirmation() {
    this.showConfirmPopup = false;
    this.selectedProjectId = null;
  }

  navigateToProject(projectId: string) {
    this.router.navigate(['/details', projectId]);
  }

  isCurrentUserAdmin(): boolean {
    return this.authService.isAdmin();
  }

  canShowDeleteButton(): boolean {
    return this.isCurrentUserAdmin();
  }

  getDeleteConfirmationMessage(): string {
    if (this.isCurrentUserAdmin()) {
      return 'Are you sure you want to delete this project? This action cannot be undone and will remove the project for all users.';
    }
    return 'Are you sure you want to leave this project?';
  }

  getDeleteButtonText(): string {
    if (this.isCurrentUserAdmin()) {
      return 'Delete Project';
    }
    return 'Leave Project';
  }

  getProjectDisplayName(project: UserProject, index: number): string {
    return project.project?.name || `Project #${index + 1}`;
  }

  getProjectDescription(project: UserProject): string {
    return project.notes || 
           project.project?.description || 
           'No description available for this project.';
  }

  getProjectStatusDisplay(project: UserProject): string {
    if (project.project?.isActive) {
      return 'Active';
    }
    return 'Inactive';
  }

  getProjectStatusColorClass(project: UserProject): string {
    if (project.project?.isActive) {
      return 'bg-completed';
    }
    return 'bg-error';
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    }).format(date);
  }

  refreshProjects() {
    this.loadProjects();
  }

  getErrorIcon(): string {
    switch (this.errorType) {
      case 'server':
        return 'server-crash';
      case 'network':
        return 'wifi-off';
      default:
        return 'alert-circle';
    }
  }

  getErrorTitle(): string {
    switch (this.errorType) {
      case 'server':
        return 'Server Error';
      case 'network':
        return 'Connection Error';
      default:
        return 'Error Loading Projects';
    }
  }

  getTeamSize(project: UserProject): number {
    return project.project?.users?.length || 0;
  }

  isUserAdminInProject(project: UserProject): boolean {
    if (!this.currentUserId || !project.project) {
      return false;
    }
    
    const currentUser = project.project.users.find(user => user.id === this.currentUserId);
    return currentUser?.roles?.includes('admin') || 
           currentUser?.roles?.includes('Admin') || 
           this.authService.isAdmin();
  }

  canDeleteProject(project: UserProject): boolean {
    return this.isUserAdminInProject(project);
  }

  getCurrentUserDisplayName(): string {
    return this.authService.getCurrentUserName();
  }

  getCurrentUserFirstName(): string {
    return this.authService.getCurrentUserFirstName() || 'there';
  }

  getBugsCount(project: UserProject): number {
    return project.project?.bugs?.length || 0;
  }

  getTotalBugsCount(): number {
    if (this.isAdmin) {
      // For admin, use allProjects for system-wide statistics
      if (this.allProjects && this.allProjects.length > 0) {
        const totalBugs = this.allProjects.reduce((sum, userProject) => {
          const bugCount = userProject.project?.bugs?.length || 0;
          return sum + bugCount;
        }, 0);
        console.log('Admin total bugs calculation:', totalBugs, 'from', this.allProjects.length, 'projects');
        return totalBugs;
      } else {
        // Fallback to current page if allProjects not loaded yet
        console.log('Admin fallback: using current page projects for bug count');
        return this.projects.reduce((sum, userProject) => {
          const bugCount = userProject.project?.bugs?.length || 0;
          return sum + bugCount;
        }, 0);
      }
    } else {
      // For regular users, count bugs in their projects
      return this.projects.reduce((sum, userProject) => {
        const bugCount = userProject.project?.bugs?.length || 0;
        return sum + bugCount;
      }, 0);
    }
  }

  getActiveProjectsCount(): number {
    if (this.isAdmin) {
      // For admin, use allProjects for system-wide statistics
      if (this.allProjects && this.allProjects.length > 0) {
        return this.allProjects.filter(userProject => userProject.project?.isActive).length;
      } else {
        // Fallback to current page if allProjects not loaded yet
        return this.projects.filter(userProject => userProject.project?.isActive).length;
      }
    } else {
      // For regular users, count active projects in their current projects
      return this.projects.filter(userProject => userProject.project?.isActive).length;
    }
  }

  getTotalProjectsCount(): number {
    // For admin users, show total system count from pagination info
    if (this.isAdmin && this.paginationInfo) {
      return this.paginationInfo.totalRecords || 0;
    }
    // For regular users, show their total project count
    return this.paginationInfo?.totalRecords || 0;
  }

  getPageTitle(): string {
    return this.isAdmin ? 'All System Projects' : 'My Projects';
  }

  getNoProjectsMessage(): string {
    if (this.isAdmin) {
      return 'No projects found in the system';
    }
    return 'You haven\'t joined any projects yet';
  }

  isUserInProject(project: UserProject): boolean {
    if (!this.currentUserId || !project.project) {
      return false;
    }
    return project.project.users.some(user => user.id === this.currentUserId);
  }

  getUserRoleInProject(project: UserProject): string {
    if (!this.currentUserId || !project.project) {
      return 'Not a member';
    }
    
    const currentUser = project.project.users.find(user => user.id === this.currentUserId);
    if (!currentUser) {
      return 'Not a member';
    }
    
    if (currentUser.roles?.includes('admin') || currentUser.roles?.includes('Admin')) {
      return 'Admin';
    }
    
    return 'Member';
  }

  // Method to handle project creation from parent
  onProjectCreated() {
    // Reload the first page when a new project is created
    this.currentPage = 1;
    this.currentFilter = 'All status'; // Reset filter when new project is created
    this.currentSearch = ''; // Reset search when new project is created
    this.loadProjects();
    
    // Reload system statistics for admin users to include the new project
    if (this.isAdmin) {
      this.loadSystemStatistics();
    }
  }

  // Combined filter and search methods
  applyFilters(filterStatus: string, searchTerm: string) {
    this.currentFilter = filterStatus;
    this.currentSearch = searchTerm;
    this.currentPage = 1; // Reset to first page when filtering/searching
    this.loadFilteredProjects(filterStatus, searchTerm, 1);
  }

  applyFilter(filterStatus: string) {
    this.applyFilters(filterStatus, this.currentSearch);
  }

  loadFilteredProjects(filterStatus: string, searchTerm: string = '', page: number = 1) {
    this.currentPage = page;
    
    if (filterStatus === 'All status' && !searchTerm.trim()) {
      // If no filter and no search, load normal paginated data
      this.loadProjects();
      return;
    }

    // Apply client-side filtering and searching
    this.filterAndSearchProjects(filterStatus, searchTerm, page);
  }

  private filterAndSearchProjects(filterStatus: string, searchTerm: string, page: number) {
    this.isLoading = true;
    this.errorMessage = null;
    this.errorType = null;

    // Load all projects first, then filter and search client-side
    if (this.isAdmin) {
      // For admin, get all projects without pagination
      this.projectService.getAllProjects().subscribe({
        next: (allProjects: any[]) => {
          let filteredProjects = this.applyStatusFilter(allProjects, filterStatus);
          filteredProjects = this.applySearchFilter(filteredProjects, searchTerm);
          this.paginateFilteredResults(filteredProjects, page);
        },
        error: (error: any) => {
          console.error('Error loading projects for filtering:', error);
          this.handleLoadError(error);
        }
      });
    } else {
      // For regular users, get all their projects without pagination
      this.projectService.getAllProjectsAsUserProjects().subscribe({
        next: (allUserProjects: any[]) => {
          // Filter user projects where current user is a member
          const userProjects = allUserProjects.filter((up: any) => 
            up.project && up.project.users && 
            up.project.users.some((user: any) => user.id === this.currentUserId)
          );
          
          const allProjectData = userProjects.map((up: any) => up.project);
          let filteredProjects = this.applyStatusFilter(allProjectData, filterStatus);
          filteredProjects = this.applySearchFilter(filteredProjects, searchTerm);
          
          // Convert back to UserProject format
          const filteredUserProjects = filteredProjects.map((project: any) => ({
            projectId: project.projectId,
            userId: this.currentUserId || '',
            notes: project.description || '',
            joinedDate: new Date(project.startDate || Date.now()),
            project: project
          }));
          
          this.paginateFilteredUserResults(filteredUserProjects, page);
        },
        error: (error: any) => {
          console.error('Error loading user projects for filtering:', error);
          this.handleLoadError(error);
        }
      });
    }
  }

  private applyStatusFilter(projects: any[], filterStatus: string): any[] {
    if (filterStatus === 'All status') {
      return projects;
    }

    const statusMap: { [key: string]: number } = {
      'Planning': 1,
      'In Progress': 2,
      'On Hold': 3,
      'Completed': 4,
      'Cancelled': 5
    };

    const statusValue = statusMap[filterStatus];
    if (!statusValue) {
      return projects; // Return all if status not found
    }

    return projects.filter(project => project.status === statusValue);
  }

  private applySearchFilter(projects: any[], searchTerm: string): any[] {
    if (!searchTerm || !searchTerm.trim()) {
      return projects;
    }

    const searchLower = searchTerm.toLowerCase().trim();
    
    return projects.filter(project => {
      // Search in project name
      const nameMatch = project.name && project.name.toLowerCase().includes(searchLower);
      
      // Search in project description
      const descriptionMatch = project.description && project.description.toLowerCase().includes(searchLower);
      
      // Search in manager name (if exists)
      const managerMatch = project.manager && 
        ((project.manager.firstName && project.manager.firstName.toLowerCase().includes(searchLower)) ||
         (project.manager.lastName && project.manager.lastName.toLowerCase().includes(searchLower)) ||
         (project.manager.email && project.manager.email.toLowerCase().includes(searchLower)));
      
      return nameMatch || descriptionMatch || managerMatch;
    });
  }

  private paginateFilteredResults(filteredProjects: any[], page: number) {
    const totalRecords = filteredProjects.length;
    const totalPages = Math.ceil(totalRecords / this.pageSize);
    const startIndex = (page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    const paginatedProjects = filteredProjects.slice(startIndex, endIndex);

    // Convert to UserProject format for admin
    const userProjects = paginatedProjects.map((project: any) => ({
      projectId: project.projectId,
      userId: this.currentUserId || '',
      notes: project.description || '',
      joinedDate: new Date(project.startDate || Date.now()),
      project: project
    }));

    this.projects = userProjects;
    
    // Create custom pagination info for filtered results
    this.paginationInfo = {
      data: userProjects,
      totalRecords: totalRecords,
      pageNumber: page,
      pageSize: this.pageSize,
      totalPages: totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    };

    this.isLoading = false;
    this.paginationChange.emit(this.paginationInfo);
  }

  private paginateFilteredUserResults(filteredUserProjects: any[], page: number) {
    const totalRecords = filteredUserProjects.length;
    const totalPages = Math.ceil(totalRecords / this.pageSize);
    const startIndex = (page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    const paginatedProjects = filteredUserProjects.slice(startIndex, endIndex);

    this.projects = paginatedProjects;
    
    // Create custom pagination info for filtered results
    this.paginationInfo = {
      data: paginatedProjects,
      totalRecords: totalRecords,
      pageNumber: page,
      pageSize: this.pageSize,
      totalPages: totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    };

    this.isLoading = false;
    this.paginationChange.emit(this.paginationInfo);
  }
}