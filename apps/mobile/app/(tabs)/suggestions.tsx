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
  const { data: suggestions, isLoading, isError } = useSuggestOutfits(anchorId);

  const anchor = items.find((i) => i.id === anchorId);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Outfit Ideas</Text>

        {items.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No pieces yet.</Text>
            <Text style={styles.emptyText}>Add items to your wardrobe to get outfit suggestions.</Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionLabel}>Select an anchor piece</Text>
            <FlatList
              data={items}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.anchors}
              renderItem={({ item }: { item: ClothingItem }) => (
                <TouchableOpacity
                  onPress={() => setAnchorId(item.id)}
                  style={[styles.anchor, anchorId === item.id && styles.anchorActive]}
                  activeOpacity={0.8}
                >
                  <Image source={{ uri: item.image_url }} style={styles.anchorImg} resizeMode="cover" />
                </TouchableOpacity>
              )}
            />

            {isLoading && (
              <View style={styles.loading}>
                <ActivityIndicator color="#C9A99A" size="large" />
                <Text style={styles.loadingText}>Styling your outfit…</Text>
              </View>
            )}

            {!isLoading && !anchorId && (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>Select a piece from your wardrobe to get started.</Text>
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
  title: { fontSize: 28, fontWeight: '700', color: '#1A1A1A' },
  sectionLabel: { fontSize: 13, color: '#8C8C8C', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  anchors: { gap: 10, paddingVertical: 4 },
  anchor: { width: 72, height: 96, borderRadius: 12, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent' },
  anchorActive: { borderColor: '#C9A99A' },
  anchorImg: { width: '100%', height: '100%' },
  loading: { alignItems: 'center', gap: 12, paddingVertical: 32 },
  loadingText: { fontSize: 14, color: '#8C8C8C' },
  empty: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#1A1A1A' },
  emptyText: { fontSize: 14, color: '#8C8C8C', textAlign: 'center', maxWidth: 280 },
});
