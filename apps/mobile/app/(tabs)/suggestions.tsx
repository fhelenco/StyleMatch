import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useWardrobeStore } from '../../stores/wardrobeStore';
import { useSuggestOutfits } from '../../hooks/useOutfits';
import { OutfitCard } from '../../components/outfits/OutfitCard';
import { ClothingItem } from '../../stores/wardrobeStore';

export default function SuggestionsScreen() {
  const items = useWardrobeStore((s) => s.items);
  const [anchorId, setAnchorId] = useState<string | null>(null);
  const { data: suggestions, isLoading } = useSuggestOutfits(anchorId);

  const anchor = items.find((i) => i.id === anchorId);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {anchor ? 'Style It With' : 'Outfit Ideas'}
          </Text>
          {anchor && (
            <Text style={styles.subtitle}>Based on your {anchor.label}</Text>
          )}
        </View>

        {items.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No pieces yet.</Text>
            <Text style={styles.emptyText}>
              Add items to your wardrobe to get outfit suggestions.
            </Text>
          </View>
        ) : (
          <>
            {/* Anchor piece row */}
            <View style={styles.anchorSection}>
              {anchor ? (
                <View style={styles.anchorRow}>
                  <View style={styles.anchorThumb}>
                    <Image
                      source={{ uri: anchor.image_url }}
                      style={styles.anchorImg}
                      resizeMode="cover"
                    />
                  </View>
                  <View style={styles.anchorInfo}>
                    <Text style={styles.anchorLabel}>{anchor.label}</Text>
                    <TouchableOpacity onPress={() => setAnchorId(null)}>
                      <Text style={styles.changeLink}>Change</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <Text style={styles.sectionLabel}>Select an anchor piece</Text>
              )}
            </View>

            {/* Horizontal picker */}
            <FlatList
              data={items}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.anchors}
              renderItem={({ item }: { item: ClothingItem }) => (
                <TouchableOpacity
                  onPress={() => setAnchorId(item.id)}
                  style={[
                    styles.anchor,
                    anchorId === item.id && styles.anchorActive,
                  ]}
                  activeOpacity={0.8}
                >
                  <Image
                    source={{ uri: item.image_url }}
                    style={styles.anchorPickerImg}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              )}
            />

            {isLoading && (
              <View style={styles.loading}>
                <ActivityIndicator color="#1A1A1A" size="large" />
                <Text style={styles.loadingText}>Styling your outfit…</Text>
              </View>
            )}

            {!isLoading && !anchorId && (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>
                  Select a piece above to get AI outfit ideas.
                </Text>
              </View>
            )}

            {suggestions?.map((s, i) => (
              <OutfitCard key={i} suggestion={s} items={items} />
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  scroll: { padding: 16, gap: 16, paddingBottom: 100 },
  header: { gap: 4 },
  title: { fontSize: 28, fontWeight: '700', color: '#1A1A1A' },
  subtitle: { fontSize: 14, color: '#8C8C8C' },
  anchorSection: { minHeight: 24 },
  anchorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E8E2DE',
  },
  anchorThumb: {
    width: 44,
    height: 58,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#F5F0ED',
  },
  anchorImg: { width: '100%', height: '100%' },
  anchorInfo: { flex: 1, gap: 4 },
  anchorLabel: { fontSize: 14, fontWeight: '500', color: '#1A1A1A' },
  changeLink: { fontSize: 13, color: '#C9A99A', fontWeight: '500' },
  sectionLabel: {
    fontSize: 13,
    color: '#8C8C8C',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  anchors: { gap: 10, paddingVertical: 4 },
  anchor: {
    width: 72,
    height: 96,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  anchorActive: { borderColor: '#1A1A1A' },
  anchorPickerImg: { width: '100%', height: '100%' },
  loading: { alignItems: 'center', gap: 12, paddingVertical: 32 },
  loadingText: { fontSize: 14, color: '#8C8C8C' },
  empty: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#1A1A1A' },
  emptyText: {
    fontSize: 14,
    color: '#8C8C8C',
    textAlign: 'center',
    maxWidth: 280,
  },
});
