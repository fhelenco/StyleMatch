import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiRequest } from '../../lib/api';
import { ColorSwatch } from '../../components/ui/ColorSwatch';
import { useWardrobeStore } from '../../stores/wardrobeStore';
import { useQueryClient } from '@tanstack/react-query';
import { useTheme, useThemedStyles } from '../../contexts/theme';
import type { ThemeColors } from '../../lib/theme';

export default function ConfirmScreen() {
  const { colors: palette } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const params = useLocalSearchParams<{ data: string; imageUri: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const addItem = useWardrobeStore((s) => s.addItem);

  const initial = params.data ? JSON.parse(params.data) : {};
  const [label, setLabel] = useState(initial.label || '');
  const [saving, setSaving] = useState(false);

  // Prefer the AI-cut-out image returned from the analyze step; fall back to
  // the raw capture while it is still uploading.
  const heroUri = initial.image_url || params.imageUri;

  const tags: string[] =
    Array.isArray(initial.tags) && initial.tags.length
      ? initial.tags
      : [initial.category, initial.style_category, initial.fabric, initial.pattern].filter(
          Boolean,
        );

  const colors: Array<{ name: string; hex: string }> = initial.colors || [];

  const handleSave = async () => {
    if (!label.trim()) {
      Alert.alert('Name required', 'Please give this piece a name.');
      return;
    }
    setSaving(true);
    try {
      const body = {
        label: label.trim(),
        garment_type: initial.garment_type,
        category: initial.category,
        style_category: initial.style_category,
        pattern: initial.pattern,
        fabric: initial.fabric,
        season: initial.season,
        colors: initial.colors,
        image_url: initial.image_url,
        image_path: initial.image_path,
      };
      const saved = await apiRequest('/api/wardrobe', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      addItem(saved as Parameters<typeof addItem>[0]);
      queryClient.invalidateQueries({ queryKey: ['wardrobe'] });
      router.replace('/add-item/success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Save failed';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  const metaLine = [initial.category, initial.collection]
    .filter(Boolean)
    .join('  •  ')
    .toUpperCase();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero image with floating controls */}
        <View style={styles.hero}>
          {heroUri ? (
            <Image source={{ uri: heroUri }} style={styles.heroImg} resizeMode="cover" />
          ) : (
            <View style={[styles.heroImg, styles.heroPlaceholder]} />
          )}
          <TouchableOpacity
            style={[styles.circleBtn, styles.circleLeft]}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/add-item/capture'))}
            hitSlop={8}
          >
            <Ionicons name="chevron-back" size={20} color={palette.foreground} />
          </TouchableOpacity>
          <View style={[styles.circleBtn, styles.circleRight]}>
            <Ionicons name="sparkles" size={16} color={palette.accent} />
          </View>
        </View>

        <View style={styles.body}>
          {!!metaLine && <Text style={styles.meta}>{metaLine}</Text>}

          {/* Editable title styled as the headline */}
          <TextInput
            style={styles.title}
            value={label}
            onChangeText={setLabel}
            placeholder="Name this piece"
            placeholderTextColor={palette.muted}
            multiline
          />
          {!!initial.brand && <Text style={styles.brand}>by {initial.brand}</Text>}

          {/* AI intelligence tags */}
          {tags.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>AI INTELLIGENCE TAGS</Text>
              <View style={styles.tagWrap}>
                {tags.map((t, i) => (
                  <View key={`${t}-${i}`} style={styles.tag}>
                    <View style={styles.tagDot} />
                    <Text style={styles.tagText}>{cap(t)}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Detail card */}
          <View style={styles.card}>
            {!!initial.fabric_care && (
              <View style={styles.cardRow}>
                <View style={styles.cardIcon}>
                  <Ionicons name="water-outline" size={18} color={palette.accentDark} />
                </View>
                <View style={styles.cardRowText}>
                  <Text style={styles.cardRowTitle}>FABRIC CARE</Text>
                  <Text style={styles.cardRowBody}>{initial.fabric_care}</Text>
                </View>
              </View>
            )}

            {!!initial.fabric && (
              <View style={styles.cardRow}>
                <View style={styles.cardIcon}>
                  <Ionicons name="pricetag-outline" size={18} color={palette.accentDark} />
                </View>
                <View style={styles.cardRowText}>
                  <Text style={styles.cardRowTitle}>MATERIAL</Text>
                  <Text style={styles.cardRowBody}>{cap(initial.fabric)}</Text>
                </View>
              </View>
            )}

            {colors.length > 0 && (
              <View style={styles.cardRow}>
                <View style={styles.cardIcon}>
                  <ColorSwatch colors={colors} size={16} />
                </View>
                <View style={styles.cardRowText}>
                  <Text style={styles.cardRowTitle}>COLORS</Text>
                  <Text style={styles.cardRowBody}>
                    {colors.map((c) => cap(c.name)).join(', ')}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Fixed CTA */}
      <View style={styles.ctaWrap}>
        <TouchableOpacity
          style={styles.cta}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color={palette.onForeground} />
          ) : (
            <Text style={styles.ctaText}>SAVE TO WARDROBE</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function cap(s: string) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    scroll: { paddingBottom: 120 },

    hero: { position: 'relative' },
    heroImg: {
      width: '100%',
      aspectRatio: 1,
      borderBottomLeftRadius: 28,
      borderBottomRightRadius: 28,
      backgroundColor: c.surfaceAlt,
    },
    heroPlaceholder: { alignItems: 'center', justifyContent: 'center' },
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
      padding: 0,
    },
    brand: {
      fontSize: 14,
      fontFamily: 'PlayfairDisplay_400Regular_Italic',
      color: c.accentDark,
      marginTop: 2,
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
    cardIcon: {
      width: 26,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    cardRowText: { flex: 1, gap: 4 },
    cardRowTitle: {
      fontSize: 11,
      fontWeight: '700',
      color: c.foreground,
      letterSpacing: 1,
    },
    cardRowBody: {
      fontSize: 14,
      color: c.muted,
      lineHeight: 21,
    },

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
