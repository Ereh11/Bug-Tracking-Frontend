import { Routes } from '@angular/router';
import { SignUpComponent } from './components/sign-up/sign-up.component';
import { SignInComponent } from './components/sign-in/sign-in.component';
import { ProjectsComponent } from './components/projects/projects.component';
import { ProjectDetailsComponent } from './components/project-details/project-details.component';
import { WelcomeComponent } from './components/welcome/welcome.component';
import { ErrorPageComponent } from './components/error-page/error-page.component';
import { AuthGuard } from './Core/Guards/auth.guard';
import { PublicGuard } from './Core/Guards/public.guard';

export const routes: Routes = [
  // Public routes (accessible only when not authenticated)
  { 
    path: 'signup', 
    component: SignUpComponent,
    canActivate: [PublicGuard]
  },
  { 
    path: 'login', 
    component: SignInComponent,
    canActivate: [PublicGuard]
  },
  
  // Protected routes (require authentication)
  { 
    path: '', 
    component: ProjectsComponent,
    canActivate: [AuthGuard]
  },
  // Welcome page (accessible after successful registration, before login)
  { 
    path: 'welcome', 
    component: WelcomeComponent
  },
  { 
    path: 'details', 
    component: ProjectDetailsComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'details/:id', 
    component: ProjectDetailsComponent,
    canActivate: [AuthGuard]
  },
  
  // Error and fallback routes
  { path: 'error', component: ErrorPageComponent },
  { 
    path: '**', 
    component: ErrorPageComponent,
    data: { errorType: 'not-found', errorMessage: 'The page you are looking for does not exist.' }
  },
];