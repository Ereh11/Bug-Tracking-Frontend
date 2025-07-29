import { environment } from '../environments/environment';

export function logEnvironmentInfo() {
  console.log('=== Environment Configuration ===');
  console.log('Production:', environment.production);
  console.log('API URL:', environment.apiUrl);
  console.log('File Server URL:', environment.fileServerUrl);
  console.log('App Name:', environment.appName);
  console.log('Version:', environment.version);
  console.log('=================================');
}
