import { Environment } from './environment.interface';

// Default environment (development)
export const environment: Environment = {
  production: false,
  apiUrl: 'http://system-bug-ticketing.runasp.net/api',
  fileServerUrl: 'http://system-bug-ticketing.runasp.net', // Base URL for file downloads
  appName: 'Bug Tracking System',
  version: '1.0.0'
};
