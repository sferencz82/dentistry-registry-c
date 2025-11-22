import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './navigation/RootNavigator';
import { ThemeProvider } from './theme';

export const App = () => (
  <ThemeProvider>
    <SafeAreaProvider>
      <RootNavigator />
    </SafeAreaProvider>
  </ThemeProvider>
);

export default App;
