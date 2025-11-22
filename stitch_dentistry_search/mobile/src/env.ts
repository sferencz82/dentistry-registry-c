export type MobileEnvironment = {
  apiUrl: string;
  environment: string;
};

export type MobileStage = 'development' | 'staging' | 'production';

const DEFAULT_API_URLS: Record<MobileStage, string> = {
  development: 'http://localhost:8000',
  staging: 'https://staging.api.stitchdentistry.com',
  production: 'https://api.stitchdentistry.com'
};

export const resolveApiUrl = (environment: MobileStage, override?: string): string => {
  if (override) return override;
  return DEFAULT_API_URLS[environment] ?? DEFAULT_API_URLS.development;
};

export const loadMobileEnv = (): MobileEnvironment => {
  const environment = (process.env.MOBILE_ENV as MobileStage | undefined) ?? 'development';
  const apiUrl = resolveApiUrl(environment, process.env.MOBILE_API_URL);

  return {
    apiUrl,
    environment
  };
};
