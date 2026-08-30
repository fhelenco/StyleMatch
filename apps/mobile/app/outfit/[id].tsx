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
  FlatList,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useOutfitDetail, useToggleFavorite } from '../../hooks/useOutfits';
import { MoodBoard } from '../../components/outfits/MoodBoard';
import { ClothingItem } from '../../stores/wardrobeStore';
import { useTheme, useThemedStyles } from '../../contexts/theme';
import type { ThemeColors } from '../../lib/theme';

export default function OutfitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { data: outfit, isLoading } = useOutfitDetail(id);
  const { mutate: toggleFav } = useToggleFavorite();

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={{ flex: 1 }} color={colors.accent} />
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

  const tags = [
    outfit.occasion,
    outfit.season,
    outfit.trend_note,
  ].filter(Boolean);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Outfit</Text>
        <TouchableOpacity
          onPress={() => toggleFav({ id: outfit.id, is_favorite: !outfit.is_favorite })}
          hitSlop={12}
        >
          <Ionicons
            name={outfit.is_favorite ? 'heart' : 'heart-outline'}
            size={24}
            color={colors.accent}
          />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Large moodboard */}
        <MoodBoard items={items} square />

        {/* Title */}
        <Text style={styles.title}>
          {outfit.style_vibe || outfit.name || 'Untitled'}
        </Text>

        {/* Tags */}
        {tags.length > 0 && (
          <View style={styles.tags}>
            {tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Description */}
        {outfit.style_notes && (
          <Text style={styles.description}>{outfit.style_notes}</Text>
        )}

        {/* Items in this look */}
        <Text style={styles.sectionLabel}>ITEMS IN THIS LOOK</Text>
        <FlatList
          data={items}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.itemsRow}
          scrollEnabled={items.length > 3}
          renderItem={({ item }: { item: ClothingItem }) => (
            <View style={styles.itemCard}>
              <Image
                source={{ uri: item.image_url }}
                style={styles.itemImg}
                resizeMode="cover"
              />
              <Text style={styles.itemLabel} numberOfLines={1}>
                {item.label}
              </Text>
            </View>
          )}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    headerTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: c.foreground,
    },
    scroll: { padding: 16, gap: 16, paddingBottom: 40 },

    title: {
      fontSize: 24,
      fontFamily: 'PlayfairDisplay_700Bold',
      color: c.foreground,
    },
    tags: {
      flexDirection: 'row',
      gap: 8,
      flexWrap: 'wrap',
    },
    tag: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    tagText: {
      fontSize: 12,
      color: c.muted,
      textTransform: 'lowercase',
    },
    description: {
      fontSize: 14,
      color: c.muted,
      lineHeight: 22,
    },
    sectionLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: c.muted,
      letterSpacing: 2,
      marginTop: 8,
    },
    itemsRow: { gap: 12 },
    itemCard: {
      width: 100,
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    itemImg: {
      width: '100%',
      height: 100,
      backgroundColor: c.surfaceAlt,
    },
    itemLabel: {
      fontSize: 12,
      color: c.foreground,
      fontWeight: '500',
      padding: 8,
    },
    notFound: {
      fontSize: 16,
      color: c.muted,
      textAlign: 'center',
      marginTop: 100,
    },
  });
