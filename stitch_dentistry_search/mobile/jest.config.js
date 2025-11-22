/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { isolatedModules: true }]
  },
  moduleNameMapper: {
    '^react-native$': 'react-native-web'
  },
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect']
};
