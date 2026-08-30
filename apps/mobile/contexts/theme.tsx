import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { Appearance, useColorScheme } from 'react-native';
import {
  colorsFor,
  type ColorScheme,
  type ThemeColors,
  type ThemeMode,
} from '../lib/theme';
import { useThemeStore } from '../stores/themeStore';
import { useProfile, useUpdateProfile } from '../hooks/useProfile';

interface ThemeContextValue {
  colors: ThemeColors;
  /** the resolved scheme actually in effect */
  scheme: ColorScheme;
  /** the user's preference: 'system' | 'light' | 'dark' */
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const mode = useThemeStore((s) => s.mode);
  const setStoreMode = useThemeStore((s) => s.setMode);
  const { data: profile } = useProfile();
  const { mutate: updateProfile } = useUpdateProfile();

  // Adopt the server value once it arrives (DB is the source of truth).
  const lastSynced = useRef<ThemeMode | null>(null);
  useEffect(() => {
    const serverMode = profile?.preferred_theme;
    if (serverMode && serverMode !== lastSynced.current && serverMode !== mode) {
      lastSynced.current = serverMode;
      setStoreMode(serverMode);
    }
  }, [profile?.preferred_theme, mode, setStoreMode]);

  const scheme: ColorScheme =
    mode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode;

  // Keep native surfaces (Alert, ActionSheet, keyboard, refresh control) in step
  // with the in-app choice. `null` hands control back to the OS.
  // react-native-web doesn't implement Appearance.setColorScheme, so guard it —
  // without this the whole app crashes on web before it can even render.
  useEffect(() => {
    if (typeof Appearance.setColorScheme === 'function') {
      Appearance.setColorScheme(mode === 'system' ? null : mode);
    }
  }, [mode]);

  const setMode = useCallback(
    (next: ThemeMode) => {
      lastSynced.current = next;
      setStoreMode(next);
      updateProfile({ preferred_theme: next });
    },
    [setStoreMode, updateProfile],
  );

  const value = useMemo<ThemeContextValue>(
    () => ({ colors: colorsFor(scheme), scheme, mode, setMode }),
    [scheme, mode, setMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within <ThemeProvider>');
  return ctx;
}

/** Build a themed StyleSheet once per palette change. */
export function useThemedStyles<T>(factory: (colors: ThemeColors) => T): T {
  const { colors } = useTheme();
  return useMemo(() => factory(colors), [colors, factory]);
}
