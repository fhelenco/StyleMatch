import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/api';
import { ClothingItem, useWardrobeStore } from '../stores/wardrobeStore';

export function useWardrobe(category?: string) {
  const setItems = useWardrobeStore((s) => s.setItems);
  const path = category && category !== 'all'
    ? `/api/wardrobe?category=${category}`
    : '/api/wardrobe';

  return useQuery<ClothingItem[]>({
    queryKey: ['wardrobe', category],
    queryFn: async () => {
      const data = await apiRequest<ClothingItem[]>(path);
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
