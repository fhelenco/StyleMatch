import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';

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
    primary: { backgroundColor: '#1A1A1A' },
    secondary: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: '#E8E2DE' },
    ghost: { backgroundColor: 'transparent' },
    danger: { backgroundColor: 'transparent' },
  };

  const textVariants: Record<string, TextStyle> = {
    primary: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
    secondary: { color: '#1A1A1A', fontSize: 15, fontWeight: '600' },
    ghost: { color: '#1A1A1A', fontSize: 15, fontWeight: '400' },
    danger: { color: '#E05C5C', fontSize: 15, fontWeight: '600' },
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
      style={[base, variants[variant], disabled && { opacity: 0.5 }, style]}
    >
      {loading && <ActivityIndicator size="small" color={variant === 'primary' ? '#fff' : '#1A1A1A'} />}
      <Text style={[textVariants[variant], textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
}
