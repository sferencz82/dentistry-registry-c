import { StyleSheet, Text, View } from 'react-native';
import { Card } from '../components/shared/Card';
import { Screen } from '../components/shared/Screen';
import { loadMobileEnv } from '../env';
import { useTheme } from '../theme';

export const SettingsScreen = () => {
  const theme = useTheme();
  const env = loadMobileEnv();

  return (
    <Screen>
      <Text style={[styles.title, { color: theme.colors.text as string }]}>Settings</Text>
      <Card>
        <Text style={styles.sectionLabel}>Environment</Text>
        <View style={styles.row}>
          <Text style={{ color: theme.colors.muted as string }}>Mode</Text>
          <Text style={{ color: theme.colors.text as string }}>{env.environment}</Text>
        </View>
        <View style={styles.row}>
          <Text style={{ color: theme.colors.muted as string }}>API base URL</Text>
          <Text style={{ color: theme.colors.text as string }}>{env.apiUrl}</Text>
        </View>
      </Card>
    </Screen>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: '700'
  },
  sectionLabel: {
    fontWeight: '700',
    marginBottom: 8
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6
  }
});
