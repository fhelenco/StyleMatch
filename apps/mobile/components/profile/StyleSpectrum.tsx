import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemedStyles } from '../../contexts/theme';
import type { ThemeColors } from '../../lib/theme';

interface Props {
  leftLabel: string;
  rightLabel: string;
  /** 0..1 — position of the marker from left to right */
  value: number;
}

/** Read-only spectrum readout (the position is derived from the wardrobe). */
export function StyleSpectrum({ leftLabel, rightLabel, value }: Props) {
  const styles = useThemedStyles(makeStyles);
  const clamped = Math.max(0, Math.min(1, value));
  return (
    <View style={styles.wrap}>
      <View style={styles.labels}>
        <Text style={styles.label}>{leftLabel}</Text>
        <Text style={styles.label}>{rightLabel}</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.knob, { left: `${clamped * 100}%` }]} />
      </View>
    </View>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    wrap: { gap: 8 },
    labels: { flexDirection: 'row', justifyContent: 'space-between' },
    label: {
      fontSize: 10,
      fontWeight: '600',
      letterSpacing: 1,
      color: c.muted,
    },
    track: {
      height: 2,
      backgroundColor: c.border,
      borderRadius: 1,
      justifyContent: 'center',
    },
    knob: {
      position: 'absolute',
      width: 12,
      height: 12,
      borderRadius: 6,
      marginLeft: -6,
      backgroundColor: c.accent,
      borderWidth: 2,
      borderColor: c.surface,
    },
  });
