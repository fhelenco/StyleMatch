import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/theme';

interface OccasionBadgeProps {
  occasion: string;
  season?: string;
}

export function OccasionBadge({ occasion, season }: OccasionBadgeProps) {
  const { colors } = useTheme();
  const palette: Record<string, string> = {
    casual: colors.muted,
    work: colors.success,
    'date-night': colors.accent,
    weekend: colors.warning,
    formal: colors.foreground,
    gym: '#4C9ACF',
    party: colors.danger,
    beach: '#5FB8A8',
    bar: colors.accentDark,
  };
  const color = palette[occasion] || colors.muted;
  return (
    <View style={styles.row}>
      <View style={[styles.badge, { backgroundColor: color + '22', borderColor: color }]}>
        <Text style={[styles.text, { color }]}>{occasion}</Text>
      </View>
      {season && (
        <View style={[styles.badge, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
          <Text style={[styles.text, { color: colors.muted }]}>{season}</Text>
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
