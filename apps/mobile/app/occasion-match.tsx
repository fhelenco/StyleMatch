import React, { useEffect, useRef, useState } from 'react';
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
  Alert,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useWardrobeStore, ClothingItem } from '../stores/wardrobeStore';
import {
  useSuggestOutfitsByOccasion,
  useSaveOutfit,
  useSwapPiece,
  useRescoreOutfit,
  OutfitSuggestion,
} from '../hooks/useOutfits';
import { AddPieceSheet } from '../components/outfits/AddPieceSheet';
import { needsBaseLayer } from '../lib/outfitLayering';
import { useTheme, useThemedStyles } from '../contexts/theme';
import type { ThemeColors } from '../lib/theme';

const OCCASIONS: Array<{ label: string; value: string }> = [
  { label: 'Casual', value: 'casual' },
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
  { label: 'Spring', value: 'spring' },
  { label: 'Summer', value: 'summer' },
  { label: 'Fall', value: 'fall' },
  { label: 'Winter', value: 'winter' },
  { label: 'All-Season', value: 'all-season' },
];

const CATEGORY_ROLE: Record<string, string> = {
  shoes: 'FOUNDATION',
  bottoms: 'BASE',
  tops: 'LAYER',
  outerwear: 'OUTER LAYER',
  accessories: 'ACCENT',
};

