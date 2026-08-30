import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { useThemedStyles } from '../../contexts/theme';
import type { ThemeColors } from '../../lib/theme';

export type SortOption = 'recent' | 'most-worn' | 'az';

export interface WardrobeFilters {
  seasons: string[];
  styles: string[];
  sort: SortOption;
}

export const DEFAULT_FILTERS: WardrobeFilters = { seasons: [], styles: [], sort: 'recent' };

const SEASONS: Array<{ label: string; value: string }> = [
  { label: 'Spring / Summer', value: 'spring-summer' },
  { label: 'Fall / Winter', value: 'fall-winter' },
  { label: 'All-Season', value: 'all-season' },
];

const SORTS: Array<{ label: string; value: SortOption }> = [
  { label: 'Recent', value: 'recent' },
  { label: 'Most Worn', value: 'most-worn' },
  { label: 'A–Z', value: 'az' },
];

function styleLabel(v: string) {
  return v
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

interface FilterSheetProps {
  visible: boolean;
  value: WardrobeFilters;
  availableStyles: string[];
  onApply: (f: WardrobeFilters) => void;
  onClose: () => void;
}

export function FilterSheet({
  visible,
  value,
  availableStyles,
  onApply,
  onClose,
}: FilterSheetProps) {
  const styles = useThemedStyles(makeStyles);
  const [seasons, setSeasons] = useState<string[]>(value.seasons);
  const [styles_, setStyles] = useState<string[]>(value.styles);
  const [sort, setSort] = useState<SortOption>(value.sort);

  // Reset the working copy to the applied filters each time the sheet opens.
  useEffect(() => {
    if (visible) {
      setSeasons(value.seasons);
      setStyles(value.styles);
      setSort(value.sort);
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (list: string[], setList: (v: string[]) => void, v: string) =>
    setList(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const clearAll = () => {
    setSeasons([]);
    setStyles([]);
    setSort('recent');
  };

  const Chip = ({
    label,
    active,
    onPress,
  }: {
    label: string;
    active: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.headerRow}>
              <Text style={styles.title}>Filters</Text>
              <TouchableOpacity onPress={clearAll} hitSlop={8}>
                <Text style={styles.clear}>Clear all</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.section}>SEASON</Text>
            <View style={styles.chipWrap}>
              {SEASONS.map((s) => (
                <Chip
                  key={s.value}
                  label={s.label}
                  active={seasons.includes(s.value)}
                  onPress={() => toggle(seasons, setSeasons, s.value)}
                />
              ))}
            </View>

            {availableStyles.length > 0 && (
              <>
                <Text style={styles.section}>STYLE</Text>
                <View style={styles.chipWrap}>
                  {availableStyles.map((s) => (
                    <Chip
                      key={s}
                      label={styleLabel(s)}
                      active={styles_.includes(s)}
                      onPress={() => toggle(styles_, setStyles, s)}
                    />
                  ))}
                </View>
              </>
            )}

            <Text style={styles.section}>SORT BY</Text>
            <View style={styles.chipWrap}>
              {SORTS.map((s) => (
                <Chip
                  key={s.value}
                  label={s.label}
                  active={sort === s.value}
                  onPress={() => setSort(s.value)}
                />
              ))}
            </View>
          </ScrollView>

          <TouchableOpacity
            style={styles.apply}
            onPress={() => onApply({ seasons, styles: styles_, sort })}
            activeOpacity={0.85}
          >
            <Text style={styles.applyText}>Apply Filters</Text>
          </TouchableOpacity>
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
      justifyContent: 'flex-start',
      paddingHorizontal: 12,
      paddingTop: 96,
    },
    card: {
      backgroundColor: c.surface,
      borderRadius: 24,
      padding: 24,
      maxHeight: '82%',
      shadowColor: '#000',
      shadowOpacity: 0.18,
      shadowRadius: 28,
      shadowOffset: { width: 0, height: 10 },
      elevation: 10,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    title: {
      fontSize: 26,
      fontFamily: 'PlayfairDisplay_700Bold',
      color: c.foreground,
    },
    clear: {
      fontSize: 15,
      color: c.accent,
      fontWeight: '600',
    },
    section: {
      fontSize: 12,
      fontWeight: '700',
      color: c.muted,
      letterSpacing: 1.5,
      marginTop: 20,
      marginBottom: 12,
    },
    chipWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    chip: {
      paddingHorizontal: 18,
      paddingVertical: 11,
      borderRadius: 24,
      borderWidth: 1.5,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    chipActive: {
      backgroundColor: c.foreground,
      borderColor: c.foreground,
    },
    chipText: {
      fontSize: 14,
      color: c.foreground,
      fontWeight: '500',
    },
    chipTextActive: {
      color: c.onForeground,
    },
    apply: {
      marginTop: 24,
      backgroundColor: c.foreground,
      borderRadius: 16,
      paddingVertical: 18,
      alignItems: 'center',
    },
    applyText: {
      fontSize: 16,
      fontWeight: '700',
      color: c.onForeground,
      letterSpacing: 0.5,
    },
  });
