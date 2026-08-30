import React from 'react';
import {
  FlatList,
  View,
  useWindowDimensions,
  ActivityIndicator,
  Text,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ClothingCard } from './ClothingCard';
import { ClothingItem } from '../../stores/wardrobeStore';
import { useTheme, useThemedStyles } from '../../contexts/theme';
import type { ThemeColors } from '../../lib/theme';

interface WardrobeGridProps {
  items: ClothingItem[];
  loading?: boolean;
}

function getColumns(width: number): number {
  if (width < 400) return 2;
  if (width < 768) return 3;
  if (width < 1200) return 4;
  return 5;
}

export function WardrobeGrid({ items, loading }: WardrobeGridProps) {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const numCols = getColumns(width);
  const gap = 10;
  const padding = 16;
  const cardWidth = (width - padding * 2 - gap * (numCols - 1)) / numCols;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>Your wardrobe awaits.</Text>
        <Text style={styles.emptySubtitle}>Add your first piece.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      key={numCols}
      numColumns={numCols}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding, paddingBottom: 100 }}
      columnWrapperStyle={numCols > 1 ? { gap } : undefined}
      ItemSeparatorComponent={() => <View style={{ height: gap }} />}
      renderItem={({ item }) => (
        <ClothingCard
          item={item}
          width={cardWidth}
          onPress={() => router.push(`/item/${item.id}`)}
        />
      )}
    />
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
    emptyTitle: { fontSize: 18, color: c.foreground, fontWeight: '600' },
    emptySubtitle: { fontSize: 14, color: c.muted },
  });
