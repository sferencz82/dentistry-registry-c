import { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme';

type CalendarProps = {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  daysToShow?: number;
};

const formatDate = (date: Date) => date.toISOString().split('T')[0];

export const Calendar = ({ selectedDate, onSelectDate, daysToShow = 7 }: CalendarProps) => {
  const theme = useTheme();

  const days = useMemo(() => {
    const today = new Date();
    return Array.from({ length: daysToShow }).map((_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() + index);
      return date;
    });
  }, [daysToShow]);

  return (
    <View>
      <Text style={[styles.heading, { color: theme.colors.text as string }]}>Upcoming availability</Text>
      <FlatList
        data={days}
        horizontal
        keyExtractor={(item) => formatDate(item)}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => {
          const isSelected = formatDate(item) === formatDate(selectedDate);

          return (
            <Pressable
              accessibilityLabel={`calendar-day-${formatDate(item)}`}
              onPress={() => onSelectDate(item)}
              style={[
                styles.day,
                {
                  backgroundColor: isSelected
                    ? (theme.colors.primary as string)
                    : (theme.colors.surface as string),
                  borderColor: theme.colors.border as string
                }
              ]}
            >
              <Text style={{ color: isSelected ? '#fff' : (theme.colors.text as string), fontWeight: '700' }}>
                {item.toLocaleDateString(undefined, { weekday: 'short' })}
              </Text>
              <Text style={{ color: isSelected ? '#e2e8f0' : (theme.colors.muted as string) }}>
                {item.getDate()}
              </Text>
            </Pressable>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  heading: {
    fontWeight: '700',
    marginBottom: 8
  },
  day: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 8,
    width: 96
  }
});
