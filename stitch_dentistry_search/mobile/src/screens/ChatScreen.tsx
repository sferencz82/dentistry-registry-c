import { StyleSheet, Text, View } from 'react-native';
import { Card } from '../components/shared/Card';
import { ChatThread } from '../components/shared/ChatThread';
import { Screen } from '../components/shared/Screen';
import { useTheme } from '../theme';

export const ChatScreen = () => {
  const theme = useTheme();
  return (
    <Screen>
      <Text style={[styles.title, { color: theme.colors.text as string }]}>Messages</Text>
      <Card>
        <View style={styles.badgeRow}>
          <Text style={{ fontWeight: '700', color: theme.colors.text as string }}>Care team</Text>
          <Text style={{ color: theme.colors.muted as string }}>Usually responds within 15 minutes</Text>
        </View>
        <ChatThread />
      </Card>
    </Screen>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: '700'
  },
  badgeRow: {
    marginBottom: 12,
    gap: 4
  }
});
