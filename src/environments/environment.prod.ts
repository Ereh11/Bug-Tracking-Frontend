import { Environment } from './environment.interface';

// Production environment
export const environment: Environment = {
  production: true,
  apiUrl: 'https://system-bug-ticketing.runasp.net/api',
  fileServerUrl: 'https://system-bug-ticketing.runasp.net',
  appName: 'Bug Tracking System',
  version: '1.0.0'
};
