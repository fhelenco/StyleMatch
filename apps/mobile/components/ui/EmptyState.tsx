import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface EmptyStateProps {
  subtitle: string;
  description: string;
  ctaLabel: string;
  onCta: () => void;
}

export function EmptyState({ subtitle, description, ctaLabel, onCta }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Ionicons name="diamond-outline" size={48} color="#E8E2DE" />
      <Text style={styles.label}>THE VAULT</Text>
      <Text style={styles.headline}>A blank canvas</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      <Text style={styles.description}>{description}</Text>
      <TouchableOpacity style={styles.cta} onPress={onCta} activeOpacity={0.8}>
        <Ionicons name="add" size={20} color="#1A1A1A" />
        <Text style={styles.ctaText}>{ctaLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
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
    color: '#8C8C8C',
    letterSpacing: 3,
    marginTop: 12,
  },
  headline: {
    fontSize: 28,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'PlayfairDisplay_400Regular_Italic',
    color: '#C9A99A',
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#8C8C8C',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 4,
  },
  cta: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F5F0ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    gap: 4,
  },
  ctaText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: 1,
    textAlign: 'center',
  },
});
