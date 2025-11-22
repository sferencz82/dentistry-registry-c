import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useApiClient } from '../api/client';
import { Button } from '../components/shared/Button';
import { Calendar } from '../components/shared/Calendar';
import { Card } from '../components/shared/Card';
import { Screen } from '../components/shared/Screen';
import { useAppStore } from '../state/store';
import { useTheme } from '../theme';
import { formatTime } from '../utils/datetime';

export const HomeScreen = () => {
  const theme = useTheme();
  const apiClient = useApiClient();
  const { user, appointments, setUser } = useAppStore();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [connectionOk, setConnectionOk] = useState<boolean | null>(null);

  useEffect(() => {
    setUser({ id: 'patient-1', name: 'Patient Zero' });
  }, [setUser]);

  useEffect(() => {
    let mounted = true;
    apiClient
      .get<{ status: string }>('/health')
      .then((response) => mounted && setConnectionOk(response.ok))
      .catch(() => mounted && setConnectionOk(false));
    return () => {
      mounted = false;
    };
  }, [apiClient]);

  const primaryAppointment = appointments[0];

  return (
    <Screen>
      <Text style={[styles.title, { color: theme.colors.text as string }]}>Welcome back{user ? `, ${user.name}` : ''}</Text>
      <Text style={{ color: theme.colors.muted as string }}>
        {connectionOk === null
          ? 'Checking API connectivity...'
          : connectionOk
          ? 'API connected'
          : 'Unable to reach API'}
      </Text>

      {primaryAppointment && (
        <Card>
          <Text style={[styles.subtitle, { color: theme.colors.text as string }]}>Next appointment</Text>
          <Text style={{ color: theme.colors.muted as string }}>{primaryAppointment.dentist}</Text>
          <Text style={{ color: theme.colors.text as string, fontWeight: '700', marginTop: 4 }}>
            {formatTime(primaryAppointment.time)} ({primaryAppointment.status})
          </Text>
          <View style={styles.actions}>
            <Button label="Reschedule" variant="secondary" onPress={() => setSelectedDate(new Date(primaryAppointment.time))} />
            <Button label="Check in" onPress={() => {}} />
          </View>
        </Card>
      )}

      <Card>
        <Calendar selectedDate={selectedDate} onSelectDate={setSelectedDate} daysToShow={10} />
      </Card>
    </Screen>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: '700'
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600'
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12
  }
});
