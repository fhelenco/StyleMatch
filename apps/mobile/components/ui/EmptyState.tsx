import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '../../contexts/theme';
import type { ThemeColors } from '../../lib/theme';

interface EmptyStateProps {
  subtitle: string;
  description: string;
  ctaLabel: string;
  onCta: () => void;
}

export function EmptyState({ subtitle, description, ctaLabel, onCta }: EmptyStateProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.container}>
      <Ionicons name="diamond-outline" size={48} color={colors.border} />
      <Text style={styles.label}>THE VAULT</Text>
      <Text style={styles.headline}>A blank canvas</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      <Text style={styles.description}>{description}</Text>
      <TouchableOpacity style={styles.cta} onPress={onCta} activeOpacity={0.8}>
        <Ionicons name="add" size={20} color={colors.foreground} />
        <Text style={styles.ctaText}>{ctaLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 40,
      gap: 8,
    },
    label: {
      fontSize: 11,
      fontWeight: '600',
      color: c.muted,
      letterSpacing: 3,
      marginTop: 12,
    },
    headline: {
      fontSize: 28,
      fontFamily: 'PlayfairDisplay_700Bold',
      color: c.foreground,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 16,
      fontFamily: 'PlayfairDisplay_400Regular_Italic',
      color: c.accentText,
      textAlign: 'center',
    },
    description: {
      fontSize: 14,
      color: c.muted,
      textAlign: 'center',
      lineHeight: 20,
      marginTop: 4,
    },
    cta: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: c.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 24,
      gap: 4,
    },
    ctaText: {
      fontSize: 10,
      fontWeight: '700',
      color: c.foreground,
      letterSpacing: 1,
      textAlign: 'center',
    },
  });
