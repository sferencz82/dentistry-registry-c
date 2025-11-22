export type MobileEnvironment = {
  apiUrl: string;
  environment: string;
};

export const loadMobileEnv = (): MobileEnvironment => ({
  apiUrl: process.env.MOBILE_API_URL || 'http://localhost:8000',
  environment: process.env.MOBILE_ENV || 'development'
});
