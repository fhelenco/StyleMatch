import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CategoryFilter } from '../../components/wardrobe/CategoryFilter';
import { WardrobeGrid } from '../../components/wardrobe/WardrobeGrid';
import { useWardrobe } from '../../hooks/useWardrobe';
import { useWardrobeStore } from '../../stores/wardrobeStore';

type Category = 'all' | 'tops' | 'bottoms' | 'shoes' | 'accessories' | 'outerwear';

export default function WardrobeScreen() {
  const [category, setCategory] = useState<Category>('all');
  const { isLoading, isError } = useWardrobe(category);
  const items = useWardrobeStore((s) => s.items);
  const router = useRouter();

  const filtered = category === 'all' ? items : items.filter((i) => i.category === category);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Wardrobe</Text>
        <Text style={styles.count}>{items.length} pieces</Text>
      </View>

      <CategoryFilter selected={category} onSelect={setCategory} />

      <WardrobeGrid items={filtered} loading={isLoading && items.length === 0} />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/add-item/capture')}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },
  title: { fontSize: 28, fontWeight: '700', color: '#1A1A1A' },
  count: { fontSize: 13, color: '#8C8C8C' },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#C9A99A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#C9A99A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
});
