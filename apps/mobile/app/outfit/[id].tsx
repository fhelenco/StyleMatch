import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useOutfitDetail, useToggleFavorite } from '../../hooks/useOutfits';
import { OccasionBadge } from '../../components/outfits/OccasionBadge';
import { MoodBoard } from '../../components/outfits/MoodBoard';
import { ClothingItem } from '../../stores/wardrobeStore';

export default function OutfitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: outfit, isLoading } = useOutfitDetail(id);
  const { mutate: toggleFav } = useToggleFavorite();

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={{ flex: 1 }} color="#C9A99A" />
      </SafeAreaView>
    );
  }

  if (!outfit) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.notFound}>Outfit not found.</Text>
      </SafeAreaView>
    );
  }

  const items = (outfit.items as ClothingItem[]) || [];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {outfit.name || outfit.style_vibe || 'Outfit'}
        </Text>
        <TouchableOpacity
          onPress={() => toggleFav({ id: outfit.id, is_favorite: !outfit.is_favorite })}
          style={styles.fav}
        >
          <Ionicons
            name={outfit.is_favorite ? 'heart' : 'heart-outline'}
            size={24}
            color="#C9A99A"
          />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <MoodBoard items={items} />

        <View style={styles.meta}>
          {outfit.occasion && (
            <OccasionBadge occasion={outfit.occasion} season={outfit.season} />
          )}
          {outfit.style_vibe && (
            <Text style={styles.vibe}>{outfit.style_vibe}</Text>
          )}
          {outfit.style_notes && (
            <Text style={styles.notes}>{outfit.style_notes}</Text>
          )}
          {outfit.trend_note && (
            <Text style={styles.trend}>{outfit.trend_note}</Text>
          )}
        </View>

        <Text style={styles.sectionLabel}>Pieces ({items.length})</Text>
        {items.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <Image source={{ uri: item.image_url }} style={styles.thumb} resizeMode="cover" />
            <View style={styles.itemInfo}>
              <Text style={styles.itemLabel}>{item.label}</Text>
              <Text style={styles.itemType}>{item.garment_type} · {item.category}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  fav: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontSize: 18, fontWeight: '600', color: '#1A1A1A', textAlign: 'center' },
  scroll: { padding: 16, gap: 16, paddingBottom: 40 },
  meta: { gap: 10 },
  vibe: { fontSize: 20, fontStyle: 'italic', color: '#1A1A1A' },
  notes: { fontSize: 14, color: '#8C8C8C', lineHeight: 22 },
  trend: { fontSize: 12, color: '#C9A99A', fontStyle: 'italic' },
  sectionLabel: { fontSize: 12, color: '#8C8C8C', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 8 },
  itemRow: { flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#E8E2DE' },
  thumb: { width: 56, height: 74, borderRadius: 8, backgroundColor: '#F5F0ED' },
  itemInfo: { flex: 1, gap: 4 },
  itemLabel: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
  itemType: { fontSize: 12, color: '#8C8C8C', textTransform: 'capitalize' },
  notFound: { fontSize: 16, color: '#8C8C8C', textAlign: 'center', marginTop: 100 },
});
