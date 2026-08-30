import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../stores/authStore';
import { useWardrobeStore } from '../../stores/wardrobeStore';
import { useProfileStore } from '../../stores/profileStore';
import { useSavedOutfits } from '../../hooks/useOutfits';
import { useProfile, useUpdateProfile, useUploadAvatar, useRemoveAvatar } from '../../hooks/useProfile';
import { computeStyleDna } from '../../lib/styleDna';
import { AestheticDnaCard } from '../../components/profile/AestheticDnaCard';
import { PromptDialog } from '../../components/ui/PromptDialog';
import { useTheme, useThemedStyles } from '../../contexts/theme';
import type { ThemeColors } from '../../lib/theme';
import type { ThemeMode } from '../../lib/theme';

const THEME_OPTIONS = ['System', 'Light', 'Dark'] as const;
const toMode = (label: string) => label.toLowerCase() as ThemeMode;
const modeLabel = (value: ThemeMode) => value.charAt(0).toUpperCase() + value.slice(1);

function displayName(email?: string): string {
  const handle = email?.split('@')[0] ?? 'User';
  return handle
    .split(/[._-]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ');
}

export default function ProfileScreen() {
  const { colors, mode, setMode } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const { user, signOut } = useAuthStore();
  const items = useWardrobeStore((s) => s.items);
  const { avatarUri } = useProfileStore();
  const { data: outfits } = useSavedOutfits();
  const { data: profile } = useProfile();
  const { mutate: updateProfile, isPending: savingUsername } = useUpdateProfile();
  const { mutate: uploadAvatar, isPending: uploadingAvatar } = useUploadAvatar();
  const { mutate: removeAvatar } = useRemoveAvatar();
  const [notifications, setNotifications] = useState(false);
  const [saving, setSaving] = useState(false);
  const [usernameDialogVisible, setUsernameDialogVisible] = useState(false);

  const cardRef = useRef<View>(null);
  const [permission, requestPermission] = MediaLibrary.usePermissions({ writeOnly: true });

  const resolvedName = profile?.username?.trim() || displayName(user?.email);
  const initial = resolvedName?.[0]?.toUpperCase() ?? '?';
  const outfitCount = outfits?.length ?? 0;
  const dna = useMemo(() => computeStyleDna(items), [items]);

  const SettingsRow = ({
    label,
    value,
    onPress,
    danger,
  }: {
    label: string;
    value?: string;
    onPress?: () => void;
    danger?: boolean;
  }) => (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
      <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>{label}</Text>
      <View style={styles.rowRight}>
        {value && <Text style={styles.rowValue}>{value}</Text>}
        {onPress && (
          <Ionicons
            name="chevron-forward"
            size={16}
            color={danger ? colors.danger : colors.muted}
          />
        )}
      </View>
    </TouchableOpacity>
  );

  const SegmentedControl = ({
    options,
    selected,
    onSelect,
  }: {
    options: string[];
    selected: string;
    onSelect: (val: string) => void;
  }) => (
    <View style={styles.segmented}>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt}
          style={[styles.segment, selected === opt && styles.segmentActive]}
          onPress={() => onSelect(opt)}
          activeOpacity={0.8}
        >
          <Text style={[styles.segmentText, selected === opt && styles.segmentTextActive]}>
            {opt}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const handleSaveCard = async () => {
    if (saving) return;
    setSaving(true);
    try {
      let granted = permission?.granted ?? false;
      if (!granted) {
        const res = await requestPermission();
        granted = res.granted;
      }
      if (!granted) {
        Alert.alert(
          'Photo access needed',
          'Allow photo access so StyleMatch can save your Aesthetic DNA card.',
        );
        return;
      }

      const uri = await captureRef(cardRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert('Saved', 'Your Aesthetic DNA card is in your Photos.');
    } catch (e) {
      Alert.alert('Could not save', 'Something went wrong capturing your style card.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangeAvatar = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        'Photo access needed',
        'Allow photo access so StyleMatch can set your profile picture.',
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      uploadAvatar(result.assets[0].uri, {
        onError: () => Alert.alert('Upload failed', "Couldn't save your profile picture. Try again."),
      });
    }
  };

  const handleAvatarPress = () => {
    if (uploadingAvatar) return;
    if (!avatarUri) {
      handleChangeAvatar();
      return;
    }
    Alert.alert('Profile photo', undefined, [
      { text: 'Change photo', onPress: handleChangeAvatar },
      { text: 'Remove photo', style: 'destructive', onPress: () => removeAvatar() },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSaveUsername = (value: string) => {
    updateProfile(
      { username: value },
      {
        onSuccess: () => setUsernameDialogVisible(false),
        onError: () => Alert.alert('Could not save', "Couldn't update your username. Try again."),
      }
    );
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.avatarRing}
            onPress={handleAvatarPress}
            activeOpacity={0.8}
          >
            <View style={styles.avatar}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarInitial}>{initial}</Text>
              )}
              {uploadingAvatar && (
                <View style={styles.avatarLoading}>
                  <ActivityIndicator color={colors.onImage} />
                </View>
              )}
            </View>
            <View style={styles.avatarBadge}>
              <Ionicons name="camera" size={12} color={colors.onForeground} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.nameRow}
            onPress={() => setUsernameDialogVisible(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.userName}>{resolvedName}</Text>
            <Ionicons name="pencil" size={13} color={colors.muted} />
          </TouchableOpacity>
          <Text style={styles.curatedStyle}>
            CURATED STYLE: {dna.curatedStyle.toUpperCase()}
          </Text>
        </View>

        <View style={styles.divider} />

        {/* Aesthetic DNA */}
        <AestheticDnaCard ref={cardRef} dna={dna} onSave={handleSaveCard} saving={saving} />

        {/* Stats */}
        <View style={styles.statsCard}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{items.length}</Text>
            <Text style={styles.statLabel}>Pieces</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{outfitCount}</Text>
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

        {/* Preferences */}
        <Text style={styles.sectionHeader}>PREFERENCES</Text>
        <View style={styles.group}>
          <SettingsRow
            label="Language"
            value={(profile?.preferred_language || 'pt-BR').toUpperCase()}
            onPress={() => {}}
          />
          <View style={styles.separator} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Theme</Text>
            <SegmentedControl
              options={[...THEME_OPTIONS]}
              selected={modeLabel(mode)}
              onSelect={(label) => setMode(toMode(label))}
            />
          </View>
          <View style={styles.separator} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Notifications</Text>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor={colors.surface}
            />
          </View>
        </View>

        {/* Account group */}
        <Text style={styles.sectionHeader}>ACCOUNT</Text>
        <View style={styles.group}>
          <SettingsRow label="Edit profile" onPress={() => setUsernameDialogVisible(true)} />
          <View style={styles.separator} />
          <SettingsRow label="Privacy" onPress={() => {}} />
          <View style={styles.separator} />
          <SettingsRow label="Help & Support" onPress={() => {}} />
          <View style={styles.separator} />
          <SettingsRow label="Sign out" onPress={handleSignOut} danger />
        </View>
      </ScrollView>

      <PromptDialog
        visible={usernameDialogVisible}
        title="Edit name"
        message="This is how you'll appear across StyleMatch."
        placeholder="Your name"
        initialValue={profile?.username ?? resolvedName}
        maxLength={50}
        saving={savingUsername}
        onCancel={() => setUsernameDialogVisible(false)}
        onConfirm={handleSaveUsername}
      />
    </SafeAreaView>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    scroll: { padding: 16, gap: 12, paddingBottom: 40 },

    header: {
      alignItems: 'center',
      gap: 6,
      paddingTop: 12,
      paddingBottom: 4,
    },
    avatarRing: {
      width: 84,
      height: 84,
      borderRadius: 42,
      borderWidth: 1,
      borderColor: c.border,
      padding: 4,
      marginBottom: 8,
    },
    avatar: {
      flex: 1,
      borderRadius: 40,
      backgroundColor: c.accent,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      position: 'relative',
    },
    avatarImage: { width: '100%', height: '100%' },
    avatarLoading: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: c.overlay,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarInitial: { fontSize: 28, fontWeight: '700', color: c.onAccent },
    avatarBadge: {
      position: 'absolute',
      right: 2,
      bottom: 2,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: c.foreground,
      borderWidth: 2,
      borderColor: c.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    userName: {
      fontSize: 26,
      fontFamily: 'PlayfairDisplay_700Bold',
      color: c.foreground,
    },
    curatedStyle: {
      fontSize: 10,
      fontWeight: '600',
      letterSpacing: 2,
      color: c.muted,
    },
    divider: {
      height: 1,
      backgroundColor: c.border,
      marginVertical: 4,
    },

    statsCard: {
      flexDirection: 'row',
      backgroundColor: c.surface,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: c.border,
    },
    stat: { flex: 1, alignItems: 'center', gap: 4 },
    statValue: { fontSize: 22, fontWeight: '700', color: c.foreground },
    statLabel: { fontSize: 11, color: c.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
    statDivider: { width: 1, backgroundColor: c.border, marginVertical: 4 },

    sectionHeader: {
      fontSize: 11,
      fontWeight: '600',
      color: c.muted,
      letterSpacing: 2,
      marginTop: 8,
      marginLeft: 4,
    },

    group: {
      backgroundColor: c.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.border,
      overflow: 'hidden',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    rowLabel: { fontSize: 15, color: c.foreground },
    rowLabelDanger: { color: c.danger },
    rowRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    rowValue: { fontSize: 14, color: c.muted },
    separator: { height: 1, backgroundColor: c.border, marginLeft: 16 },

    segmented: {
      flexDirection: 'row',
      backgroundColor: c.surfaceAlt,
      borderRadius: 8,
      padding: 2,
    },
    segment: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 6,
    },
    segmentActive: {
      backgroundColor: c.surface,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    segmentText: {
      fontSize: 13,
      color: c.muted,
      fontWeight: '500',
    },
    segmentTextActive: {
      color: c.foreground,
    },
  });