export default function OccasionMatchScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { width } = useWindowDimensions();
  const items = useWardrobeStore((s) => s.items);
  const { season: seasonParam, occasion: occasionParam, auto } = useLocalSearchParams<{
    season?: string;
    occasion?: string;
    auto?: string;
  }>();

  const [step, setStep] = useState<'vibe' | 'base'>('vibe');
  const [occasion, setOccasion] = useState<string | null>(occasionParam ?? null);
  const [season, setSeason] = useState<string | null>(seasonParam ?? null);
  const [anchorId, setAnchorId] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [saved, setSaved] = useState(false);
  const lastIndex = useRef(0);

  // Editable copy of the generated suggestions — piece swaps mutate this
  // in place so the rest of a look (and its position in the carousel)
  // survives without re-generating everything.
  const [displaySuggestions, setDisplaySuggestions] = useState<OutfitSuggestion[] | null>(null);
  // Items returned by a swap aren't always guaranteed to already be in the
  // wardrobe store's current snapshot, so keep them here and prefer this
  // over the store when rendering a matched piece.
  const [swappedItemsById, setSwappedItemsById] = useState<Record<string, ClothingItem>>({});
  const [swappingItemId, setSwappingItemId] = useState<string | null>(null);
  // Add-a-piece: index of the look the picker is open for, and which look is
  // being re-scored after an add.
  const [addPickerIndex, setAddPickerIndex] = useState<number | null>(null);
  const [rescoringIndex, setRescoringIndex] = useState<number | null>(null);

  const {
    mutate: generate,
    data: suggestions,
    isPending: isGenerating,
    isError: isGenerateError,
    reset: resetSuggestions,
  } = useSuggestOutfitsByOccasion();
  const { mutate: saveOutfit, isPending: isSaving } = useSaveOutfit();
  const { mutate: swapPiece } = useSwapPiece();
  const { mutate: rescore } = useRescoreOutfit();

  useEffect(() => {
    setDisplaySuggestions(suggestions ?? null);
  }, [suggestions]);

  const handleGenerate = () => {
    if (!occasion) return;
    setActiveIndex(0);
    setSaved(false);
    generate({ occasion, season: season ?? undefined, anchor_item_id: anchorId ?? undefined });
  };

  // Coming from the weather card on Home — occasion + season are already
  // decided, so skip the picker and generate immediately instead of making
  // the user re-confirm a chip they didn't ask to see.
  useEffect(() => {
    if (auto === '1' && occasionParam) {
      setActiveIndex(0);
      setSaved(false);
      generate({ occasion: occasionParam, season: seasonParam ?? undefined });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleReset = () => {
    resetSuggestions();
    setStep('vibe');
    setActiveIndex(0);
    setSaved(false);
    setSwappedItemsById({});
    setAddPickerIndex(null);
    setRescoringIndex(null);
    lastIndex.current = 0;
  };

  // Change the currently-viewed look's piece list, then ask the AI to re-score
  // the new set. Shared by add and remove.
  const applyPieceChange = (index: number, nextIds: string[]) => {
    const suggestion = displaySuggestions?.[index];
    if (!suggestion) return;
    setDisplaySuggestions((prev) => {
      if (!prev) return prev;
      const next = [...prev];
      next[index] = { ...next[index], item_ids: nextIds };
      return next;
    });
    setSaved(false);
    setRescoringIndex(index);
    rescore(
      { item_ids: nextIds, occasion: suggestion.occasion, season: suggestion.season },
      {
        onSuccess: (r) =>
          setDisplaySuggestions((prev) => {
            if (!prev) return prev;
            const next = [...prev];
            next[index] = {
              ...next[index],
              cohesion_score: r.cohesion_score,
              style_notes: r.style_notes,
            };
            return next;
          }),
        onError: () =>
          Alert.alert(
            'Updated, but not re-scored',
            'Your change is applied — we just couldn’t refresh the cohesion score.',
          ),
        onSettled: () => setRescoringIndex(null),
      },
    );
  };

  const handleAddPiece = (index: number, newItem: ClothingItem) => {
    setAddPickerIndex(null);
    const suggestion = displaySuggestions?.[index];
    if (!suggestion || rescoringIndex !== null || suggestion.item_ids.includes(newItem.id)) return;
    applyPieceChange(index, [...suggestion.item_ids, newItem.id]);
  };

  const handleRemovePiece = (index: number, itemId: string) => {
    const suggestion = displaySuggestions?.[index];
    if (!suggestion || rescoringIndex !== null) return;
    const nextIds = suggestion.item_ids.filter((id) => id !== itemId);
    if (nextIds.length < 2) {
      Alert.alert('Keep at least two pieces', 'A look needs at least two pieces to hang together.');
      return;
    }
    applyPieceChange(index, nextIds);
  };

  const handleBack = () => {
    if (suggestions) {
      handleReset();
      return;
    }
    if (step === 'base') {
      setStep('vibe');
      return;
    }
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/lookbook');
  };

  const handleSave = () => {
    const suggestion = displaySuggestions?.[activeIndex];
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

  // Swap one piece in the currently-viewed look — the AI picks a
  // replacement from the same category that best fits everything staying.
  const handleSwapPiece = (index: number, item: ClothingItem) => {
    const suggestion = displaySuggestions?.[index];
    if (!suggestion || swappingItemId) return;

    const keepIds = suggestion.item_ids.filter((id) => id !== item.id);
    setSwappingItemId(item.id);
    swapPiece(
      {
        keep_item_ids: keepIds,
        exclude_item_id: item.id,
        category: item.category,
        occasion: suggestion.occasion,
        season: suggestion.season,
      },
      {
        onSuccess: (result) => {
          setSwappedItemsById((prev) => ({ ...prev, [result.item.id]: result.item as ClothingItem }));
          setDisplaySuggestions((prev) => {
            if (!prev) return prev;
            const next = [...prev];
            const updated = { ...next[index] };
            updated.item_ids = updated.item_ids.map((id) => (id === item.id ? result.item.id : id));
            updated.cohesion_score = result.cohesion_score;
            updated.style_notes = result.style_notes;
            next[index] = updated;
            return next;
          });
          setSaved(false);
        },
        onError: () =>
          Alert.alert('Could not swap', "Couldn't find a fitting replacement for that piece."),
        onSettled: () => setSwappingItemId(null),
      }
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

  const renderSuggestion = ({ item: suggestion, index }: { item: OutfitSuggestion; index: number }) => {
    // Keep the stylist's ordering (shoes → bottom → top → layers) and show
    // every piece — capping at 3 was silently hiding the bottoms. A swapped
    // piece is looked up from swappedItemsById first since the wardrobe
    // store snapshot may not reflect it yet.
    const matchedItems = suggestion.item_ids
      .map((id) => swappedItemsById[id] ?? items.find((i) => i.id === id))
      .filter((i): i is ClothingItem => !!i);
    const rescoring = rescoringIndex === index;
    const showLayerHint = needsBaseLayer(matchedItems) && !rescoring;
    return (
      <ScrollView
        style={{ width }}
        contentContainerStyle={styles.results}
        showsVerticalScrollIndicator={false}
      >
        {/* Cohesion Score */}
        <View style={styles.scoreContainer}>
          <View style={styles.scoreCircle}>
            {rescoring ? (
              <ActivityIndicator color={colors.accent} />
            ) : (
              <>
                <Text style={styles.scoreValue}>{Math.round(suggestion.cohesion_score ?? 0)}</Text>
                <Text style={styles.scorePercent}>%</Text>
              </>
            )}
          </View>
          <Text style={styles.scoreLabel}>COHESION SCORE</Text>
          <Text style={styles.vibeLabel}>{suggestion.style_vibe}</Text>
        </View>

        {/* Matched Pieces */}
        {matchedItems.map((item) => {
          const swappingThis = swappingItemId === item.id;
          return (
            <View key={item.id} style={styles.pieceCard}>
              <View style={styles.pieceThumb}>
                <Image source={{ uri: item.image_url }} style={styles.pieceImg} resizeMode="cover" />
                {matchedItems.length > 2 && (
                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => handleRemovePiece(index, item.id)}
                    disabled={rescoring || !!swappingItemId}
                    hitSlop={8}
                  >
                    <Ionicons name="close" size={14} color="#FFFFFF" />
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.pieceInfo}>
                <Text style={styles.pieceRole}>{CATEGORY_ROLE[item.category] ?? 'PIECE'}</Text>
                <Text style={styles.pieceName}>{item.label}</Text>
              </View>
              <TouchableOpacity
                style={styles.swapBtn}
                onPress={() => handleSwapPiece(index, item)}
                disabled={!!swappingItemId || rescoring}
                activeOpacity={0.7}
                hitSlop={8}
              >
                {swappingThis ? (
                  <ActivityIndicator size="small" color={colors.accent} />
                ) : (
                  <Ionicons name="swap-horizontal" size={18} color={colors.accent} />
                )}
              </TouchableOpacity>
            </View>
          );
        })}

        {/* Add a piece */}
        {showLayerHint && (
          <Text style={styles.layerHint}>Add another piece to complete the look.</Text>
        )}
        <TouchableOpacity
          style={[styles.addPieceBtn, showLayerHint && styles.addPieceBtnHinted]}
          onPress={() => setAddPickerIndex(index)}
          disabled={rescoring}
          activeOpacity={0.8}
        >
          <Ionicons
            name="add"
            size={18}
            color={showLayerHint ? colors.onAccent : colors.accent}
          />
          <Text style={[styles.addPieceText, showLayerHint && styles.addPieceTextHinted]}>
            ADD A PIECE
          </Text>
        </TouchableOpacity>

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
        <TouchableOpacity onPress={handleBack} hitSlop={12}>
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
        ) : isGenerateError ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={40} color={colors.muted} />
            <Text style={styles.errorTitle}>Couldn't create your look</Text>
            <Text style={styles.errorText}>
              Something went wrong reaching our styling AI. Please try again in a moment.
            </Text>
            <TouchableOpacity
              style={styles.errorRetryBtn}
              onPress={handleGenerate}
              activeOpacity={0.85}
            >
              <Text style={styles.errorRetryText}>TRY AGAIN</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tryAnother} onPress={handleReset}>
              <Text style={styles.tryAnotherText}>Change occasion or season</Text>
            </TouchableOpacity>
          </View>
        ) : step === 'vibe' ? (
          /* Step 1 — occasion + season */
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
              onPress={() => setStep('base')}
              disabled={!occasion}
              activeOpacity={0.85}
            >
              <Text style={styles.generateBtnText}>NEXT</Text>
            </TouchableOpacity>
          </ScrollView>
        ) : (
          /* Step 2 — optional base piece */
          <View style={{ flex: 1 }}>
            <View style={styles.pickerHeaderPad}>
              <Text style={styles.pickerLabel}>BASE PIECE</Text>
              <Text style={styles.pickerSubtitle}>
                Optional — build the look around one of your pieces
              </Text>
            </View>
            <FlatList
              data={items}
              numColumns={3}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.baseGrid}
              columnWrapperStyle={styles.baseRow}
              renderItem={({ item }) => {
                const active = anchorId === item.id;
                return (
                  <TouchableOpacity
                    onPress={() => setAnchorId(active ? null : item.id)}
                    style={[styles.baseItem, active && styles.baseItemActive]}
                    activeOpacity={0.8}
                  >
                    <Image
                      source={{ uri: item.image_url }}
                      style={styles.baseImg}
                      resizeMode="cover"
                    />
                    {active && (
                      <View style={styles.baseCheck}>
                        <Ionicons name="checkmark" size={14} color={colors.onAccent} />
                      </View>
                    )}
                    <Text style={styles.baseItemLabel} numberOfLines={1}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
            <View style={styles.bottomBar}>
              <TouchableOpacity
                style={styles.generateBtn}
                onPress={handleGenerate}
                activeOpacity={0.85}
              >
                <Text style={styles.generateBtnText}>
                  {anchorId ? 'GENERATE LOOK' : 'GENERATE LOOK (NO BASE PIECE)'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )
      ) : (
        /* Results state */
        <View style={{ flex: 1 }}>
          <FlatList
            data={displaySuggestions ?? suggestions}
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

            <View style={styles.postGenActions}>
              <TouchableOpacity onPress={handleReset} hitSlop={8}>
                <Text style={styles.tryAnotherText}>Try a different vibe</Text>
              </TouchableOpacity>
              <Text style={styles.postGenDivider}>·</Text>
              <TouchableOpacity
                onPress={() => router.replace('/(tabs)/lookbook')}
                hitSlop={8}
              >
                <Text style={styles.tryAnotherText}>Back to Lookbook</Text>
              </TouchableOpacity>
            </View>
          </View>

          <AddPieceSheet
            visible={addPickerIndex !== null}
            items={
              addPickerIndex !== null
                ? items.filter(
                    (i) =>
                      !(displaySuggestions ?? suggestions ?? [])[addPickerIndex]?.item_ids.includes(
                        i.id,
                      ),
                  )
                : []
            }
            preferCategory={
              addPickerIndex !== null &&
              needsBaseLayer(
                ((displaySuggestions ?? suggestions ?? [])[addPickerIndex]?.item_ids ?? [])
                  .map((id) => swappedItemsById[id] ?? items.find((i) => i.id === id))
                  .filter((i): i is ClothingItem => !!i),
              )
                ? 'tops'
                : null
            }
            onPick={(item) => addPickerIndex !== null && handleAddPiece(addPickerIndex, item)}
            onClose={() => setAddPickerIndex(null)}
          />
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

    // Step 2 — base piece grid
    pickerHeaderPad: { paddingHorizontal: 16, paddingTop: 16 },
    baseGrid: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16, gap: 12 },
    baseRow: { gap: 12 },
    baseItem: {
      flex: 1,
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: c.surface,
      borderWidth: 1.5,
      borderColor: c.border,
    },
    baseItemActive: {
      borderColor: c.accent,
    },
    baseImg: { width: '100%', aspectRatio: 3 / 4, backgroundColor: c.surfaceAlt },
    baseCheck: {
      position: 'absolute',
      top: 8,
      right: 8,
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: c.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    baseItemLabel: {
      fontSize: 12,
      color: c.foreground,
      padding: 8,
      fontWeight: '500',
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

    // Error
    errorContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
      gap: 10,
    },
    errorTitle: {
      fontSize: 18,
      fontFamily: 'PlayfairDisplay_700Bold',
      color: c.foreground,
      marginTop: 4,
      textAlign: 'center',
    },
    errorText: {
      fontSize: 14,
      color: c.muted,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 8,
    },
    errorRetryBtn: {
      backgroundColor: c.accent,
      borderRadius: 8,
      paddingVertical: 14,
      paddingHorizontal: 32,
    },
    errorRetryText: {
      fontSize: 13,
      fontWeight: '700',
      color: c.onAccent,
      letterSpacing: 1,
    },
    tryAnother: { alignItems: 'center', paddingVertical: 8 },

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
    removeBtn: {
      position: 'absolute',
      top: 6,
      left: 6,
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: 'rgba(20,17,15,0.6)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    pieceInfo: {
      flex: 1,
      padding: 16,
      justifyContent: 'center',
      gap: 6,
    },
    swapBtn: {
      width: 44,
      alignItems: 'center',
      justifyContent: 'center',
      borderLeftWidth: 1,
      borderLeftColor: c.border,
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

    // Add a piece
    layerHint: {
      fontSize: 13,
      color: c.muted,
      fontStyle: 'italic',
      textAlign: 'center',
      marginTop: 4,
    },
    addPieceBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 14,
      borderRadius: 10,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: c.accent,
      backgroundColor: c.surface,
    },
    addPieceBtnHinted: {
      backgroundColor: c.accent,
      borderStyle: 'solid',
    },
    addPieceText: {
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 1,
      color: c.accent,
    },
    addPieceTextHinted: {
      color: c.onAccent,
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

    tryAnotherText: {
      fontSize: 14,
      color: c.accent,
      fontWeight: '500',
    },
    postGenActions: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      paddingVertical: 8,
    },
    postGenDivider: {
      fontSize: 14,
      color: c.border,
    },
  });
