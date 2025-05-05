import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';
import { LucideAngularModule, Bug, LogOut } from 'lucide-angular';
import { importProvidersFrom } from '@angular/core';
//mport { Bug } from 'lucide-angular/icons';

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(withFetch()),
    provideRouter(routes),
    provideAnimations(),
    importProvidersFrom(LucideAngularModule.pick({ Bug, LogOut })),
  ],
}).catch((err) => console.error(err));
