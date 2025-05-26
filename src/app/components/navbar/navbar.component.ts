import { Component } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, LucideAngularModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent {}
