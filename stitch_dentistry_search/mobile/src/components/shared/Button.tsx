import { Pressable, StyleSheet, Text } from 'react-native';
import { useTheme } from '../../theme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

type ButtonProps = {
  label: string;
  variant?: ButtonVariant;
  onPress: () => void;
  disabled?: boolean;
};

export const Button = ({ label, onPress, variant = 'primary', disabled }: ButtonProps) => {
  const theme = useTheme();

  const backgroundColor = {
    primary: theme.colors.primary,
    secondary: theme.colors.secondary,
    ghost: 'transparent'
  }[variant];

  const textColor = variant === 'ghost' ? theme.colors.text : '#fff';

  return (
    <Pressable
      accessibilityLabel={`${label}-button`}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: disabled ? theme.colors.muted : (backgroundColor as string),
          opacity: pressed ? 0.85 : 1
        }
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.label, { color: textColor as string }]}>{label}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center'
  },
  label: {
    fontWeight: '600'
  }
});
