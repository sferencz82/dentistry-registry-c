export type SharedEnvironment = {
  modelVersion: string;
  schemaVersion: string;
};

export const loadSharedEnv = (): SharedEnvironment => ({
  modelVersion: process.env.MODEL_VERSION || 'v0',
  schemaVersion: process.env.SCHEMA_VERSION || 'v1'
});
