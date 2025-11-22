import { useMemo } from 'react';
import { View, Text } from 'react-native';
import { loadMobileEnv } from './env';

export const App = () => {
  const env = useMemo(loadMobileEnv, []);

  return (
    <View>
      <Text accessibilityLabel="title">Stitch Dentistry Mobile</Text>
      <Text accessibilityLabel="environment">Environment: {env.environment}</Text>
      <Text accessibilityLabel="api-url">API URL: {env.apiUrl}</Text>
    </View>
  );
};

export default App;
