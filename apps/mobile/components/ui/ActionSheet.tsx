import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
}

/**
 * Bottom action sheet. Renders inside the app (not a native/browser dialog), so
 * it works on native, web, and inside sandboxed previews.
 */
export function ActionSheet({ visible, title, options, onClose }: ActionSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
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
                  color={opt.destructive ? '#B4483C' : '#1A1A1A'}
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

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(26,26,26,0.45)',
    justifyContent: 'flex-end',
    padding: 12,
  },
  sheet: {
    backgroundColor: '#FFFFFF',
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
    color: '#8C8C8C',
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
    borderTopColor: '#F0EBE7',
  },
  rowText: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  rowTextDestructive: {
    color: '#B4483C',
  },
  cancel: {
    marginTop: 6,
    paddingVertical: 18,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0EBE7',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8C8C8C',
  },
});
