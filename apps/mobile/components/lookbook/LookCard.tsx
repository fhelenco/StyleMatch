import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { useToggleFavorite, useDeleteOutfit, SavedOutfit } from '../../hooks/useOutfits';
import { ClothingItem } from '../../stores/wardrobeStore';
import { useTheme, useThemedStyles } from '../../contexts/theme';
import type { ThemeColors } from '../../lib/theme';

interface LookCardProps {
  outfit: SavedOutfit;
  items: ClothingItem[];
}

export function LookCard({ outfit, items }: LookCardProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { mutate: toggleFav } = useToggleFavorite();
  const { mutate: deleteOutfit } = useDeleteOutfit();
  const [confirmVisible, setConfirmVisible] = useState(false);

  const outfitItems = items.filter((item) =>
    outfit.items?.some((oi: any) => (oi.id || oi.clothing_item_id) === item.id)
  );

  const title = outfit.style_vibe || outfit.name || 'this look';

  const handleFavorite = () => {
    toggleFav({ id: outfit.id, is_favorite: !outfit.is_favorite });
  };

  return (
    <>
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/outfit/${outfit.id}`)}
      activeOpacity={0.9}
    >
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.vibe} numberOfLines={1}>
            {outfit.style_vibe || outfit.name || 'Untitled Look'}
          </Text>
          <View style={styles.actions}>
            <TouchableOpacity onPress={handleFavorite} hitSlop={8}>
              <Ionicons
                name={outfit.is_favorite ? 'heart' : 'heart-outline'}
                size={20}
                color={outfit.is_favorite ? colors.accent : colors.muted}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setConfirmVisible(true)} hitSlop={8}>
              <Ionicons name="trash-outline" size={19} color={colors.muted} />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.meta}>
          {outfitItems.length} pieces
          {outfit.occasion ? ` · ${outfit.occasion}` : ''}
          {outfit.season ? ` · ${outfit.season}` : ''}
        </Text>
      </View>
    </TouchableOpacity>

    <ConfirmDialog
      visible={confirmVisible}
      title="Delete look"
      message={`Remove "${title}" from your lookbook? This can't be undone.`}
      confirmLabel="Delete"
      cancelLabel="Cancel"
      destructive
      onCancel={() => setConfirmVisible(false)}
      onConfirm={() => {
        setConfirmVisible(false);
        deleteOutfit(outfit.id);
      }}
    />
    </>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: c.surface,
      borderRadius: 16,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: 16,
    },
    body: {
      padding: 16,
      gap: 4,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    vibe: {
      fontSize: 18,
      fontFamily: 'PlayfairDisplay_400Regular_Italic',
      color: c.foreground,
      flex: 1,
      marginRight: 8,
    },
    meta: {
      fontSize: 13,
      color: c.muted,
    },
  });
