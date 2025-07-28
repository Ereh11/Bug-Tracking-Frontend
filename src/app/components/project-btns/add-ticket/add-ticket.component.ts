import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProjectDetailsService, Bug, BugComment, AddCommentRequest } from '../../../Core/Services/project-details.service';
import { AuthService } from '../../../Core/Services/auth.service';

@Component({
  selector: 'app-add-ticket',
  imports: [CommonModule, FormsModule],
  templateUrl: './add-ticket.component.html',
  styleUrl: './add-ticket.component.css',
})
export class AddTicketComponent implements OnInit {
  @Input() bug: Bug | null = null;
  
  showCommentPopup = false;
  newComment = '';
  comments: BugComment[] = [];
  isLoading = false;
  isAddingComment = false;
  errorMessage = '';
  currentUserId = '';

  constructor(
    private projectDetailsService: ProjectDetailsService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.getCurrentUserId();
  }

  getCurrentUserId(): void {
    // Get current user ID from auth service
    this.currentUserId = this.authService.getCurrentUserId() || '';
  }

  toggleCommentPopup(): void {
    if (!this.bug) return;
    
    this.showCommentPopup = !this.showCommentPopup;
    this.errorMessage = '';
    
    if (this.showCommentPopup) {
      this.loadComments();
    }
  }

  loadComments(): void {
    if (!this.bug) return;
    
    this.isLoading = true;
    this.errorMessage = '';
    
    this.projectDetailsService.getBugComments(this.bug.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.comments = response.data;
          console.log('Comments loaded successfully:', this.comments.length, 'comments');
        } else {
          this.errorMessage = response.message || 'Failed to load comments';
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load comments:', error);
        this.errorMessage = error.message || 'Failed to load comments';
        this.isLoading = false;
      }
    });
  }

  addComment(): void {
    if (!this.newComment.trim() || !this.bug || !this.currentUserId) return;

    this.isAddingComment = true;
    this.errorMessage = '';

    const commentData: AddCommentRequest = {
      bugid: this.bug.id,
      userid: this.currentUserId,
      Text: this.newComment.trim(),
      textDate: new Date().toISOString() // Full datetime instead of just date
    };

    this.projectDetailsService.addBugComment(commentData).subscribe({
      next: (response) => {
        if (response.success) {
          console.log('Comment added successfully:', response.message);
          this.newComment = '';
          // Reload comments to show the new one
          this.loadComments();
        } else {
          this.errorMessage = response.message || 'Failed to add comment';
        }
        this.isAddingComment = false;
      },
      error: (error) => {
        console.error('Failed to add comment:', error);
        this.errorMessage = error.message || 'Failed to add comment';
        this.isAddingComment = false;
      }
    });
  }

  formatCommentDate(dateString: string): string {
    try {
      // Handle different date formats that might come from backend
      if (!dateString || dateString === null || dateString === undefined || dateString.trim() === '') {
        return 'Just now'; // Better default than "Unknown date"
      }

      // Handle case where backend might send "null" as string
      if (dateString === 'null' || dateString === 'undefined') {
        return 'Just now';
      }

      // Clean up the date string and try different parsing approaches
      let date: Date;
      
      // If it's just a date (YYYY-MM-DD), treat it as current date for display
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        // Add time to make it a full datetime
        date = new Date(dateString + 'T12:00:00');
      } else {
        // Try parsing as-is (should work for ISO datetime)
        date = new Date(dateString);
      }

      // Check if the date is valid
      if (isNaN(date.getTime())) {
        // Try one more approach - maybe it's a timestamp
        const timestamp = parseInt(dateString);
        if (!isNaN(timestamp)) {
          date = new Date(timestamp);
          if (isNaN(date.getTime())) {
            return 'Just now'; // Final fallback
          }
        } else {
          return 'Just now'; // Final fallback
        }
      }

      const now = new Date();
      const diffInMs = now.getTime() - date.getTime();
      const diffInHours = diffInMs / (1000 * 60 * 60);
      const diffInDays = diffInHours / 24;

      // If it's today, show time
      if (diffInDays < 1 && date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        });
      }
      // If it's yesterday
      else if (diffInDays < 2 && diffInDays >= 1) {
        return 'Yesterday at ' + date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        });
      }
      // If it's within a week, show day and time
      else if (diffInDays < 7) {
        return date.toLocaleDateString('en-US', { weekday: 'short' }) + ' at ' + 
               date.toLocaleTimeString('en-US', { 
                 hour: '2-digit', 
                 minute: '2-digit',
                 hour12: true 
               });
      }
      // For older dates, show full date and time
      else {
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        }) + ' at ' + date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        });
      }
    } catch (error) {
      console.error('Error formatting date:', error, 'Original string:', dateString);
      return 'Just now'; // Clear fallback
    }
  }
}
