import { useState } from 'react';
import { FlatList, StyleSheet, TextInput, View } from 'react-native';
import { useAppStore } from '../../state/store';
import { useTheme } from '../../theme';
import { Button } from './Button';
import { ChatBubble } from './ChatBubble';

export const ChatThread = () => {
  const { messages, addMessage } = useAppStore();
  const theme = useTheme();
  const [draft, setDraft] = useState('');

  const sendMessage = () => {
    if (!draft.trim()) return;
    addMessage({
      id: `draft-${Date.now()}`,
      text: draft.trim(),
      sender: 'patient',
      timestamp: new Date().toISOString()
    });
    setDraft('');
  };

  return (
    <View style={styles.container}>
      <FlatList
        contentContainerStyle={{ padding: 8 }}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ChatBubble message={item} />}
      />
      <View style={[styles.composer, { borderColor: theme.colors.border as string }]}>
        <TextInput
          accessibilityLabel="chat-input"
          style={[styles.input, { color: theme.colors.text as string }]}
          placeholder="Type a message"
          placeholderTextColor={theme.colors.muted as string}
          value={draft}
          onChangeText={setDraft}
        />
        <Button label="Send" variant="secondary" onPress={sendMessage} disabled={!draft.trim()} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  composer: {
    flexDirection: 'row',
    gap: 8,
    padding: 8,
    borderTopWidth: 1,
    alignItems: 'center'
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 10
  }
});
