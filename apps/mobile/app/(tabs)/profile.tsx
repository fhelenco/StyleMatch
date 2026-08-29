import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';
import { useWardrobeStore } from '../../stores/wardrobeStore';

function SettingsRow({
  label,
  value,
  onPress,
  danger,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>{label}</Text>
      <View style={styles.rowRight}>
        {value && <Text style={styles.rowValue}>{value}</Text>}
        {onPress && (
          <Ionicons
            name="chevron-forward"
            size={16}
            color={danger ? '#E05C5C' : '#8C8C8C'}
          />
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { user, signOut } = useAuthStore();
  const items = useWardrobeStore((s) => s.items);

  const initial = user?.email?.[0].toUpperCase() ?? '?';

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Profile</Text>

        {/* Avatar card */}
        <View style={styles.avatarCard}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarInitial}>{initial}</Text>
            </View>
            <View style={styles.editBadge}>
              <Ionicons name="pencil" size={10} color="#FFFFFF" />
            </View>
          </View>
          <Text style={styles.userName}>
            {user?.email?.split('@')[0] ?? 'User'}
          </Text>
          <Text style={styles.userSubtitle}>
            {items.length} pieces · {items.filter((i) => i.times_worn > 0).length} outfits worn
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsCard}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{items.length}</Text>
            <Text style={styles.statLabel}>Pieces</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>
              {items.filter((i) => i.times_worn > 0).length}
            </Text>
            <Text style={styles.statLabel}>Outfits</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>
              {items.reduce((acc, i) => acc + i.times_worn, 0)}
            </Text>
            <Text style={styles.statLabel}>Worn</Text>
          </View>
        </View>

        {/* My Style group */}
        <View style={styles.group}>
          <SettingsRow label="Style preferences" onPress={() => {}} />
          <View style={styles.separator} />
          <SettingsRow label="Favorite colors" onPress={() => {}} />
          <View style={styles.separator} />
          <SettingsRow label="Occasions I dress for" onPress={() => {}} />
        </View>

        {/* Account group */}
        <View style={styles.group}>
          <SettingsRow label="Edit profile" onPress={() => {}} />
          <View style={styles.separator} />
          <SettingsRow label="Privacy" onPress={() => {}} />
          <View style={styles.separator} />
          <SettingsRow label="Help & Support" onPress={() => {}} />
          <View style={styles.separator} />
          <SettingsRow label="Sign out" onPress={handleSignOut} danger />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  scroll: { padding: 16, gap: 16, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '700', color: '#1A1A1A' },

  avatarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E8E2DE',
  },
  avatarWrap: { position: 'relative', marginBottom: 4 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#C9A99A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { fontSize: 32, fontWeight: '700', color: '#FFFFFF' },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: { fontSize: 24, fontWeight: '600', color: '#1A1A1A' },
  userSubtitle: { fontSize: 13, color: '#8C8C8C' },

  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8E2DE',
  },
  stat: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 22, fontWeight: '700', color: '#1A1A1A' },
  statLabel: { fontSize: 11, color: '#8C8C8C', textTransform: 'uppercase', letterSpacing: 0.5 },
  statDivider: { width: 1, backgroundColor: '#E8E2DE', marginVertical: 4 },

  group: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8E2DE',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowLabel: { fontSize: 15, color: '#1A1A1A' },
  rowLabelDanger: { color: '#E05C5C' },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowValue: { fontSize: 14, color: '#8C8C8C' },
  separator: { height: 1, backgroundColor: '#E8E2DE', marginLeft: 16 },
});
