import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { ClothingItem } from '../../stores/wardrobeStore';

interface MoodBoardProps {
  items: ClothingItem[];
  square?: boolean;
}

export function MoodBoard({ items, square }: MoodBoardProps) {
  const visible = items.slice(0, 4);
  const count = visible.length;

  const containerStyle = [styles.container, square && styles.square];

  if (count === 0) return null;
  if (count === 1) {
    return (
      <View style={containerStyle}>
        <Image source={{ uri: visible[0].image_url }} style={styles.full} resizeMode="cover" />
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      <View style={styles.grid}>
        {visible.map((item, i) => (
          <Image
            key={i}
            source={{ uri: item.image_url }}
            style={[styles.thumb, count === 2 && styles.half, count === 3 && i === 0 && styles.half]}
            resizeMode="cover"
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', aspectRatio: 16 / 9, borderRadius: 12, overflow: 'hidden' } as any,
  square: { aspectRatio: 1 },
  full: { width: '100%', height: '100%' },
  grid: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 2 },
  thumb: { width: '49%', height: '100%' },
  half: { width: '49%' },
});
