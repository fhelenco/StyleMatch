import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useThemedStyles } from '../../contexts/theme';
import type { ThemeColors } from '../../lib/theme';

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
  const styles = useThemedStyles(makeStyles);
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
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

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    // flexGrow:0 keeps the horizontal row from stretching to fill the column,
    // alignItems:center stops each chip from being stretched to the row height.
    scroll: { flexGrow: 0, flexShrink: 0 },
    container: { paddingHorizontal: 16, gap: 8, paddingVertical: 8, alignItems: 'center' },
    chip: {
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 24,
      borderWidth: 1.5,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    chipActive: { backgroundColor: c.foreground, borderColor: c.foreground },
    label: { fontSize: 13, color: c.muted, fontWeight: '500' },
    labelActive: { color: c.onForeground, fontWeight: '600' },
  });
