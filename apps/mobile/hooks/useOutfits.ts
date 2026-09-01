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
