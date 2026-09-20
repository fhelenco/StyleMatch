import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { MoodBoard } from './MoodBoard';
import { OccasionBadge } from './OccasionBadge';
import { Button } from '../ui/Button';
import { ClothingItem } from '../../stores/wardrobeStore';
import { OutfitSuggestion } from '../../hooks/useOutfits';
import { useSaveOutfit } from '../../hooks/useOutfits';
import { useThemedStyles } from '../../contexts/theme';
import type { ThemeColors } from '../../lib/theme';

interface OutfitCardProps {
  suggestion: OutfitSuggestion;
  items: ClothingItem[];
}

export function OutfitCard({ suggestion, items }: OutfitCardProps) {
  const styles = useThemedStyles(makeStyles);
  const [expanded, setExpanded] = useState(false);
  const [saved, setSaved] = useState(false);
  const { mutate: saveOutfit, isPending } = useSaveOutfit();

  const outfitItems = items.filter((item) => suggestion.item_ids.includes(item.id));

  const handleSave = () => {
    saveOutfit(
      {
        item_ids: suggestion.item_ids,
        occasion: suggestion.occasion,
        season: suggestion.season,
        style_vibe: suggestion.style_vibe,
        style_notes: suggestion.style_notes,
        trend_note: suggestion.trend_note,
      },
      { onSuccess: () => setSaved(true) }
    );
  };

  return (
    <View style={styles.card}>
      <MoodBoard items={outfitItems} />
      <View style={styles.body}>
        <OccasionBadge occasion={suggestion.occasion} season={suggestion.season} />
        <Text style={styles.vibe}>{suggestion.style_vibe}</Text>
        {expanded && (
          <Text style={styles.notes}>{suggestion.style_notes}</Text>
        )}
        <TouchableOpacity onPress={() => setExpanded(!expanded)} style={styles.toggle}>
          <Text style={styles.toggleLabel}>{expanded ? 'Show less ▲' : 'Why it works ▼'}</Text>
        </TouchableOpacity>
        <View style={styles.footer}>
          <Text style={styles.trend}>{suggestion.trend_note}</Text>
          <Button
            title={saved ? 'Saved ✓' : 'Save Outfit'}
            onPress={handleSave}
            disabled={saved || isPending}
            loading={isPending}
            variant={saved ? 'secondary' : 'primary'}
            style={styles.saveBtn}
          />
        </View>
      </View>
    </View>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: c.surface,
      borderRadius: 16,
      overflow: 'hidden',
      marginBottom: 16,
      borderWidth: 1,
      borderColor: c.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
    body: { padding: 16, gap: 10 },
    vibe: { fontSize: 18, fontStyle: 'italic', color: c.foreground, fontWeight: '400' },
    notes: { fontSize: 13, color: c.muted, lineHeight: 20 },
    toggle: { paddingVertical: 2 },
    toggleLabel: { fontSize: 12, color: c.accentText, fontWeight: '600' },
    footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
    trend: { fontSize: 11, color: c.muted, fontStyle: 'italic' },
    saveBtn: { paddingVertical: 10, paddingHorizontal: 16 },
  });
