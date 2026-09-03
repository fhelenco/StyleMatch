import React, { useState } from 'react';
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
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useWardrobeStore, ClothingItem } from '../stores/wardrobeStore';
import { useSuggestOutfits, useSaveOutfit } from '../hooks/useOutfits';
import { useTheme, useThemedStyles } from '../contexts/theme';
import type { ThemeColors } from '../lib/theme';

const CATEGORY_ROLE: Record<string, string> = {
  shoes: 'FOUNDATION',
  bottoms: 'BASE',
  tops: 'LAYER',
  outerwear: 'OUTER LAYER',
  accessories: 'ACCENT',
};

export default function MatchScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { anchor } = useLocalSearchParams<{ anchor?: string }>();
  const items = useWardrobeStore((s) => s.items);
  const [anchorId, setAnchorId] = useState<string | null>(anchor ?? null);
  const {
    data: suggestions,
    isLoading,
    isError,
    refetch,
  } = useSuggestOutfits(anchorId);
  const { mutate: saveOutfit, isPending: isSaving } = useSaveOutfit();
  const [saved, setSaved] = useState(false);

  const suggestion = suggestions?.[0];
  const matchedItems = suggestion
    ? suggestion.item_ids
        .map((id) => items.find((i) => i.id === id))
        .filter((i): i is (typeof items)[number] => !!i)
    : [];

  const handleSave = () => {
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/wardrobe'))}
          hitSlop={12}
        >
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>StyleMatch</Text>
        <View style={{ width: 24 }} />
      </View>

      {!anchorId ? (
        /* Picker state */
        <View style={styles.pickerContainer}>
          <Text style={styles.pickerLabel}>SELECT AN ANCHOR PIECE</Text>
          <Text style={styles.pickerSubtitle}>
            Choose a piece from your wardrobe to build an outfit around
          </Text>
          <FlatList
            data={items}
            numColumns={3}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.pickerGrid}
            columnWrapperStyle={styles.pickerRow}
            renderItem={({ item }: { item: ClothingItem }) => (
              <TouchableOpacity
                onPress={() => {
                  setAnchorId(item.id);
                  setSaved(false);
                }}
                style={styles.pickerItem}
                activeOpacity={0.8}
              >
                <Image
                  source={{ uri: item.image_url }}
                  style={styles.pickerImg}
                  resizeMode="cover"
                />
                <Text style={styles.pickerItemLabel} numberOfLines={1}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      ) : isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Creating your match...</Text>
        </View>
      ) : isError ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={40} color={colors.muted} />
          <Text style={styles.errorTitle}>Couldn't create your match</Text>
          <Text style={styles.errorText}>
            Something went wrong reaching our styling AI. Please try again in a moment.
          </Text>
          <TouchableOpacity style={styles.errorRetryBtn} onPress={() => refetch()} activeOpacity={0.85}>
            <Text style={styles.errorRetryText}>TRY AGAIN</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tryAnother}
            onPress={() => {
              setAnchorId(null);
              setSaved(false);
            }}
          >
            <Text style={styles.tryAnotherText}>Choose a different piece</Text>
          </TouchableOpacity>
        </View>
      ) : suggestion ? (
        /* Results state */
        <ScrollView contentContainerStyle={styles.results} showsVerticalScrollIndicator={false}>
          {/* Cohesion Score */}
          <View style={styles.scoreContainer}>
            <View style={styles.scoreCircle}>
              <Text style={styles.scoreValue}>
                {Math.round(suggestion.cohesion_score ?? 0)}
              </Text>
              <Text style={styles.scorePercent}>%</Text>
            </View>
            <Text style={styles.scoreLabel}>COHESION SCORE</Text>
          </View>

          {/* Matched Pieces */}
          {matchedItems.map((item) => (
            <View key={item.id} style={styles.pieceCard}>
              <View style={styles.pieceThumb}>
                <Image
                  source={{ uri: item.image_url }}
                  style={styles.pieceImg}
                  resizeMode="cover"
                />
              </View>
              <View style={styles.pieceInfo}>
                <Text style={styles.pieceRole}>
                  {CATEGORY_ROLE[item.category] ?? 'PIECE'}
                </Text>
                <Text style={styles.pieceName}>{item.label}</Text>
              </View>
            </View>
          ))}

          {/* AI Citation */}
          <View style={styles.citation}>
            <Text style={styles.citationText}>
              "{suggestion.style_notes}"
            </Text>
          </View>

          {/* Action Button */}
          <View style={styles.actions}>
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
          </View>

          {/* Try another */}
          <TouchableOpacity
            style={styles.tryAnother}
            onPress={() => {
              setAnchorId(null);
              setSaved(false);
            }}
          >
            <Text style={styles.tryAnotherText}>Try another piece</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : null}
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
    pickerContainer: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
    pickerLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: c.muted,
      letterSpacing: 2,
      marginBottom: 8,
    },
    pickerSubtitle: {
      fontSize: 14,
      color: c.muted,
      marginBottom: 20,
    },
    pickerGrid: { gap: 12, paddingBottom: 40 },
    pickerRow: { gap: 12 },
    pickerItem: {
      flex: 1,
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    pickerImg: { width: '100%', aspectRatio: 3 / 4 },
    pickerItemLabel: {
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

    // Results
    results: { padding: 16, paddingBottom: 40, gap: 16 },

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

    // Actions
    actions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 8,
    },
    lookbookBtn: {
      flex: 1,
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
