import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CategoryFilter } from '../../components/wardrobe/CategoryFilter';
import { WardrobeGrid } from '../../components/wardrobe/WardrobeGrid';
import { FilterSheet, WardrobeFilters, DEFAULT_FILTERS } from '../../components/wardrobe/FilterSheet';
import { useWardrobe } from '../../hooks/useWardrobe';
import { useWardrobeStore } from '../../stores/wardrobeStore';
import { EmptyState } from '../../components/ui/EmptyState';

type Category = 'all' | 'tops' | 'bottoms' | 'shoes' | 'accessories' | 'outerwear';

export default function WardrobeScreen() {
  const [category, setCategory] = useState<Category>('all');
  const [filters, setFilters] = useState<WardrobeFilters>(DEFAULT_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
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
    if (filters.seasons.length) list = list.filter((i) => filters.seasons.includes(i.season ?? ''));
    if (filters.styles.length)
      list = list.filter((i) => i.style_category && filters.styles.includes(i.style_category));

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
  }, [items, category, filters]);

  const filtersActive =
    filters.seasons.length > 0 || filters.styles.length > 0 || filters.sort !== 'recent';

  const isWardrobeEmpty = items.length === 0 && !isLoading;
  const isCategoryEmpty = !isWardrobeEmpty && filtered.length === 0 && !isLoading;

  const categoryLabel = category.charAt(0).toUpperCase() + category.slice(1);

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
          <TouchableOpacity
            style={[styles.iconBtn, filtersActive && styles.iconBtnActive]}
            activeOpacity={0.7}
            onPress={() => setFilterOpen(true)}
          >
            <Ionicons
              name="funnel-outline"
              size={18}
              color={filtersActive ? '#FFFFFF' : '#1A1A1A'}
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
          <CategoryFilter selected={category} onSelect={setCategory} />
          {isCategoryEmpty ? (
            <View style={styles.categoryEmpty}>
              <Ionicons
                name={filtersActive ? 'funnel-outline' : 'shirt-outline'}
                size={32}
                color="#C9A99A"
              />
              <Text style={styles.categoryEmptyTitle}>
                {filtersActive ? 'No matches' : `No ${categoryLabel} yet`}
              </Text>
              <Text style={styles.categoryEmptySub}>
                {filtersActive
                  ? 'No pieces match the filters you selected.'
                  : `You haven't added any ${categoryLabel.toLowerCase()} to your wardrobe.`}
              </Text>
              <TouchableOpacity
                onPress={() => (filtersActive ? setFilters(DEFAULT_FILTERS) : setCategory('all'))}
                activeOpacity={0.7}
              >
                <Text style={styles.categoryEmptyLink}>
                  {filtersActive ? 'Clear filters' : 'View all pieces'}
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
          onPress={() => router.push('/match')}
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
          <Ionicons name="add" size={28} color="#FFFFFF" />
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
  title: { fontSize: 30, fontFamily: 'PlayfairDisplay_700Bold', color: '#1A1A1A' },
  count: { fontSize: 14, color: '#8C8C8C' },
  headerRight: { flexDirection: 'row', gap: 8 },
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
    color: '#1A1A1A',
    marginTop: 4,
  },
  categoryEmptySub: {
    fontSize: 14,
    color: '#8C8C8C',
    textAlign: 'center',
    lineHeight: 21,
  },
  categoryEmptyLink: {
    fontSize: 14,
    color: '#C9A99A',
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 8,
  },
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
  iconBtnActive: {
    backgroundColor: '#1A1A1A',
    borderColor: '#1A1A1A',
  },
  filterDot: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#C9A99A',
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
    backgroundColor: '#C9A99A',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 28,
    gap: 6,
    shadowColor: '#C9A99A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  matchIcon: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  matchText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  fab: {
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
