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
  const { isLoading } = useWardrobe(category);
  const items = useWardrobeStore((s) => s.items);
  const router = useRouter();

  const filtered = category === 'all' ? items : items.filter((i) => i.category === category);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>My Wardrobe</Text>
          <Text style={styles.count}>{items.length} pieces</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
            <Ionicons name="search-outline" size={20} color="#1A1A1A" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
            <Ionicons name="options-outline" size={20} color="#1A1A1A" />
          </TouchableOpacity>
        </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },
  headerLeft: { gap: 2 },
  title: { fontSize: 28, fontWeight: '700', color: '#1A1A1A' },
  count: { fontSize: 14, color: '#8C8C8C' },
  headerRight: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E2DE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 72,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
});
