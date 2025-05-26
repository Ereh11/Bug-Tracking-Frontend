import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';

@Component({
  selector: 'app-root',
  standalone: true, // Add this to mark as standalone
  imports: [RouterOutlet, NavbarComponent], // Remove HttpClientModule
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'], // Corrected from styleUrl to styleUrls
})
export class AppComponent {}
