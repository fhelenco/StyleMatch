import React, { useEffect, useRef } from 'react';
import { Modal, Platform, Text, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '../../contexts/theme';
import type { ThemeColors } from '../../lib/theme';

export interface ActionSheetOption {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  destructive?: boolean;
  onPress: () => void;
}

interface ActionSheetProps {
  visible: boolean;
  title?: string;
  options: ActionSheetOption[];
  onClose: () => void;
  /**
   * Fires once the sheet has fully closed. Use this to launch anything that
   * presents its own native UI (image picker, share sheet) — doing so while
   * this modal is still on screen is a no-op on iOS.
   */
  onDismissed?: () => void;
}

/**
 * Bottom action sheet. Renders inside the app (not a native/browser dialog), so
 * it works on native, web, and inside sandboxed previews.
 */
export function ActionSheet({ visible, title, options, onClose, onDismissed }: ActionSheetProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  // `Modal.onDismiss` is iOS-only, so emulate it elsewhere once `visible` flips
  // false. The ref guards against firing on the initial mount.
  const wasVisible = useRef(visible);
  useEffect(() => {
    const closed = wasVisible.current && !visible;
    wasVisible.current = visible;
    if (closed && Platform.OS !== 'ios') {
      const id = setTimeout(() => onDismissed?.(), 80);
      return () => clearTimeout(id);
    }
  }, [visible, onDismissed]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      onDismiss={Platform.OS === 'ios' ? onDismissed : undefined}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          {!!title && <Text style={styles.title}>{title}</Text>}
          {options.map((opt, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.row, i > 0 && styles.rowBorder]}
              onPress={opt.onPress}
              activeOpacity={0.7}
            >
              {opt.icon && (
                <Ionicons
                  name={opt.icon}
                  size={20}
                  color={opt.destructive ? colors.danger : colors.foreground}
                />
              )}
              <Text style={[styles.rowText, opt.destructive && styles.rowTextDestructive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={styles.cancel} onPress={onClose} activeOpacity={0.7}>
            <Text style={styles.cancelText}>Cancel</Text>
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
      justifyContent: 'flex-end',
      padding: 12,
    },
    sheet: {
      backgroundColor: c.surface,
      borderRadius: 20,
      paddingVertical: 6,
      marginBottom: 8,
      shadowColor: '#000',
      shadowOpacity: 0.18,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 8 },
      elevation: 8,
    },
    title: {
      fontSize: 12,
      fontWeight: '600',
      color: c.muted,
      letterSpacing: 1,
      textTransform: 'uppercase',
      textAlign: 'center',
      paddingVertical: 12,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      paddingVertical: 18,
      paddingHorizontal: 24,
    },
    rowBorder: {
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    rowText: {
      fontSize: 16,
      color: c.foreground,
      fontWeight: '500',
    },
    rowTextDestructive: {
      color: c.danger,
    },
    cancel: {
      marginTop: 6,
      paddingVertical: 18,
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    cancelText: {
      fontSize: 16,
      fontWeight: '700',
      color: c.muted,
    },
  });
