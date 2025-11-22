import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme';

type CardProps = {
  children: ReactNode;
  elevated?: boolean;
};

export const Card = ({ children, elevated = true }: CardProps) => {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: theme.colors.surface as string,
          borderColor: theme.colors.border as string,
          shadowOpacity: elevated ? 0.15 : 0
        }
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2
  }
});
