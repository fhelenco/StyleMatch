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

const ROLES = ['FOUNDATION', 'LAYER', 'BASE'] as const;

export default function MatchScreen() {
  const router = useRouter();
  const { anchor } = useLocalSearchParams<{ anchor?: string }>();
  const items = useWardrobeStore((s) => s.items);
  const [anchorId, setAnchorId] = useState<string | null>(anchor ?? null);
  const { data: suggestions, isLoading } = useSuggestOutfits(anchorId);
  const { mutate: saveOutfit, isPending: isSaving } = useSaveOutfit();
  const [saved, setSaved] = useState(false);

  const suggestion = suggestions?.[0];
  const matchedItems = suggestion
    ? items.filter((item) => suggestion.item_ids.includes(item.id))
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
          <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
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
          <ActivityIndicator size="large" color="#C9A99A" />
          <Text style={styles.loadingText}>Creating your match...</Text>
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
          {matchedItems.slice(0, 3).map((item, index) => (
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
                  {ROLES[index] || 'ACCENT'}
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
              {saved && <Ionicons name="checkmark" size={18} color="#FFFFFF" />}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
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
    color: '#1A1A1A',
  },

  // Picker
  pickerContainer: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  pickerLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8C8C8C',
    letterSpacing: 2,
    marginBottom: 8,
  },
  pickerSubtitle: {
    fontSize: 14,
    color: '#8C8C8C',
    marginBottom: 20,
  },
  pickerGrid: { gap: 12, paddingBottom: 40 },
  pickerRow: { gap: 12 },
  pickerItem: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E2DE',
  },
  pickerImg: { width: '100%', aspectRatio: 3 / 4 },
  pickerItemLabel: {
    fontSize: 12,
    color: '#1A1A1A',
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
    color: '#8C8C8C',
  },

  // Results
  results: { padding: 16, paddingBottom: 40, gap: 16 },

  scoreContainer: { alignItems: 'center', gap: 8, paddingVertical: 16 },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#C9A99A',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  scoreValue: {
    fontSize: 40,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: '#C9A99A',
  },
  scorePercent: {
    fontSize: 20,
    fontFamily: 'PlayfairDisplay_400Regular_Italic',
    color: '#C9A99A',
    marginTop: 6,
  },
  scoreLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8C8C8C',
    letterSpacing: 3,
  },

  // Piece cards
  pieceCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E8E2DE',
  },
  pieceThumb: {
    width: 100,
    height: 120,
    backgroundColor: '#F5F0ED',
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
    color: '#C9A99A',
    letterSpacing: 2,
  },
  pieceName: {
    fontSize: 20,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: '#1A1A1A',
  },

  // Citation
  citation: {
    backgroundColor: '#F5F0ED',
    borderRadius: 12,
    padding: 20,
  },
  citationText: {
    fontSize: 14,
    fontFamily: 'PlayfairDisplay_400Regular_Italic',
    color: '#8C8C8C',
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
    backgroundColor: '#C9A99A',
  },
  lookbookBtnSaved: {
    backgroundColor: '#A07B6F',
  },
  lookbookBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },

  tryAnother: { alignItems: 'center', paddingVertical: 8 },
  tryAnotherText: {
    fontSize: 14,
    color: '#C9A99A',
    fontWeight: '500',
  },
});
