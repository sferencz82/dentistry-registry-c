import { useMemo } from 'react';
import { loadWebEnv } from './env';

export const App = () => {
  const env = useMemo(loadWebEnv, []);

  return (
    <main>
      <h1>Stitch Dentistry Web</h1>
      <p>Environment: {env.environment}</p>
      <p>API URL: {env.apiUrl}</p>
    </main>
  );
};

export default App;
