import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ThemeMode } from '../lib/theme';

/**
 * Local, instantly-available copy of the user's theme choice so the app paints
 * in the right theme on launch (before the profile query resolves, and offline).
 * The Supabase `profiles.preferred_theme` column is the source of truth —
 * contexts/theme.tsx reconciles this store with it.
 */
interface ThemeState {
  mode: ThemeMode;
  hydrated: boolean;
  setMode: (mode: ThemeMode) => void;
  hydrate: () => Promise<void>;
}

const STORAGE_KEY = 'stylematch_theme_mode';

export const useThemeStore = create<ThemeState>((set) => ({
  mode: 'system',
  hydrated: false,

  setMode: (mode) => {
    set({ mode });
    AsyncStorage.setItem(STORAGE_KEY, mode).catch(() => {});
  },

  hydrate: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        set({ mode: stored, hydrated: true });
        return;
      }
    } catch {}
    set({ hydrated: true });
  },
}));
