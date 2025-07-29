import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../Core/Services/auth.service';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.css'],
})
export class WelcomeComponent implements OnInit {
  showContent = false;
  animateButton = false;

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit() {
    // Trigger animations after component loads
    setTimeout(() => {
      this.showContent = true;
    }, 500);

    setTimeout(() => {
      this.animateButton = true;
    }, 2000);
    
    // Clear any redirect URLs when welcome page loads to ensure clean state
    console.log('Welcome page loaded, clearing any stored redirect URLs');
    this.authService.getAndClearRedirectUrl();
  }

  navigateToLogin() {
    // Clear any stored redirect URLs to ensure user goes to projects page after login
    console.log('Navigating from welcome to login, clearing redirect URLs');
    this.authService.getAndClearRedirectUrl();
    this.router.navigate(['/login']);
  }
}