import { loadSharedEnv } from './env';

test('loads shared env defaults', () => {
  const env = loadSharedEnv();
  expect(env.modelVersion).toBe('v0');
  expect(env.schemaVersion).toBe('v1');
});
