import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ColorSwatch } from '../../components/ui/ColorSwatch';
import { ActionSheet } from '../../components/ui/ActionSheet';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useWardrobeStore, ClothingItem } from '../../stores/wardrobeStore';
import { useClothingItem, useDeleteItem, useUpdateItem } from '../../hooks/useWardrobe';
import { pickFromGallery, uriToFormData } from '../../lib/imageUtils';
import { apiUpload } from '../../lib/api';
import { useTheme, useThemedStyles } from '../../contexts/theme';
import type { ThemeColors } from '../../lib/theme';

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const storeItem = useWardrobeStore((s) => s.items.find((i) => i.id === id));
  const { data: fetched, isLoading } = useClothingItem(storeItem ? '' : id!);
  const item = (storeItem || fetched) as ClothingItem | undefined;

  const { mutate: deleteItem } = useDeleteItem();
  const { mutateAsync: updateItem } = useUpdateItem();

  const [menuVisible, setMenuVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  // Set when "Replace photo" is tapped; the picker is launched only after the
  // action sheet has fully closed (ActionSheet.onDismissed) — presenting it
  // while that modal is still up is a silent no-op on iOS.
  const [pendingReplace, setPendingReplace] = useState(false);

  const runReplacePhoto = async () => {
    if (!item) return;
    const uri = await pickFromGallery();
    if (!uri) return;
    setBusy(true);
    try {
      // Re-run analyze to get a fresh background-removed image, then swap it in.
      const formData = await uriToFormData(uri);
      const result = await apiUpload<{ image_url: string; image_path: string }>(
        '/api/wardrobe/analyze',
        formData,
      );
      await updateItem({
        id: item.id,
        updates: { image_url: result.image_url, image_path: result.image_path },
      });
    } catch (err) {
      Alert.alert(
        'Could not replace photo',
        err instanceof Error ? err.message : 'Something went wrong. Try again.',
      );
    } finally {
      setBusy(false);
    }
  };

  // Launch the picker only once the action sheet has fully closed —
  // ActionSheet.onDismissed is the primary trigger; this is a fallback for
  // when Modal.onDismiss doesn't fire.
  useEffect(() => {
    if (menuVisible || !pendingReplace) return;
    const id = setTimeout(() => {
      setPendingReplace(false);
      runReplacePhoto();
    }, 450);
    return () => clearTimeout(id);
  }, [menuVisible, pendingReplace]);

  const handleDelete = () => {
    setConfirmVisible(false);
    if (!item) return;
    deleteItem(item.id, {
      onSuccess: () => (router.canGoBack() ? router.back() : router.replace('/wardrobe')),
    });
  };

  if (!item) {
    return (
      <View style={[styles.container, styles.center]}>
        {isLoading ? (
          <ActivityIndicator size="large" color={colors.accent} />
        ) : (
          <>
            <Text style={styles.notFound}>Piece not found.</Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.backLink}>Go back</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  }

  const tags = buildTags(item);
  const care = fabricCare(item.fabric);
  const metaLine = [item.category, collectionLabel(item.season)]
    .filter(Boolean)
    .join('  •  ')
    .toUpperCase();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <Image source={{ uri: item.image_url }} style={styles.heroImg} resizeMode="cover" />
          <TouchableOpacity
            style={[styles.circleBtn, styles.circleLeft]}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/wardrobe'))}
            hitSlop={8}
          >
            <Ionicons name="chevron-back" size={20} color={colors.foreground} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.circleBtn, styles.circleRight]}
            onPress={() => setMenuVisible(true)}
            hitSlop={8}
          >
            <Ionicons name="ellipsis-horizontal" size={18} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          {!!metaLine && <Text style={styles.meta}>{metaLine}</Text>}
          <Text style={styles.title}>{item.label}</Text>

          {tags.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>AI INTELLIGENCE TAGS</Text>
              <View style={styles.tagWrap}>
                {tags.map((t, i) => (
                  <View key={`${t}-${i}`} style={styles.tag}>
                    <View style={styles.tagDot} />
                    <Text style={styles.tagText}>{t}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Detail card */}
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <View style={styles.cardIcon}>
                <Ionicons name="water-outline" size={18} color={colors.accentDark} />
              </View>
              <View style={styles.cardRowText}>
                <Text style={styles.cardRowTitle}>FABRIC CARE</Text>
                <Text style={styles.cardRowBody}>{care}</Text>
              </View>
            </View>

            {item.colors?.length > 0 && (
              <View style={styles.cardRow}>
                <View style={styles.cardIcon}>
                  <ColorSwatch colors={item.colors} size={16} />
                </View>
                <View style={styles.cardRowText}>
                  <Text style={styles.cardRowTitle}>COLORS</Text>
                  <Text style={styles.cardRowBody}>
                    {item.colors.map((c) => cap(c.name)).join(', ')}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.cardRow}>
              <View style={styles.cardIcon}>
                <Ionicons name="time-outline" size={18} color={colors.accentDark} />
              </View>
              <View style={styles.cardRowText}>
                <Text style={styles.cardRowTitle}>LAST WORN</Text>
                <Text style={styles.cardRowBody}>{lastWornText(item)}</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Fixed CTA */}
      <View style={styles.ctaWrap}>
        <TouchableOpacity
          style={styles.cta}
          onPress={() => router.push({ pathname: '/matching', params: { anchor: item.id } })}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaText}>CREATE OUTFIT</Text>
        </TouchableOpacity>
      </View>

      {/* Options menu */}
      <ActionSheet
        visible={menuVisible}
        title="Manage piece"
        onClose={() => setMenuVisible(false)}
        onDismissed={() => {
          if (pendingReplace) {
            setPendingReplace(false);
            runReplacePhoto();
          }
        }}
        options={[
          {
            label: 'Replace photo',
            icon: 'camera-outline',
            onPress: () => {
              setPendingReplace(true);
              setMenuVisible(false);
            },
          },
          {
            label: 'Delete item',
            icon: 'trash-outline',
            destructive: true,
            onPress: () => {
              setMenuVisible(false);
              setConfirmVisible(true);
            },
          },
        ]}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        visible={confirmVisible}
        title="Delete item"
        message={`Remove "${item.label}" from your wardrobe? This can't be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
        onCancel={() => setConfirmVisible(false)}
        onConfirm={handleDelete}
      />

      {/* Busy overlay while replacing the photo */}
      {busy && (
        <View style={styles.busyOverlay}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.busyText}>Updating photo…</Text>
        </View>
      )}
    </View>
  );
}

/* ---------- derivation helpers ---------- */

function cap(s?: string) {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function buildTags(item: ClothingItem): string[] {
  const seen = new Set<string>();
  const push = (v?: string) => {
    const c = cap(v);
    if (c && !seen.has(c.toLowerCase())) seen.add(c.toLowerCase());
  };
  push(item.category);
  push(item.style_category);
  push(item.fabric);
  (item.colors || []).forEach((c) => push(c.name));
  if (item.pattern && item.pattern !== 'solid') push(item.pattern);
  push(seasonTag(item.season));
  return Array.from(seen)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .slice(0, 8);
}

function seasonTag(season?: string) {
  switch (season) {
    case 'spring-summer':
      return 'Spring/Summer';
    case 'fall-winter':
      return 'Fall/Winter';
    case 'all-season':
      return 'All-Season';
    default:
      return undefined;
  }
}

function collectionLabel(season?: string) {
  switch (season) {
    case 'spring-summer':
      return 'Spring Collection';
    case 'fall-winter':
      return 'Fall Collection';
    case 'all-season':
      return 'Core Collection';
    default:
      return 'Signature Collection';
  }
}

function fabricCare(fabric?: string): string {
  const f = (fabric || '').toLowerCase();
  const map: Array<[string[], string]> = [
    [['linen'], 'Machine wash cold on a delicate cycle. Do not bleach. Air dry only to preserve shape and texture.'],
    [['denim', 'jean'], 'Machine wash cold inside out. Tumble dry low. Avoid bleach to preserve the wash.'],
    [['cotton'], 'Machine wash warm with like colors. Tumble dry low. Warm iron if needed.'],
    [['wool', 'cashmere', 'knit'], 'Hand wash cold or dry clean. Lay flat to dry. Do not wring or tumble dry.'],
    [['silk', 'satin'], 'Hand wash cold or dry clean. Do not tumble dry. Iron on low, inside out.'],
    [['leather', 'suede'], 'Wipe clean with a soft, dry cloth. Condition periodically. Keep away from direct heat and water.'],
    [['polyester', 'nylon', 'synthetic'], 'Machine wash warm. Tumble dry low. Iron on low heat only if necessary.'],
  ];
  for (const [keys, text] of map) {
    if (keys.some((k) => f.includes(k))) {
      return `100% ${cap(fabric)}. ${text}`;
    }
  }
  return 'Follow the garment care label. Wash cold and air dry to keep the fabric looking its best.';
}

function lastWornText(item: ClothingItem): string {
  if (item.last_worn_at) {
    const d = new Date(item.last_worn_at);
    const formatted = d.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
    return item.times_worn > 0
      ? `${formatted} · worn ${item.times_worn}×`
      : formatted;
  }
  return 'Not worn yet — style it into a look to start tracking.';
}

/* ---------- styles ---------- */

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    center: { alignItems: 'center', justifyContent: 'center', gap: 12 },
    busyOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: c.background,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 14,
    },
    busyText: { fontSize: 15, color: c.muted },
    notFound: { fontSize: 16, color: c.muted },
    backLink: { fontSize: 14, color: c.accent, fontWeight: '600' },

    scroll: { paddingBottom: 120 },

    hero: { position: 'relative' },
    heroImg: {
      width: '100%',
      aspectRatio: 3 / 4,
      borderBottomLeftRadius: 28,
      borderBottomRightRadius: 28,
      backgroundColor: c.surfaceAlt,
    },
    circleBtn: {
      position: 'absolute',
      top: 52,
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: c.surface,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.12,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 3,
    },
    circleLeft: { left: 16 },
    circleRight: { right: 16 },

    body: { paddingHorizontal: 24, paddingTop: 24 },
    meta: {
      fontSize: 11,
      fontWeight: '600',
      color: c.muted,
      letterSpacing: 2,
      marginBottom: 8,
    },
    title: {
      fontSize: 34,
      lineHeight: 42,
      fontFamily: 'PlayfairDisplay_700Bold',
      color: c.foreground,
    },

    sectionLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: c.muted,
      letterSpacing: 2,
      marginTop: 28,
      marginBottom: 14,
    },
    tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    tag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    tagDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: c.accent },
    tagText: { fontSize: 13, color: c.foreground, fontWeight: '500' },

    card: {
      backgroundColor: c.surfaceAlt,
      borderRadius: 20,
      padding: 20,
      marginTop: 28,
      gap: 20,
    },
    cardRow: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
    cardIcon: { width: 26, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
    cardRowText: { flex: 1, gap: 4 },
    cardRowTitle: { fontSize: 11, fontWeight: '700', color: c.foreground, letterSpacing: 1 },
    cardRowBody: { fontSize: 14, color: c.muted, lineHeight: 21 },

    ctaWrap: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: 24,
      paddingTop: 12,
      paddingBottom: 32,
      backgroundColor: c.background,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    cta: {
      backgroundColor: c.foreground,
      borderRadius: 30,
      height: 58,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ctaText: { color: c.onForeground, fontSize: 13, fontWeight: '700', letterSpacing: 2 },
  });
