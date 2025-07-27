import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

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

  constructor(private router: Router) {}

  ngOnInit() {
    // Trigger animations after component loads
    setTimeout(() => {
      this.showContent = true;
    }, 500);

    setTimeout(() => {
      this.animateButton = true;
    }, 2000);
  }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }
}