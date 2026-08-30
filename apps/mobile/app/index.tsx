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
import { useThemedStyles } from '../contexts/theme';
import type { ThemeColors } from '../lib/theme';

export default function SplashScreen() {
  const { session, loading } = useAuthStore();
  const router = useRouter();
  const styles = useThemedStyles(makeStyles);

  if (!loading && session) {
    return <Redirect href="/(tabs)/home" />;
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

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
      gap: 12,
    },
    wordmark: { fontSize: 28, fontWeight: '700', color: c.foreground },
    line: { width: 48, height: 1, backgroundColor: c.accent, marginVertical: 4 },
    headline: {
      fontSize: 32,
      fontWeight: '700',
      color: c.foreground,
      textAlign: 'center',
      lineHeight: 40,
    },
    subtext: {
      fontSize: 15,
      color: c.muted,
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
      backgroundColor: c.foreground,
      borderRadius: 8,
      paddingVertical: 16,
      alignItems: 'center',
    },
    ctaText: { color: c.onForeground, fontSize: 16, fontWeight: '600' },
    linkBtn: { alignItems: 'center' },
    linkText: { fontSize: 14, color: c.muted },
  });
