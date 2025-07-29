import { Environment } from './environment.interface';

// Staging environment (example)
export const environment: Environment = {
  production: false,
  apiUrl: 'http://system-bug-ticketing.runasp.net/api',
  fileServerUrl: 'http://system-bug-ticketing.runasp.net',
  appName: 'Bug Tracking System (Staging)',
  version: '1.0.0'
};
