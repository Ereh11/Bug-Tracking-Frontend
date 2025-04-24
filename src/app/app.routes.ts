import { Routes } from '@angular/router';
import { SignUpComponent } from './components/sign-up/sign-up.component';
import { SignInComponent } from './components/sign-in/sign-in.component';

export const routes: Routes = [
  { path: '', redirectTo: 'signup', pathMatch: 'full' },
  { path: 'signup', component: SignUpComponent },
  { path: 'login', component: SignInComponent },
  { path: '**', component: SignUpComponent },
];
