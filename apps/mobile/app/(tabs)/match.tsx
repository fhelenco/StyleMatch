import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function MatchTab() {
  const router = useRouter();

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
        onPress={() => router.push('/match')}
        activeOpacity={0.85}
      >
        <Text style={styles.buttonText}>START MATCHING</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 14,
  },
  sparkle: { fontSize: 28, color: '#C9A99A' },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8C8C8C',
    letterSpacing: 3,
  },
  title: {
    fontSize: 32,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: '#1A1A1A',
  },
  subtitle: {
    fontSize: 14,
    color: '#8C8C8C',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 260,
  },
  button: {
    backgroundColor: '#C9A99A',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 24,
    marginTop: 12,
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
});
