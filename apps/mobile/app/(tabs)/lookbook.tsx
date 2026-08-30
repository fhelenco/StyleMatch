import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSavedOutfits } from '../../hooks/useOutfits';
import { useWardrobeStore } from '../../stores/wardrobeStore';
import { LookCard } from '../../components/lookbook/LookCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { useTheme, useThemedStyles } from '../../contexts/theme';
import type { ThemeColors } from '../../lib/theme';

const FILTERS = ['All', 'Favorites', 'Work', 'Weekend', 'Date'] as const;

export default function LookbookScreen() {
  const [filter, setFilter] = useState<string>('All');
  const { data: outfits } = useSavedOutfits();
  const items = useWardrobeStore((s) => s.items);
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const filtered =
    filter === 'All'
      ? outfits
      : filter === 'Favorites'
        ? outfits?.filter((o) => o.is_favorite)
        : outfits?.filter(
            (o) => o.occasion?.toLowerCase() === filter.toLowerCase()
          );

  const isEmpty = !outfits || outfits.length === 0;
  const isFilterEmpty = !isEmpty && (!filtered || filtered.length === 0);

  return (
    <SafeAreaView style={styles.container}>
      {isEmpty ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.title}>Lookbook</Text>
          <Text style={styles.subtitle}>0 saved looks</Text>
          <EmptyState
            subtitle="For your saved looks"
            description="Match your wardrobe pieces to create curated outfits. Your saved looks will appear here."
            ctaLabel={'CREATE\nLOOK'}
            onCta={() => router.push('/match')}
          />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Lookbook</Text>
          <Text style={styles.subtitle}>{outfits.length} saved looks</Text>

          {/* Filter chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipsScroll}
            contentContainerStyle={styles.chips}
          >
            {FILTERS.map((f) => {
              const active = filter === f;
              return (
                <TouchableOpacity
                  key={f}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setFilter(f)}
                  activeOpacity={0.8}
                >
                  {f === 'Favorites' && (
                    <Ionicons
                      name="heart"
                      size={13}
                      color={active ? colors.onForeground : colors.accent}
                      style={{ marginRight: 5 }}
                    />
                  )}
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {f}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Look cards */}
          {isFilterEmpty ? (
            <View style={styles.filterEmpty}>
              <Ionicons
                name={filter === 'Favorites' ? 'heart-outline' : 'albums-outline'}
                size={30}
                color={colors.accent}
              />
              <Text style={styles.filterEmptyText}>
                {filter === 'Favorites'
                  ? 'No favorites yet. Tap the heart on a look to add it here.'
                  : `No ${filter.toLowerCase()} looks yet.`}
              </Text>
            </View>
          ) : (
            filtered?.map((outfit) => (
              <LookCard key={outfit.id} outfit={outfit} items={items} />
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    scroll: { padding: 16, paddingBottom: 40 },
    emptyWrap: { flex: 1, padding: 16 },
    title: {
      fontSize: 28,
      fontFamily: 'PlayfairDisplay_700Bold',
      color: c.foreground,
    },
    subtitle: {
      fontSize: 14,
      color: c.muted,
      marginBottom: 16,
    },
    chipsScroll: { flexGrow: 0, marginBottom: 20 },
    chips: {
      flexDirection: 'row',
      gap: 8,
      alignItems: 'center',
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 18,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    chipActive: {
      backgroundColor: c.foreground,
      borderColor: c.foreground,
    },
    chipText: {
      fontSize: 13,
      fontWeight: '500',
      color: c.foreground,
    },
    chipTextActive: {
      color: c.onForeground,
    },
    filterEmpty: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 40,
      paddingTop: 80,
      gap: 12,
    },
    filterEmptyText: {
      fontSize: 14,
      color: c.muted,
      textAlign: 'center',
      lineHeight: 21,
    },
  });
