import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '../../contexts/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
}: ButtonProps) {
  const { colors } = useTheme();

  const base: ViewStyle = {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  };

  const variants: Record<string, ViewStyle> = {
    primary: { backgroundColor: colors.foreground },
    secondary: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.border },
    ghost: { backgroundColor: 'transparent' },
    danger: { backgroundColor: 'transparent' },
  };

  const textVariants: Record<string, TextStyle> = {
    primary: { color: colors.onForeground, fontSize: 15, fontWeight: '600' },
    secondary: { color: colors.foreground, fontSize: 15, fontWeight: '600' },
    ghost: { color: colors.foreground, fontSize: 15, fontWeight: '400' },
    danger: { color: colors.danger, fontSize: 15, fontWeight: '600' },
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
      style={[base, variants[variant], disabled && { opacity: 0.5 }, style]}
    >
      {loading && (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? colors.onForeground : colors.foreground}
        />
      )}
      <Text style={[textVariants[variant], textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
}
