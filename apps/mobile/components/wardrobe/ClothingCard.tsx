import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ColorSwatch } from '../ui/ColorSwatch';
import { ClothingItem } from '../../stores/wardrobeStore';

interface ClothingCardProps {
  item: ClothingItem;
  onPress: () => void;
  width: number;
}

export function ClothingCard({ item, onPress, width }: ClothingCardProps) {
  const height = width * (4 / 3);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={[styles.card, { width, height }]}
    >
      <Image
        source={{ uri: item.image_url }}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      />
      <LinearGradient
        colors={['transparent', 'rgba(26,26,26,0.85)']}
        style={styles.gradient}
      >
        <Text style={styles.label} numberOfLines={1}>
          {item.label}
        </Text>
        <View style={styles.bottom}>
          <ColorSwatch colors={item.colors} size={12} />
          <Text style={styles.type}>{item.garment_type}</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F5F0ED',
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 10,
    paddingTop: 32,
    paddingBottom: 10,
    gap: 4,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  bottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  type: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    textTransform: 'capitalize',
  },
});
