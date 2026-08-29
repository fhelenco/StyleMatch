import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const COLORS: Record<string, string> = {
  casual: '#8C8C8C',
  work: '#4CAF82',
  'date-night': '#C9A99A',
  weekend: '#E8A838',
  formal: '#1A1A1A',
  gym: '#4C9ACF',
};

interface OccasionBadgeProps {
  occasion: string;
  season?: string;
}

export function OccasionBadge({ occasion, season }: OccasionBadgeProps) {
  const color = COLORS[occasion] || '#8C8C8C';
  return (
    <View style={styles.row}>
      <View style={[styles.badge, { backgroundColor: color + '22', borderColor: color }]}>
        <Text style={[styles.text, { color }]}>{occasion}</Text>
      </View>
      {season && (
        <View style={[styles.badge, { backgroundColor: '#F5F0ED', borderColor: '#E8E2DE' }]}>
          <Text style={[styles.text, { color: '#8C8C8C' }]}>{season}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  text: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
});
