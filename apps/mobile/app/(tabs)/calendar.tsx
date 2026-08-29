import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../lib/api';

interface CalendarEntry {
  id: string;
  worn_date: string;
  outfit_id?: string;
  notes?: string;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function CalendarScreen() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const queryClient = useQueryClient();

  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
  const { data: entries = [] } = useQuery<CalendarEntry[]>({
    queryKey: ['calendar', monthStr],
    queryFn: () => apiRequest<CalendarEntry[]>(`/api/calendar?month=${monthStr}`),
  });

  const { mutate: removeEntry } = useMutation({
    mutationFn: (date: string) =>
      apiRequest(`/api/calendar/${date}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['calendar', monthStr] }),
  });

  const entryByDate = Object.fromEntries(entries.map((e) => [e.worn_date, e]));

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  const handleDayPress = (day: number) => {
    const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const entry = entryByDate[date];
    if (entry) {
      Alert.alert(date, 'Remove this log?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeEntry(date) },
      ]);
    }
  };

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Calendar</Text>

        <View style={styles.nav}>
          <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
            <Text style={styles.navArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.monthLabel}>{MONTHS[month]} {year}</Text>
          <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
            <Text style={styles.navArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.weekRow}>
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
            <Text key={d} style={styles.weekDay}>{d}</Text>
          ))}
        </View>

        <View style={styles.grid}>
          {cells.map((day, i) => {
            if (!day) return <View key={`empty-${i}`} style={styles.cell} />;
            const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const logged = !!entryByDate[date];
            const isToday =
              day === today.getDate() &&
              month === today.getMonth() &&
              year === today.getFullYear();

            return (
              <TouchableOpacity
                key={date}
                onPress={() => handleDayPress(day)}
                style={[
                  styles.cell,
                  logged && styles.cellLogged,
                  isToday && styles.cellToday,
                ]}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.dayText,
                  logged && styles.dayTextLogged,
                  isToday && styles.dayTextToday,
                ]}>
                  {day}
                </Text>
                {logged && <View style={styles.dot} />}
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.hint}>Tap a logged day to remove it. Log outfits from the Outfits tab.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  scroll: { padding: 16, gap: 16 },
  title: { fontSize: 28, fontWeight: '700', color: '#1A1A1A' },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navBtn: { padding: 8 },
  navArrow: { fontSize: 28, color: '#C9A99A', fontWeight: '300' },
  monthLabel: { fontSize: 18, fontWeight: '600', color: '#1A1A1A' },
  weekRow: { flexDirection: 'row', justifyContent: 'space-around' },
  weekDay: { fontSize: 12, color: '#8C8C8C', fontWeight: '600', width: 40, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  cell: {
    width: '13%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E2DE',
    gap: 2,
  },
  cellLogged: { backgroundColor: '#F5F0ED', borderColor: '#C9A99A' },
  cellToday: { borderColor: '#C9A99A', borderWidth: 2 },
  dayText: { fontSize: 13, color: '#1A1A1A', fontWeight: '400' },
  dayTextLogged: { color: '#A07B6F', fontWeight: '600' },
  dayTextToday: { color: '#C9A99A', fontWeight: '700' },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#C9A99A' },
  hint: { fontSize: 12, color: '#8C8C8C', textAlign: 'center', paddingBottom: 40 },
});
