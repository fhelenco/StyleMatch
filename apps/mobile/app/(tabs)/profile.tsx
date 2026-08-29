import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { useAuthStore } from '../../stores/authStore';
import { useWardrobeStore } from '../../stores/wardrobeStore';
import { Button } from '../../components/ui/Button';

export default function ProfileScreen() {
  const { user, signOut } = useAuthStore();
  const items = useWardrobeStore((s) => s.items);

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Profile</Text>

        <View style={styles.card}>
          <View style={styles.avatar}>
            <Text style={styles.avatarInitial}>
              {user?.email?.[0].toUpperCase() ?? '?'}
            </Text>
          </View>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{items.length}</Text>
            <Text style={styles.statLabel}>Pieces</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>
              {items.filter((i) => i.times_worn > 0).length}
            </Text>
            <Text style={styles.statLabel}>Worn</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>
              {items.length > 0
                ? Math.round(items.reduce((a, b) => a + b.times_worn, 0) / items.length)
                : 0}
            </Text>
            <Text style={styles.statLabel}>Avg. wears</Text>
          </View>
        </View>

        <Button title="Sign Out" onPress={handleSignOut} variant="secondary" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  content: { flex: 1, padding: 24, gap: 24 },
  title: { fontSize: 28, fontWeight: '700', color: '#1A1A1A' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#E8E2DE' },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#C9A99A', alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontSize: 28, fontWeight: '700', color: '#FFFFFF' },
  email: { fontSize: 15, color: '#8C8C8C' },
  stats: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#E8E2DE' },
  stat: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 24, fontWeight: '700', color: '#1A1A1A' },
  statLabel: { fontSize: 12, color: '#8C8C8C' },
  divider: { width: 1, backgroundColor: '#E8E2DE' },
});
