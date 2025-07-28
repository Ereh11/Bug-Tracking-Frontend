import { Environment } from './environment.interface';

// Production environment
export const environment: Environment = {
  production: true,
  apiUrl: 'https://your-production-api.com/api', // Replace with your production API URL
  fileServerUrl: 'https://your-production-api.com', // Replace with your production file server URL
  appName: 'Bug Tracking System',
  version: '1.0.0'
};
