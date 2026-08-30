import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  FlatList,
  ActivityIndicator,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useWardrobeStore } from '../stores/wardrobeStore';
import { useSuggestOutfitsByOccasion, useSaveOutfit, OutfitSuggestion } from '../hooks/useOutfits';
import { useTheme, useThemedStyles } from '../contexts/theme';
import type { ThemeColors } from '../lib/theme';

const OCCASIONS: Array<{ label: string; value: string }> = [
  { label: 'Work', value: 'work' },
  { label: 'Party', value: 'party' },
  { label: 'Date', value: 'date-night' },
  { label: 'Beach', value: 'beach' },
  { label: 'Bar', value: 'bar' },
  { label: 'Weekend', value: 'weekend' },
  { label: 'Formal', value: 'formal' },
  { label: 'Gym', value: 'gym' },
];

const SEASONS: Array<{ label: string; value: string }> = [
  { label: 'Summer', value: 'spring-summer' },
  { label: 'Winter', value: 'fall-winter' },
  { label: 'All-Season', value: 'all-season' },
];

const ROLES = ['FOUNDATION', 'LAYER', 'BASE'] as const;

export default function OccasionMatchScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { width } = useWindowDimensions();
  const items = useWardrobeStore((s) => s.items);

  const [occasion, setOccasion] = useState<string | null>(null);
  const [season, setSeason] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [saved, setSaved] = useState(false);
  const lastIndex = useRef(0);

  const {
    mutate: generate,
    data: suggestions,
    isPending: isGenerating,
    reset: resetSuggestions,
  } = useSuggestOutfitsByOccasion();
  const { mutate: saveOutfit, isPending: isSaving } = useSaveOutfit();

  const handleGenerate = () => {
    if (!occasion) return;
    setActiveIndex(0);
    setSaved(false);
    generate({ occasion, season: season ?? undefined });
  };

  const handleReset = () => {
    resetSuggestions();
    setActiveIndex(0);
    setSaved(false);
    lastIndex.current = 0;
  };

  const handleSave = () => {
    const suggestion = suggestions?.[activeIndex];
    if (!suggestion) return;
    saveOutfit(
      {
        item_ids: suggestion.item_ids,
        occasion: suggestion.occasion,
        season: suggestion.season,
        style_vibe: suggestion.style_vibe,
        style_notes: suggestion.style_notes,
        trend_note: suggestion.trend_note,
      },
      { onSuccess: () => setSaved(true) }
    );
  };

  // Used for both onMomentumScrollEnd (native swipe gestures) and onScroll
  // (throttled) — web mouse-wheel/trackpad scrolling doesn't always fire a
  // momentum-end event, so onScroll is the fallback that keeps the dots and
  // the save target in sync there.
  const updateActiveIndex = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    if (index === lastIndex.current) return;
    lastIndex.current = index;
    setActiveIndex(index);
    setSaved(false);
  };

  const renderSuggestion = ({ item: suggestion }: { item: OutfitSuggestion }) => {
    const matchedItems = items.filter((i) => suggestion.item_ids.includes(i.id));
    return (
      <ScrollView
        style={{ width }}
        contentContainerStyle={styles.results}
        showsVerticalScrollIndicator={false}
      >
        {/* Cohesion Score */}
        <View style={styles.scoreContainer}>
          <View style={styles.scoreCircle}>
            <Text style={styles.scoreValue}>{Math.round(suggestion.cohesion_score ?? 0)}</Text>
            <Text style={styles.scorePercent}>%</Text>
          </View>
          <Text style={styles.scoreLabel}>COHESION SCORE</Text>
          <Text style={styles.vibeLabel}>{suggestion.style_vibe}</Text>
        </View>

        {/* Matched Pieces */}
        {matchedItems.slice(0, 3).map((item, index) => (
          <View key={item.id} style={styles.pieceCard}>
            <View style={styles.pieceThumb}>
              <Image source={{ uri: item.image_url }} style={styles.pieceImg} resizeMode="cover" />
            </View>
            <View style={styles.pieceInfo}>
              <Text style={styles.pieceRole}>{ROLES[index] || 'ACCENT'}</Text>
              <Text style={styles.pieceName}>{item.label}</Text>
            </View>
          </View>
        ))}

        {/* AI Citation */}
        <View style={styles.citation}>
          <Text style={styles.citationText}>"{suggestion.style_notes}"</Text>
        </View>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() =>
            suggestions
              ? handleReset()
              : router.canGoBack()
                ? router.back()
                : router.replace('/(tabs)/lookbook')
          }
          hitSlop={12}
        >
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Look</Text>
        <View style={{ width: 24 }} />
      </View>

      {!suggestions ? (
        isGenerating ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={styles.loadingText}>Creating your look...</Text>
          </View>
        ) : (
          /* Picker state */
          <ScrollView
            contentContainerStyle={styles.pickerContainer}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.pickerLabel}>OCCASION</Text>
            <Text style={styles.pickerSubtitle}>What's the vibe for this look?</Text>
            <View style={styles.chipWrap}>
              {OCCASIONS.map((o) => {
                const active = occasion === o.value;
                return (
                  <TouchableOpacity
                    key={o.value}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setOccasion(active ? null : o.value)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {o.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.pickerLabel, styles.seasonLabel]}>SEASON</Text>
            <Text style={styles.pickerSubtitle}>Optional</Text>
            <View style={styles.chipWrap}>
              {SEASONS.map((s) => {
                const active = season === s.value;
                return (
                  <TouchableOpacity
                    key={s.value}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setSeason(active ? null : s.value)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {s.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={[styles.generateBtn, !occasion && styles.generateBtnDisabled]}
              onPress={handleGenerate}
              disabled={!occasion}
              activeOpacity={0.85}
            >
              <Text style={styles.generateBtnText}>GENERATE LOOK</Text>
            </TouchableOpacity>
          </ScrollView>
        )
      ) : (
        /* Results state */
        <View style={{ flex: 1 }}>
          <FlatList
            data={suggestions}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, i) => String(i)}
            renderItem={renderSuggestion}
            onMomentumScrollEnd={updateActiveIndex}
            onScroll={updateActiveIndex}
            scrollEventThrottle={16}
          />

          {suggestions.length > 1 && (
            <View style={styles.dots}>
              {suggestions.map((_, i) => (
                <View key={i} style={[styles.dot, i === activeIndex && styles.dotActive]} />
              ))}
            </View>
          )}

          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={[styles.lookbookBtn, saved && styles.lookbookBtnSaved]}
              onPress={handleSave}
              disabled={saved || isSaving}
              activeOpacity={0.85}
            >
              {saved && <Ionicons name="checkmark" size={18} color={colors.onAccent} />}
              <Text style={styles.lookbookBtnText}>
                {isSaving ? 'ADDING…' : saved ? 'ADDED TO LOOKBOOK' : 'ADD TO LOOKBOOK'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.tryAnother} onPress={handleReset}>
              <Text style={styles.tryAnotherText}>Try a different vibe</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    headerTitle: {
      fontSize: 20,
      fontFamily: 'PlayfairDisplay_400Regular_Italic',
      color: c.foreground,
    },

    // Picker
    pickerContainer: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
    pickerLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: c.muted,
      letterSpacing: 2,
      marginBottom: 8,
    },
    seasonLabel: { marginTop: 28 },
    pickerSubtitle: {
      fontSize: 14,
      color: c.muted,
      marginBottom: 16,
    },
    chipWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    chip: {
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 20,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    chipActive: {
      backgroundColor: c.foreground,
      borderColor: c.foreground,
    },
    chipText: {
      fontSize: 13,
      fontWeight: '500',
      color: c.foreground,
    },
    chipTextActive: {
      color: c.onForeground,
    },
    generateBtn: {
      marginTop: 32,
      backgroundColor: c.accent,
      borderRadius: 8,
      paddingVertical: 16,
      alignItems: 'center',
    },
    generateBtnDisabled: {
      backgroundColor: c.border,
    },
    generateBtnText: {
      fontSize: 13,
      fontWeight: '700',
      color: c.onAccent,
      letterSpacing: 1,
    },

    // Loading
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
    },
    loadingText: {
      fontSize: 16,
      fontFamily: 'PlayfairDisplay_400Regular_Italic',
      color: c.muted,
    },

    // Results
    results: { padding: 16, paddingBottom: 24, gap: 16 },

    scoreContainer: { alignItems: 'center', gap: 8, paddingVertical: 16 },
    scoreCircle: {
      width: 120,
      height: 120,
      borderRadius: 60,
      borderWidth: 3,
      borderColor: c.accent,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    },
    scoreValue: {
      fontSize: 40,
      fontFamily: 'PlayfairDisplay_700Bold',
      color: c.accent,
    },
    scorePercent: {
      fontSize: 20,
      fontFamily: 'PlayfairDisplay_400Regular_Italic',
      color: c.accent,
      marginTop: 6,
    },
    scoreLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: c.muted,
      letterSpacing: 3,
    },
    vibeLabel: {
      fontSize: 16,
      fontFamily: 'PlayfairDisplay_400Regular_Italic',
      color: c.foreground,
      marginTop: 4,
    },

    // Piece cards
    pieceCard: {
      flexDirection: 'row',
      backgroundColor: c.surface,
      borderRadius: 12,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: c.border,
    },
    pieceThumb: {
      width: 100,
      height: 120,
      backgroundColor: c.surfaceAlt,
    },
    pieceImg: { width: '100%', height: '100%' },
    pieceInfo: {
      flex: 1,
      padding: 16,
      justifyContent: 'center',
      gap: 6,
    },
    pieceRole: {
      fontSize: 11,
      fontWeight: '600',
      color: c.accent,
      letterSpacing: 2,
    },
    pieceName: {
      fontSize: 20,
      fontFamily: 'PlayfairDisplay_700Bold',
      color: c.foreground,
    },

    // Citation
    citation: {
      backgroundColor: c.surfaceAlt,
      borderRadius: 12,
      padding: 20,
    },
    citationText: {
      fontSize: 14,
      fontFamily: 'PlayfairDisplay_400Regular_Italic',
      color: c.muted,
      lineHeight: 22,
    },

    // Dots
    dots: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
      paddingBottom: 4,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: c.border,
    },
    dotActive: {
      backgroundColor: c.accent,
      width: 18,
    },

    // Bottom bar
    bottomBar: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 16,
      gap: 8,
    },
    lookbookBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 16,
      borderRadius: 8,
      backgroundColor: c.accent,
    },
    lookbookBtnSaved: {
      backgroundColor: c.accentDark,
    },
    lookbookBtnText: {
      fontSize: 13,
      fontWeight: '700',
      color: c.onAccent,
      letterSpacing: 1,
    },

    tryAnother: { alignItems: 'center', paddingVertical: 8 },
    tryAnotherText: {
      fontSize: 14,
      color: c.accent,
      fontWeight: '500',
    },
  });
