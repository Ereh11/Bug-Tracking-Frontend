import { Environment } from './environment.interface';

// Production environment
export const environment: Environment = {
  production: true,
  apiUrl: 'https://your-deployed-api-url.com/api', // Update this with your actual API URL
  fileServerUrl: 'https://your-deployed-api-url.com', // Update this with your actual API URL
  appName: 'Bug Tracking System',
  version: '1.0.0'
};
