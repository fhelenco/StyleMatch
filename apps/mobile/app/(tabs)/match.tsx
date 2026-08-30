import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useThemedStyles } from '../../contexts/theme';
import type { ThemeColors } from '../../lib/theme';

export default function MatchTab() {
  const router = useRouter();
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.container}>
      <Text style={styles.sparkle}>✦</Text>
      <Text style={styles.label}>AI STYLIST</Text>
      <Text style={styles.title}>Stitch a Look</Text>
      <Text style={styles.subtitle}>
        Select a piece from your wardrobe and let AI build a cohesive outfit.
      </Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push('/matching')}
        activeOpacity={0.85}
      >
        <Text style={styles.buttonText}>START MATCHING</Text>
      </TouchableOpacity>
    </View>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 40,
      gap: 14,
    },
    sparkle: { fontSize: 28, color: c.accent },
    label: {
      fontSize: 11,
      fontWeight: '600',
      color: c.muted,
      letterSpacing: 3,
    },
    title: {
      fontSize: 32,
      fontFamily: 'PlayfairDisplay_700Bold',
      color: c.foreground,
    },
    subtitle: {
      fontSize: 14,
      color: c.muted,
      textAlign: 'center',
      lineHeight: 22,
      maxWidth: 260,
    },
    button: {
      backgroundColor: c.accent,
      paddingHorizontal: 28,
      paddingVertical: 14,
      borderRadius: 24,
      marginTop: 12,
    },
    buttonText: {
      fontSize: 12,
      fontWeight: '700',
      color: c.onAccent,
      letterSpacing: 2,
    },
  });
