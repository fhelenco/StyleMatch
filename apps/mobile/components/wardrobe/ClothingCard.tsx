import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ColorSwatch } from '../ui/ColorSwatch';
import { ClothingItem } from '../../stores/wardrobeStore';
import { useThemedStyles } from '../../contexts/theme';
import type { ThemeColors } from '../../lib/theme';

interface ClothingCardProps {
  item: ClothingItem;
  onPress: () => void;
  width: number;
}

export function ClothingCard({ item, onPress, width }: ClothingCardProps) {
  const styles = useThemedStyles(makeStyles);
  const height = width * (4 / 3);
  const categoryLabel = item.category
    ? item.category.charAt(0).toUpperCase() + item.category.slice(1)
    : item.garment_type;

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

      {/* Category tag top-right */}
      <View style={styles.categoryTag}>
        <Text style={styles.categoryText}>{categoryLabel}</Text>
      </View>

      {/* Bottom gradient overlay */}
      <LinearGradient
        colors={['transparent', 'rgba(26,26,26,0.8)']}
        style={styles.gradient}
      >
        <Text style={styles.label} numberOfLines={1}>
          {item.label}
        </Text>
        <ColorSwatch colors={item.colors} size={12} />
      </LinearGradient>
    </TouchableOpacity>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    card: {
      borderRadius: 16,
      overflow: 'hidden',
      backgroundColor: c.surfaceAlt,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 3,
    },
    // tag + gradient + label sit over the garment photo, so they stay fixed
    categoryTag: {
      position: 'absolute',
      top: 10,
      right: 10,
      backgroundColor: 'rgba(255,255,255,0.85)',
      borderRadius: 20,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    categoryText: {
      fontSize: 10,
      fontWeight: '600',
      color: '#1A1A1A',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    gradient: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      paddingHorizontal: 10,
      paddingTop: 32,
      paddingBottom: 10,
      gap: 6,
    },
    label: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '600',
    },
  });
