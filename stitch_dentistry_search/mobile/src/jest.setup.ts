import '@testing-library/jest-native/extend-expect';
import React from 'react';

jest.mock('react-native-gesture-handler', () => {
  const actual = jest.requireActual('react-native-gesture-handler/jestSetup');
  return actual;
});

jest.mock('react-native-safe-area-context', () => {
  const actual = jest.requireActual('react-native-safe-area-context');
  return {
    ...actual,
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
    SafeAreaView: ({ children }: { children: React.ReactNode }) => children
  };
});

jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper', () => ({
  default: { startOperationBatch: jest.fn(), finishOperationBatch: jest.fn() }
}));
