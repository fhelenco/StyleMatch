import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CategoryFilter } from '../../components/wardrobe/CategoryFilter';
import { WardrobeGrid } from '../../components/wardrobe/WardrobeGrid';
import { FilterSheet, WardrobeFilters, DEFAULT_FILTERS, seasonMatches } from '../../components/wardrobe/FilterSheet';
import { useWardrobe } from '../../hooks/useWardrobe';
import { useWardrobeStore } from '../../stores/wardrobeStore';
import { EmptyState } from '../../components/ui/EmptyState';
import { useTheme, useThemedStyles } from '../../contexts/theme';
import type { ThemeColors } from '../../lib/theme';

type Category = 'all' | 'tops' | 'bottoms' | 'shoes' | 'accessories' | 'outerwear';

export default function WardrobeScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [category, setCategory] = useState<Category>('all');
  const [filters, setFilters] = useState<WardrobeFilters>(DEFAULT_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { isLoading } = useWardrobe();
  const items = useWardrobeStore((s) => s.items);
  const router = useRouter();

  // Distinct styles present in the wardrobe, offered as filter chips.
  const availableStyles = useMemo(
    () =>
      Array.from(
        new Set(items.map((i) => i.style_category).filter((s): s is string => !!s))
      ).sort(),
    [items]
  );

  const filtered = useMemo(() => {
    let list = category === 'all' ? items : items.filter((i) => i.category === category);
    if (filters.seasons.length)
      list = list.filter((i) => filters.seasons.some((fs) => seasonMatches(fs, i.season)));
    if (filters.styles.length)
      list = list.filter((i) => i.style_category && filters.styles.includes(i.style_category));

    const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (tokens.length) {
      list = list.filter((i) => {
        const haystack = [
          i.label,
          i.garment_type,
          i.style_category,
          i.pattern,
          i.fabric,
          i.season,
          i.category,
          i.notes,
          ...(i.colors ?? []).map((c) => c.name),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return tokens.every((t) => haystack.includes(t));
      });
    }

    const sorted = [...list];
    if (filters.sort === 'most-worn') {
      sorted.sort((a, b) => (b.times_worn ?? 0) - (a.times_worn ?? 0));
    } else if (filters.sort === 'az') {
      sorted.sort((a, b) => a.label.localeCompare(b.label));
    } else {
      sorted.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }
    return sorted;
  }, [items, category, filters, query]);

  const filtersActive =
    filters.seasons.length > 0 || filters.styles.length > 0 || filters.sort !== 'recent';
  const searchActive = query.trim().length > 0;
  const hasRefinements = filtersActive || searchActive;

  const clearRefinements = () => {
    setFilters(DEFAULT_FILTERS);
    setQuery('');
  };

  const isWardrobeEmpty = items.length === 0 && !isLoading;
  const isCategoryEmpty = !isWardrobeEmpty && filtered.length === 0 && !isLoading;

  const categoryLabel = category.charAt(0).toUpperCase() + category.slice(1);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>My Wardrobe</Text>
          <Text style={styles.count}>
            {searchActive
              ? `${filtered.length} of ${items.length} pieces`
              : `${items.length} pieces`}
          </Text>
        </View>
        <View style={styles.headerRight}>
          {!isWardrobeEmpty && (
            <TouchableOpacity
              style={[styles.iconBtn, searchOpen && styles.iconBtnActive]}
              activeOpacity={0.7}
              onPress={() =>
                setSearchOpen((open) => {
                  if (open) setQuery('');
                  return !open;
                })
              }
            >
              <Ionicons
                name="search-outline"
                size={20}
                color={searchOpen ? colors.onForeground : colors.foreground}
              />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.iconBtn, filtersActive && styles.iconBtnActive]}
            activeOpacity={0.7}
            onPress={() => setFilterOpen(true)}
          >
            <Ionicons
              name="funnel-outline"
              size={18}
              color={filtersActive ? colors.onForeground : colors.foreground}
            />
            {filtersActive && <View style={styles.filterDot} />}
          </TouchableOpacity>
        </View>
      </View>

      {isWardrobeEmpty ? (
        <EmptyState
          subtitle="For your digital wardrobe"
          description="Begin your curation by uploading your most-loved pieces. Our AI will handle the organization."
          ctaLabel={'UPLOAD\nPIECE'}
          onCta={() => router.push('/add-item/capture')}
        />
      ) : (
        <>
          {searchOpen && (
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={18} color={colors.muted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search name, colour, fabric, style…"
                placeholderTextColor={colors.muted}
                value={query}
                onChangeText={setQuery}
                autoFocus
                autoCorrect={false}
                autoCapitalize="none"
                returnKeyType="search"
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => setQuery('')} hitSlop={8} activeOpacity={0.7}>
                  <Ionicons name="close-circle" size={18} color={colors.accent} />
                </TouchableOpacity>
              )}
            </View>
          )}
          <CategoryFilter selected={category} onSelect={setCategory} />
          {isCategoryEmpty ? (
            <View style={styles.categoryEmpty}>
              <Ionicons
                name={
                  searchActive
                    ? 'search-outline'
                    : filtersActive
                      ? 'funnel-outline'
                      : 'shirt-outline'
                }
                size={32}
                color={colors.accent}
              />
              <Text style={styles.categoryEmptyTitle}>
                {searchActive
                  ? 'No results'
                  : filtersActive
                    ? 'No matches'
                    : `No ${categoryLabel} yet`}
              </Text>
              <Text style={styles.categoryEmptySub}>
                {searchActive
                  ? `Nothing matches “${query.trim()}”.`
                  : filtersActive
                    ? 'No pieces match the filters you selected.'
                    : `You haven't added any ${categoryLabel.toLowerCase()} to your wardrobe.`}
              </Text>
              <TouchableOpacity
                onPress={() => (hasRefinements ? clearRefinements() : setCategory('all'))}
                activeOpacity={0.7}
              >
                <Text style={styles.categoryEmptyLink}>
                  {hasRefinements ? 'Clear search & filters' : 'View all pieces'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <WardrobeGrid items={filtered} loading={isLoading && items.length === 0} />
          )}
        </>
      )}

      {/* Match + FAB buttons */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.matchBtn}
          onPress={() => router.push('/matching')}
          activeOpacity={0.85}
        >
          <Text style={styles.matchIcon}>✧</Text>
          <Text style={styles.matchText}>MATCH</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/add-item/capture')}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={28} color={colors.onForeground} />
        </TouchableOpacity>
      </View>

      <FilterSheet
        visible={filterOpen}
        value={filters}
        availableStyles={availableStyles}
        onApply={(f) => {
          setFilters(f);
          setFilterOpen(false);
        }}
        onClose={() => setFilterOpen(false)}
      />
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
      paddingTop: 16,
      paddingBottom: 4,
    },
    headerLeft: { gap: 2 },
    title: { fontSize: 30, fontFamily: 'PlayfairDisplay_700Bold', color: c.foreground },
    count: { fontSize: 14, color: c.muted },
    headerRight: { flexDirection: 'row', gap: 8 },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginHorizontal: 16,
      marginTop: 10,
      marginBottom: 2,
      paddingHorizontal: 12,
      height: 40,
      borderRadius: 10,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    searchInput: {
      flex: 1,
      fontSize: 15,
      color: c.foreground,
      padding: 0,
    },
    categoryEmpty: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 40,
      paddingBottom: 80,
      gap: 10,
    },
    categoryEmptyTitle: {
      fontSize: 20,
      fontFamily: 'PlayfairDisplay_700Bold',
      color: c.foreground,
      marginTop: 4,
    },
    categoryEmptySub: {
      fontSize: 14,
      color: c.muted,
      textAlign: 'center',
      lineHeight: 21,
    },
    categoryEmptyLink: {
      fontSize: 14,
      color: c.accent,
      fontWeight: '700',
      letterSpacing: 0.5,
      marginTop: 8,
    },
    iconBtn: {
      width: 36,
      height: 36,
      borderRadius: 8,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconBtnActive: {
      backgroundColor: c.foreground,
      borderColor: c.foreground,
    },
    filterDot: {
      position: 'absolute',
      top: 5,
      right: 5,
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: c.accent,
    },
    bottomActions: {
      position: 'absolute',
      bottom: 72,
      right: 20,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    matchBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.accent,
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderRadius: 28,
      gap: 6,
      shadowColor: c.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 6,
    },
    matchIcon: {
      fontSize: 16,
      color: c.onAccent,
    },
    matchText: {
      fontSize: 13,
      fontWeight: '700',
      color: c.onAccent,
      letterSpacing: 1,
    },
    fab: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: c.foreground,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 8,
    },
  });
