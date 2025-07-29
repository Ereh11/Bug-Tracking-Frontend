import { Environment } from './environment.interface';

// Production environment
export const environment: Environment = {
  production: true,
  apiUrl: 'http://system-bug-ticketing.runasp.net/api',
  fileServerUrl: 'http://system-bug-ticketing.runasp.net',
  appName: 'Bug Tracking System',
  version: '1.0.0'
};
