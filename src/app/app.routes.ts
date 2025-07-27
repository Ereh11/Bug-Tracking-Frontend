import { Routes } from '@angular/router';
import { SignUpComponent } from './components/sign-up/sign-up.component';
import { SignInComponent } from './components/sign-in/sign-in.component';
import { ProjectsComponent } from './components/projects/projects.component';
import { ProjectDetailsComponent } from './components/project-details/project-details.component';
import { WelcomeComponent } from './components/welcome/welcome.component';

export const routes: Routes = [
  { path: '', component: ProjectsComponent },
  { path: 'signup', component: SignUpComponent },
  { path: 'login', component: SignInComponent },
  { path: 'welcome', component: WelcomeComponent },
  { path: 'details', component: ProjectDetailsComponent },
  { path: 'details/:id', component: ProjectDetailsComponent },
  { path: '**', component: SignUpComponent },
];