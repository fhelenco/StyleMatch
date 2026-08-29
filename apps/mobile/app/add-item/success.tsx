import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/ui/Button';

export default function SuccessScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.icon}>
          <Ionicons name="checkmark-circle" size={64} color="#4CAF82" />
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  icon: { marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '700', color: '#1A1A1A' },
  subtitle: { fontSize: 15, color: '#8C8C8C', textAlign: 'center', marginBottom: 16 },
});
