// Environment configuration interface
export interface Environment {
  production: boolean;
  apiUrl: string;
  fileServerUrl: string;
  appName: string;
  version: string;
}
