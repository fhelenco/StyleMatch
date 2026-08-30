import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Local cache only — the source of truth is the `profiles` table in Supabase,
// synced via hooks/useProfile.ts. This store just lets the avatar paint
// instantly on app launch before the network request resolves.
interface ProfileState {
  avatarUri: string | null;
  setAvatar: (uri: string | null) => void;
  hydrate: () => Promise<void>;
}

const STORAGE_KEY = 'stylematch_profile_avatar';

export const useProfileStore = create<ProfileState>((set) => ({
  avatarUri: null,

  setAvatar: async (uri) => {
    set({ avatarUri: uri });
    try {
      if (uri) await AsyncStorage.setItem(STORAGE_KEY, uri);
      else await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {}
  },

  hydrate: async () => {
    try {
      const uri = await AsyncStorage.getItem(STORAGE_KEY);
      if (uri) set({ avatarUri: uri });
    } catch {}
  },
}));
