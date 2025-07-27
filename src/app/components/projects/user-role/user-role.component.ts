import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../Core/Services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-role',
  imports: [CommonModule],
  templateUrl: './user-role.component.html',
  styleUrl: './user-role.component.css'
})
export class UserRoleComponent implements OnInit {
  userName: string = '';
  userRole: string = '';
  isLoading: boolean = true;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    // Check if user is logged in
    if (this.authService.isLoggedIn) {
      const currentUserProfile = this.authService.getCurrentUserResponse();
      
      if (currentUserProfile) {
        this.userName = this.getUserName(currentUserProfile);
        this.userRole = this.getUserRole(currentUserProfile);
      }
    }
    
    this.isLoading = false;
  }

  private getUserName(user: any): string {
    // Prioritize firstName + lastName combination
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    
    // Use fullName if available
    if (user.fullName) {
      return user.fullName;
    }
    
    // Use just firstName if lastName is not available
    if (user.firstName) {
      return user.firstName;
    }
    
    // Fallback to email only if no name fields are available
    if (user.email) {
      return user.email;
    }
    
    return 'Unknown User';
  }

  private getUserRole(user: any): string {
    // Check if user has roles array and extract all roles
    if (user.roles && Array.isArray(user.roles) && user.roles.length > 0) {
      // Clean and capitalize all roles
      const cleanRoles: string[] = user.roles.map((role: string) => {
        const cleanRole = role.trim();
        return cleanRole.charAt(0).toUpperCase() + cleanRole.slice(1).toLowerCase();
      });
      
      // Remove duplicates
      const uniqueRoles: string[] = [...new Set(cleanRoles)];
      
      // If user has multiple roles, combine them
      if (uniqueRoles.length > 1) {
        // Sort roles by priority (Admin first, then others alphabetically)
        const sortedRoles = uniqueRoles.sort((a: string, b: string) => {
          if (a.toLowerCase().includes('admin')) return -1;
          if (b.toLowerCase().includes('admin')) return 1;
          if (a.toLowerCase().includes('manager')) return -1;
          if (b.toLowerCase().includes('manager')) return 1;
          return a.localeCompare(b);
        });
        
        // Join with " & " for readability
        return sortedRoles.join(' & ');
      }
      
      // Single role - return it
      return uniqueRoles[0];
    }
    
    // Fallback to other role fields
    if (user.role) {
      return user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase();
    }
    
    if (user.userRole) {
      return user.userRole.charAt(0).toUpperCase() + user.userRole.slice(1).toLowerCase();
    }
    
    if (user.type) {
      return user.type.charAt(0).toUpperCase() + user.type.slice(1).toLowerCase();
    }
    
    return 'Member';
  }
}