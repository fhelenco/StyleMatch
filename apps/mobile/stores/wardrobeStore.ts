import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ColorSwatch {
  name: string;
  hex: string;
}

export interface ClothingItem {
  id: string;
  user_id: string;
  label: string;
  garment_type: string;
  category: 'tops' | 'bottoms' | 'shoes' | 'accessories' | 'outerwear';
  style_category?: string;
  pattern?: string;
  fabric?: string;
  season?: string;
  colors: ColorSwatch[];
  image_url: string;
  image_path: string;
  times_worn: number;
  last_worn_at?: string;
  notes?: string;
  created_at: string;
}

interface WardrobeState {
  items: ClothingItem[];
  setItems: (items: ClothingItem[]) => void;
  addItem: (item: ClothingItem) => void;
  updateItem: (item: ClothingItem) => void;
  removeItem: (id: string) => void;
  hydrate: () => Promise<void>;
}

const STORAGE_KEY = 'stylematch_wardrobe';

export const useWardrobeStore = create<WardrobeState>((set, get) => ({
  items: [],

  setItems: async (items) => {
    set({ items });
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  },

  addItem: async (item) => {
    const items = [item, ...get().items];
    set({ items });
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  },

  updateItem: async (item) => {
    const items = get().items.map((i) => (i.id === item.id ? { ...i, ...item } : i));
    set({ items });
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  },

  removeItem: async (id) => {
    const items = get().items.filter((i) => i.id !== id);
    set({ items });
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  },

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) set({ items: JSON.parse(raw) as ClothingItem[] });
    } catch {}
  },
}));
