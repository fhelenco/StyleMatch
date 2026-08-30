import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/api';
import { ClothingItem, useWardrobeStore } from '../stores/wardrobeStore';

export function useWardrobe() {
  const setItems = useWardrobeStore((s) => s.setItems);

  // Always fetch the complete wardrobe so the store holds every piece.
  // Category filtering is done client-side in the screen — fetching a filtered
  // list here would overwrite the store and make empty categories look like an
  // empty wardrobe.
  return useQuery<ClothingItem[]>({
    queryKey: ['wardrobe'],
    queryFn: async () => {
      const data = await apiRequest<ClothingItem[]>('/api/wardrobe');
      setItems(data);
      return data;
    },
  });
}

export function useClothingItem(id: string) {
  return useQuery<ClothingItem>({
    queryKey: ['wardrobe', id],
    queryFn: () => apiRequest<ClothingItem>(`/api/wardrobe/${id}`),
    enabled: !!id,
  });
}

export function useUpdateItem() {
  const queryClient = useQueryClient();
  const updateItem = useWardrobeStore((s) => s.updateItem);

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<ClothingItem> }) =>
      apiRequest<ClothingItem>(`/api/wardrobe/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      }),
    onSuccess: (data) => {
      updateItem(data);
      queryClient.invalidateQueries({ queryKey: ['wardrobe'] });
    },
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();
  const removeItem = useWardrobeStore((s) => s.removeItem);

  return useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/api/wardrobe/${id}`, { method: 'DELETE' }),
    onSuccess: (_data, id) => {
      removeItem(id);
      queryClient.invalidateQueries({ queryKey: ['wardrobe'] });
    },
  });
}
