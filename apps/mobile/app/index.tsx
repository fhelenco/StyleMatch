import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../stores/authStore';
import { Redirect } from 'expo-router';

export default function SplashScreen() {
  const { session, loading } = useAuthStore();
  const router = useRouter();

  if (!loading && session) {
    return <Redirect href="/(tabs)/wardrobe" />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.center}>
        <Text style={styles.wordmark}>StyleMatch</Text>
        <View style={styles.line} />
        <Text style={styles.headline}>Your wardrobe, reimagined.</Text>
        <Text style={styles.subtext}>
          AI-powered outfit combinations tailored to your style.
        </Text>
      </View>

      <View style={styles.bottom}>
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => router.push('/(auth)/login')}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaText}>Get Started</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.linkBtn}
          onPress={() => router.push('/(auth)/login')}
          activeOpacity={0.7}
        >
          <Text style={styles.linkText}>I already have an account</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  wordmark: { fontSize: 28, fontWeight: '700', color: '#1A1A1A' },
  line: { width: 48, height: 1, backgroundColor: '#C9A99A', marginVertical: 4 },
  headline: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    lineHeight: 40,
  },
  subtext: {
    fontSize: 15,
    color: '#8C8C8C',
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 22,
    marginTop: 4,
  },
  bottom: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 16,
  },
  ctaButton: {
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  linkBtn: { alignItems: 'center' },
  linkText: { fontSize: 14, color: '#8C8C8C' },
});
