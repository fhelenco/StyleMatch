import React, { useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  Pressable,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ClothingItem } from '../../stores/wardrobeStore';
import { useTheme, useThemedStyles } from '../../contexts/theme';
import type { ThemeColors } from '../../lib/theme';

interface Props {
  visible: boolean;
  /** candidates — should already exclude pieces that are in the look */
  items: ClothingItem[];
  /** category to surface first (e.g. 'tops' when the look lacks a base layer) */
  preferCategory?: ClothingItem['category'] | null;
  onPick: (item: ClothingItem) => void;
  onClose: () => void;
}

const CATEGORY_ORDER: ClothingItem['category'][] = [
  'tops',
  'bottoms',
  'outerwear',
  'shoes',
  'accessories',
];

export function AddPieceSheet({ visible, items, preferCategory, onPick, onClose }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const sorted = useMemo(() => {
    const rank = (c: ClothingItem['category']) => {
      if (preferCategory && c === preferCategory) return -1;
      const i = CATEGORY_ORDER.indexOf(c);
      return i === -1 ? CATEGORY_ORDER.length : i;
    };
    return [...items].sort(
      (a, b) => rank(a.category) - rank(b.category) || a.label.localeCompare(b.label),
    );
  }, [items, preferCategory]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <Text style={styles.title}>Add a piece</Text>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={22} color={colors.muted} />
            </TouchableOpacity>
          </View>

          {sorted.length === 0 ? (
            <Text style={styles.empty}>Every wardrobe piece is already in this look.</Text>
          ) : (
            <FlatList
              data={sorted}
              numColumns={3}
              keyExtractor={(i) => i.id}
              contentContainerStyle={styles.grid}
              columnWrapperStyle={styles.row}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.card}
                  onPress={() => onPick(item)}
                  activeOpacity={0.8}
                >
                  <Image source={{ uri: item.image_url }} style={styles.img} resizeMode="cover" />
                  <Text style={styles.label} numberOfLines={2}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: c.overlay,
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: c.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 24,
      maxHeight: '80%',
    },
    handle: {
      alignSelf: 'center',
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.border,
      marginBottom: 12,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    title: {
      fontSize: 22,
      fontFamily: 'PlayfairDisplay_700Bold',
      color: c.foreground,
    },
    empty: {
      fontSize: 14,
      color: c.muted,
      textAlign: 'center',
      paddingVertical: 32,
    },
    grid: { paddingBottom: 8, gap: 12 },
    row: { gap: 12 },
    card: {
      flex: 1,
      maxWidth: '31%',
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    img: { width: '100%', aspectRatio: 3 / 4, backgroundColor: c.surfaceAlt },
    label: {
      fontSize: 11,
      color: c.foreground,
      fontWeight: '500',
      padding: 8,
    },
  });
