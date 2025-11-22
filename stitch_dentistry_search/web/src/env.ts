export type WebEnvironment = {
  apiUrl: string;
  environment: string;
};

export const loadWebEnv = (): WebEnvironment => ({
  apiUrl:
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
    process.env.VITE_API_URL ||
    'http://localhost:8000',
  environment:
    (typeof import.meta !== 'undefined' && import.meta.env?.MODE) ||
    process.env.NODE_ENV ||
    'development'
});
