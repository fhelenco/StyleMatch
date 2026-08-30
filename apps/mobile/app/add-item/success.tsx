import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/ui/Button';
import { useTheme, useThemedStyles } from '../../contexts/theme';
import type { ThemeColors } from '../../lib/theme';

export default function SuccessScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.icon}>
          <Ionicons name="checkmark-circle" size={64} color={colors.success} />
        </View>
        <Text style={styles.title}>Item Added!</Text>
        <Text style={styles.subtitle}>
          Your piece has been analyzed and saved to your wardrobe.
        </Text>
        <Button
          title="View Wardrobe"
          onPress={() => router.replace('/(tabs)/wardrobe')}
        />
        <Button
          title="Add Another"
          onPress={() => router.replace('/add-item/capture')}
          variant="secondary"
        />
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
    icon: { marginBottom: 8 },
    title: { fontSize: 28, fontWeight: '700', color: c.foreground },
    subtitle: { fontSize: 15, color: c.muted, textAlign: 'center', marginBottom: 16 },
  });
