import { Routes } from '@angular/router';
import { SignUpComponent } from './components/sign-up/sign-up.component';
import { SignInComponent } from './components/sign-in/sign-in.component';
import { ProjectsComponent } from './components/projects/projects.component';

export const routes: Routes = [
  { path: '', component: ProjectsComponent },
  { path: 'signup', component: SignUpComponent },
  { path: 'login', component: SignInComponent },
  { path: '**', component: SignUpComponent },
];
