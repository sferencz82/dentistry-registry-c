import { loadMobileEnv, resolveApiUrl } from './env';

describe('environment', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('resolves default urls by environment', () => {
    expect(resolveApiUrl('development')).toContain('localhost');
    expect(resolveApiUrl('staging')).toContain('staging');
    expect(resolveApiUrl('production')).toContain('api.');
  });

  it('allows override via MOBILE_API_URL', () => {
    process.env.MOBILE_API_URL = 'https://override.local';
    const env = loadMobileEnv();
    expect(env.apiUrl).toBe('https://override.local');
  });
});
