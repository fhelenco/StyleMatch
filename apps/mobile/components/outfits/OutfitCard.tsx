import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { MoodBoard } from './MoodBoard';
import { OccasionBadge } from './OccasionBadge';
import { Button } from '../ui/Button';
import { ClothingItem } from '../../stores/wardrobeStore';
import { OutfitSuggestion } from '../../hooks/useOutfits';
import { useSaveOutfit } from '../../hooks/useOutfits';

interface OutfitCardProps {
  suggestion: OutfitSuggestion;
  items: ClothingItem[];
}

export function OutfitCard({ suggestion, items }: OutfitCardProps) {
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

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  body: { padding: 16, gap: 10 },
  vibe: { fontSize: 18, fontStyle: 'italic', color: '#1A1A1A', fontWeight: '400' },
  notes: { fontSize: 13, color: '#8C8C8C', lineHeight: 20 },
  toggle: { paddingVertical: 2 },
  toggleLabel: { fontSize: 12, color: '#C9A99A', fontWeight: '600' },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  trend: { fontSize: 11, color: '#8C8C8C', fontStyle: 'italic' },
  saveBtn: { paddingVertical: 10, paddingHorizontal: 16 },
});
