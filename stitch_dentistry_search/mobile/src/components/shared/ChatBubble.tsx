import { StyleSheet, Text, View } from 'react-native';
import { ChatMessage } from '../../state/store';
import { useTheme } from '../../theme';

type ChatBubbleProps = {
  message: ChatMessage;
};

export const ChatBubble = ({ message }: ChatBubbleProps) => {
  const theme = useTheme();
  const isPatient = message.sender === 'patient';

  return (
    <View
      accessibilityLabel={`chat-bubble-${message.id}`}
      style={[
        styles.container,
        {
          alignSelf: isPatient ? 'flex-end' : 'flex-start',
          backgroundColor: isPatient ? (theme.colors.primary as string) : (theme.colors.surface as string),
          borderColor: theme.colors.border as string
        }
      ]}
    >
      <Text style={{ color: isPatient ? '#fff' : (theme.colors.text as string), marginBottom: 4 }}>{message.text}</Text>
      <Text style={{ color: isPatient ? '#e2e8f0' : (theme.colors.muted as string), fontSize: 12 }}>
        {new Date(message.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    maxWidth: '80%'
  }
});
