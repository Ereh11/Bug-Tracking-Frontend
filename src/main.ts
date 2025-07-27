import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';


bootstrapApplication(AppComponent, appConfig).catch((err) =>
  console.error(err)
);

// import { ApplicationConfig, importProvidersFrom } from '@angular/core';
// import { provideRouter } from '@angular/router';
// import { routes } from './app/app.routes';
// import { HttpClientModule } from '@angular/common/http';
// export const appConfig: ApplicationConfig = {
//   providers: [
//     provideRouter(routes),
//     importProvidersFrom(HttpClientModule),
//   ],
// };