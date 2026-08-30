import React, { forwardRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { StyleDna } from '../../lib/styleDna';
import { AestheticRadar } from './AestheticRadar';
import { StyleSpectrum } from './StyleSpectrum';
import { useTheme, useThemedStyles } from '../../contexts/theme';
import type { ThemeColors } from '../../lib/theme';

interface Props {
  dna: StyleDna;
  onSave: () => void;
  saving?: boolean;
}

export const AestheticDnaCard = forwardRef<View, Props>(({ dna, onSave, saving }, ref) => {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.card}>
      <TouchableOpacity
        onPress={onSave}
        disabled={saving}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        style={styles.saveBtn}
        activeOpacity={0.7}
      >
        {saving ? (
          <ActivityIndicator size="small" color={colors.muted} />
        ) : (
          <Ionicons name="download-outline" size={18} color={colors.muted} />
        )}
      </TouchableOpacity>

      {/* Captured region — self-contained so the saved PNG makes sense on its own. */}
      <View ref={ref} collapsable={false} style={styles.capture}>
        <Text style={styles.title}>AESTHETIC DNA</Text>

        <AestheticRadar axes={dna.axes} size={200} />

        <View style={styles.spectrums}>
          <StyleSpectrum leftLabel="STRUCTURED" rightLabel="FLUID" value={dna.structuredFluid} />
          <StyleSpectrum leftLabel="MONOCHROME" rightLabel="VIBRANT" value={dna.monochromeVibrant} />
        </View>

        <Text style={styles.footer}>
          {dna.sampleSize === 0
            ? 'Add pieces to your wardrobe to shape your DNA'
            : `${dna.curatedStyle} · ${dna.sampleSize} ${dna.sampleSize === 1 ? 'piece' : 'pieces'}`}
        </Text>
      </View>
    </View>
  );
});

AestheticDnaCard.displayName = 'AestheticDnaCard';

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: c.surface,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: c.border,
    },
    saveBtn: {
      position: 'absolute',
      top: 14,
      right: 14,
      width: 28,
      height: 28,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2,
    },
    capture: {
      backgroundColor: c.surface,
      alignItems: 'center',
      gap: 18,
      paddingTop: 2,
    },
    title: {
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 2,
      color: c.muted,
      textAlign: 'center',
    },
    spectrums: {
      alignSelf: 'stretch',
      gap: 18,
      paddingHorizontal: 4,
    },
    footer: {
      fontSize: 11,
      color: c.muted,
      textAlign: 'center',
      letterSpacing: 0.3,
    },
  });
