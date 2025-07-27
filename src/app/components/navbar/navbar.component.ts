import { Component } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../Core/Services/auth.service';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, LucideAngularModule, HttpClientModule, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent {
  constructor(private authService: AuthService, private router: Router) {}
  get isLoggedIn(): boolean {
  const result = this.authService.isLoggedIn;
  console.log('isLoggedIn:', result); // 👈 check output
  return result;
}
  get currentUser() {
  const user = this.authService.currentUserValue;
  console.log('currentUser:', user); // 👈 check output
  return user;
}
  logout() {
    this.authService.logout();
    this.router.navigate(['/sign-in']);
  }
  navigateToProfile() {
    this.router.navigate(['/profile']);
  }
}
