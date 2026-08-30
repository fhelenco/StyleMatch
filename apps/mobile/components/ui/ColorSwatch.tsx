import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/theme';

interface ColorSwatchProps {
  colors: Array<{ name: string; hex: string }>;
  size?: number;
}

export function ColorSwatch({ colors: swatches, size = 16 }: ColorSwatchProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      {swatches.slice(0, 3).map((color, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: color.hex,
              borderColor: colors.surface,
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
  dot: { borderWidth: 1.5 },
});
