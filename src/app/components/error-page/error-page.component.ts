import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { environment } from '../../../environments/environment';
import { HealthCheckService } from '../../Core/Services/health-check.service';

@Component({
  selector: 'app-error-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './error-page.component.html',
  styleUrl: './error-page.component.css'
})
export class ErrorPageComponent implements OnInit {
  errorType: string = 'general';
  errorMessage: string = 'An unexpected error occurred';
  retryCount: number = 0;
  maxRetries: number = 3;
  isRetrying: boolean = false;
  environment = environment; // Make environment available in template
  currentTimestamp: string = new Date().toISOString();
  currentUrl: string = '';

  constructor(
    public router: Router, // Make router public
    private route: ActivatedRoute,
    private healthCheckService: HealthCheckService
  ) {
    this.currentUrl = this.router.url;
  }

  ngOnInit() {
    // Update timestamp and URL when component initializes
    this.currentTimestamp = new Date().toISOString();
    this.currentUrl = this.router.url;
    
    // Get error details from navigation state or route data
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      this.errorType = navigation.extras.state['errorType'] || 'general';
      this.errorMessage = navigation.extras.state['errorMessage'] || 'An unexpected error occurred';
    } else {
      // Fallback to route data for wildcard routes
      this.route.data.subscribe(data => {
        this.errorType = data['errorType'] || 'general';
        this.errorMessage = data['errorMessage'] || 'An unexpected error occurred';
      });
    }
  }

  getErrorTitle(): string {
    switch (this.errorType) {
      case 'server-down':
        return 'Server Connection Failed';
      case 'network':
        return 'Network Error';
      case 'authentication':
        return 'Authentication Error';
      case 'permission':
        return 'Access Denied';
      case 'not-found':
        return 'Page Not Found';
      default:
        return 'Something Went Wrong';
    }
  }

  getErrorIcon(): string {
    switch (this.errorType) {
      case 'server-down':
        return 'fa-server';
      case 'network':
        return 'fa-wifi';
      case 'authentication':
        return 'fa-lock';
      case 'permission':
        return 'fa-ban';
      case 'not-found':
        return 'fa-search';
      default:
        return 'fa-exclamation-triangle';
    }
  }

  getErrorDescription(): string {
    switch (this.errorType) {
      case 'server-down':
        return 'Unable to connect to the server. The service might be temporarily unavailable.';
      case 'network':
        return 'Please check your internet connection and try again.';
      case 'authentication':
        return 'Your session has expired. Please sign in again.';
      case 'permission':
        return 'You don\'t have permission to access this resource.';
      case 'not-found':
        return 'The page you\'re looking for doesn\'t exist or has been moved.';
      default:
        return 'An unexpected error occurred. Please try again or contact support if the problem persists.';
    }
  }

  async retryConnection() {
    if (this.retryCount >= this.maxRetries) {
      return;
    }

    this.isRetrying = true;
    this.retryCount++;

    try {
      // Use the health check service
      const isHealthy = await this.healthCheckService.ping();

      if (isHealthy) {
        // Server is back online, redirect to home
        this.router.navigate(['/']);
      } else {
        throw new Error('Server still unavailable');
      }
    } catch (error) {
      console.log('Retry failed:', error);
      // Wait before allowing another retry
      setTimeout(() => {
        this.isRetrying = false;
      }, 2000);
    }
  }

  goHome() {
    this.router.navigate(['/']);
  }

  goBack() {
    window.history.back();
  }

  refreshPage() {
    window.location.reload();
  }

  contactSupport() {
    // Implement contact support functionality
    window.open('mailto:support@bugtracking.com?subject=Error%20Report&body=' + 
      encodeURIComponent(`Error Type: ${this.errorType}\nError Message: ${this.errorMessage}\nTimestamp: ${new Date().toISOString()}`));
  }
}
