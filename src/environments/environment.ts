import { Environment } from './environment.interface';

// Default environment (development)
export const environment: Environment = {
  production: false,
  apiUrl: 'http://localhost:5279/api',
  fileServerUrl: 'http://localhost:5279', // Base URL for file downloads
  appName: 'Bug Tracking System',
  version: '1.0.0'
};
