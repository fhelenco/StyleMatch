import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useTheme, useThemedStyles } from '../../contexts/theme';
import type { ThemeColors } from '../../lib/theme';

interface PromptDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  placeholder?: string;
  initialValue?: string;
  maxLength?: number;
  confirmLabel?: string;
  cancelLabel?: string;
  saving?: boolean;
  onCancel: () => void;
  onConfirm: (value: string) => void;
}

/**
 * In-app text-input dialog (rename, edit a single field, etc.) — same visual
 * language as ConfirmDialog, but with a TextInput instead of just a message.
 */
export function PromptDialog({
  visible,
  title,
  message,
  placeholder,
  initialValue = '',
  maxLength = 50,
  confirmLabel = 'Save',
  cancelLabel = 'Cancel',
  saving = false,
  onCancel,
  onConfirm,
}: PromptDialogProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [value, setValue] = useState(initialValue);

  // Reset the field to the current value each time the dialog opens.
  useEffect(() => {
    if (visible) setValue(initialValue);
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const trimmed = value.trim();
  const canSave = trimmed.length > 0 && !saving;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.title}>{title}</Text>
          {!!message && <Text style={styles.message}>{message}</Text>}

          <TextInput
            style={styles.input}
            value={value}
            onChangeText={setValue}
            placeholder={placeholder}
            placeholderTextColor={colors.muted}
            maxLength={maxLength}
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
            editable={!saving}
          />

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} activeOpacity={0.8}>
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmBtn, !canSave && styles.confirmBtnDisabled]}
              onPress={() => canSave && onConfirm(trimmed)}
              activeOpacity={0.85}
              disabled={!canSave}
            >
              {saving ? (
                <ActivityIndicator color={colors.onAccent} size="small" />
              ) : (
                <Text style={styles.confirmText}>{confirmLabel}</Text>
              )}
            </TouchableOpacity>
          </View>
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
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
    },
    card: {
      width: '100%',
      maxWidth: 340,
      backgroundColor: c.surface,
      borderRadius: 20,
      padding: 24,
      gap: 8,
      shadowColor: '#000',
      shadowOpacity: 0.18,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 8 },
      elevation: 8,
    },
    title: {
      fontSize: 20,
      fontFamily: 'PlayfairDisplay_700Bold',
      color: c.foreground,
    },
    message: {
      fontSize: 14,
      color: c.muted,
      lineHeight: 21,
    },
    input: {
      marginTop: 14,
      backgroundColor: c.surfaceAlt,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      color: c.foreground,
      borderWidth: 1.5,
      borderColor: c.border,
    },
    actions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 20,
    },
    cancelBtn: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    cancelText: {
      fontSize: 13,
      fontWeight: '700',
      color: c.foreground,
      letterSpacing: 0.5,
    },
    confirmBtn: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: c.accent,
    },
    confirmBtnDisabled: {
      backgroundColor: c.border,
    },
    confirmText: {
      fontSize: 13,
      fontWeight: '700',
      color: c.onAccent,
      letterSpacing: 0.5,
    },
  });
