import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';
import {
  LucideAngularModule,
  Bug,
  LogOut,
  Plus,
  Check,
  Trash,
} from 'lucide-angular';
import { importProvidersFrom } from '@angular/core';

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(withFetch()),
    provideRouter(routes),
    provideAnimations(),
    importProvidersFrom(
      LucideAngularModule.pick({ Bug, LogOut, Plus, Check, Trash })
    ),
  ],
}).catch((err) => console.error(err));
