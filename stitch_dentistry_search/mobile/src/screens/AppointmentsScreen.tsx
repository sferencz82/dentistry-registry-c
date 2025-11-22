import { StyleSheet, Text, View } from 'react-native';
import { Card } from '../components/shared/Card';
import { Screen } from '../components/shared/Screen';
import { useAppStore } from '../state/store';
import { useTheme } from '../theme';
import { formatDateTime } from '../utils/datetime';

export const AppointmentsScreen = () => {
  const { appointments } = useAppStore();
  const theme = useTheme();

  return (
    <Screen>
      <Text style={[styles.title, { color: theme.colors.text as string }]}>Appointments</Text>
      {appointments.map((appointment) => (
        <Card key={appointment.id}>
          <View style={styles.row}>
            <View>
              <Text style={styles.dentist}>{appointment.dentist}</Text>
              <Text style={{ color: theme.colors.muted as string }}>{formatDateTime(appointment.time)}</Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: theme.colors.secondary as string }]}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>{appointment.status}</Text>
            </View>
          </View>
        </Card>
      ))}
    </Screen>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: '700'
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  dentist: {
    fontSize: 16,
    fontWeight: '700'
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999
  }
});
