import { Environment } from './environment.interface';

// Staging environment (example)
export const environment: Environment = {
  production: false,
  apiUrl: 'https://your-staging-api.com/api',
  fileServerUrl: 'https://your-staging-api.com',
  appName: 'Bug Tracking System (Staging)',
  version: '1.0.0'
};
