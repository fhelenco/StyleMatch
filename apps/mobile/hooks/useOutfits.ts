import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/api';

export interface OutfitSuggestion {
  item_ids: string[];
  cohesion_score: number;
  occasion: string;
  season: string;
  style_vibe: string;
  style_notes: string;
  trend_note: string;
}

export interface SavedOutfit {
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
  items?: unknown[];
}

export function useSuggestOutfits(anchorItemId: string | null) {
  return useQuery<OutfitSuggestion[]>({
    queryKey: ['suggestions', anchorItemId],
    // The backend route is POST /api/outfits/suggest/:id — a GET here 404s.
    queryFn: () =>
      apiRequest<OutfitSuggestion[]>(`/api/outfits/suggest/${anchorItemId}`, {
        method: 'POST',
      }),
    enabled: !!anchorItemId,
    staleTime: 5 * 60 * 1000,
    // AI/network failures here aren't transient — retrying just delays
    // showing the error state for no benefit.
    retry: 1,
  });
}

export function useSuggestOutfitsByOccasion() {
  return useMutation<
    OutfitSuggestion[],
    Error,
    { occasion: string; season?: string; anchor_item_id?: string }
  >({
    mutationFn: (body) =>
      apiRequest<OutfitSuggestion[]>('/api/outfits/suggest-by-occasion', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  });
}

export function useSavedOutfits() {
  return useQuery<SavedOutfit[]>({
    queryKey: ['outfits'],
    queryFn: () => apiRequest<SavedOutfit[]>('/api/outfits'),
  });
}

export function useOutfitDetail(id: string) {
  return useQuery<SavedOutfit>({
    queryKey: ['outfits', id],
    queryFn: () => apiRequest<SavedOutfit>(`/api/outfits/${id}`),
    enabled: !!id,
  });
}

export interface SwapPieceResult {
  item: {
    id: string;
    user_id: string;
    label: string;
    garment_type: string;
    category: 'tops' | 'bottoms' | 'shoes' | 'accessories' | 'outerwear';
    style_category?: string;
    pattern?: string;
    fabric?: string;
    season?: string;
    colors: { name: string; hex: string }[];
    image_url: string;
    image_path: string;
    times_worn: number;
    last_worn_at?: string;
    notes?: string;
    created_at: string;
  };
  cohesion_score: number;
  style_notes: string;
}

export function useSwapPiece() {
  return useMutation<
    SwapPieceResult,
    Error,
    {
      keep_item_ids: string[];
      exclude_item_id: string;
      category: string;
      occasion: string;
      season?: string;
    }
  >({
    mutationFn: (body) =>
      apiRequest<SwapPieceResult>('/api/outfits/swap-piece', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  });
}

export function useSaveOutfit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiRequest<SavedOutfit>('/api/outfits', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outfits'] });
    },
  });
}

export function useDeleteOutfit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/api/outfits/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outfits'] });
    },
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, is_favorite }: { id: string; is_favorite: boolean }) =>
      apiRequest(`/api/outfits/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_favorite }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outfits'] });
    },
  });
}
