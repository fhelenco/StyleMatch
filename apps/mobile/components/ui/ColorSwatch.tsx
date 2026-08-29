import React from 'react';
import { View, StyleSheet } from 'react-native';

interface ColorSwatchProps {
  colors: Array<{ name: string; hex: string }>;
  size?: number;
}

export function ColorSwatch({ colors, size = 16 }: ColorSwatchProps) {
  return (
    <View style={styles.row}>
      {colors.slice(0, 3).map((color, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: color.hex,
              marginLeft: i > 0 ? -size * 0.3 : 0,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  dot: { borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.8)' },
});
