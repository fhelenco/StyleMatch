import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';

const CATEGORIES = ['all', 'tops', 'bottoms', 'shoes', 'accessories', 'outerwear'] as const;
type Category = (typeof CATEGORIES)[number];

const LABELS: Record<Category, string> = {
  all: 'All',
  tops: 'Tops',
  bottoms: 'Bottoms',
  shoes: 'Shoes',
  accessories: 'Accessories',
  outerwear: 'Outerwear',
};

interface CategoryFilterProps {
  selected: Category;
  onSelect: (cat: Category) => void;
}

export function CategoryFilter({ selected, onSelect }: CategoryFilterProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {CATEGORIES.map((cat) => {
        const active = cat === selected;
        return (
          <TouchableOpacity
            key={cat}
            onPress={() => onSelect(cat)}
            style={[styles.chip, active && styles.chipActive]}
            activeOpacity={0.75}
          >
            <Text style={[styles.label, active && styles.labelActive]}>
              {LABELS[cat]}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, gap: 8, paddingVertical: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E8E2DE',
    backgroundColor: '#FFFFFF',
  },
  chipActive: { backgroundColor: '#1A1A1A', borderColor: '#1A1A1A' },
  label: { fontSize: 13, color: '#8C8C8C', fontWeight: '500' },
  labelActive: { color: '#FFFFFF', fontWeight: '600' },
});
