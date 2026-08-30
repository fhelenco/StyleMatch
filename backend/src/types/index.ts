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

export interface Outfit {
  id: string;
  user_id: string;
  name?: string;
  occasion?: string;
  season?: string;
  style_vibe?: string;
  style_notes?: string;
  trend_note?: string;
  is_favorite: boolean;
  created_at: string;
}

export interface OutfitWithItems extends Outfit {
  items: ClothingItem[];
}

export interface OutfitSuggestion {
  item_ids: string[];
  cohesion_score: number;
  occasion: string;
  season: string;
  style_vibe: string;
  style_notes: string;
  trend_note: string;
}

export interface GarmentAnalysis {
  label: string;
  brand?: string | null;
  garment_type: string;
  category: string;
  collection?: string;
  style_category: string;
  pattern: string;
  fabric: string;
  fabric_care?: string;
  season: string;
  tags?: string[];
  colors: ColorSwatch[];
}

export interface CalendarEntry {
  id: string;
  user_id: string;
  outfit_id?: string;
  worn_date: string;
  notes?: string;
  created_at: string;
}
