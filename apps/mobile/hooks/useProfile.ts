import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest, apiUpload } from '../lib/api';
import { uriToFormData } from '../lib/imageUtils';
import { useProfileStore } from '../stores/profileStore';

export interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  preferred_language: string | null;
  preferred_theme: 'system' | 'light' | 'dark' | null;
  home_city: string | null;
  created_at: string;
}

export function useProfile() {
  const setAvatar = useProfileStore((s) => s.setAvatar);

  return useQuery<Profile>({
    queryKey: ['profile'],
    queryFn: async () => {
      const data = await apiRequest<Profile>('/api/profile');
      // Keep the local cache in sync so the avatar paints instantly on next launch.
      setAvatar(data.avatar_url);
      return data;
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      updates: Partial<Pick<Profile, 'username' | 'preferred_language' | 'preferred_theme' | 'home_city'>>
    ) => apiRequest<Profile>('/api/profile', { method: 'PATCH', body: JSON.stringify(updates) }),
    onSuccess: (data) => {
      queryClient.setQueryData(['profile'], data);
    },
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();
  const setAvatar = useProfileStore((s) => s.setAvatar);

  return useMutation({
    mutationFn: async (uri: string) => {
      const formData = await uriToFormData(uri);
      return apiUpload<Profile>('/api/profile/avatar', formData);
    },
    onSuccess: (data) => {
      setAvatar(data.avatar_url);
      queryClient.setQueryData(['profile'], data);
    },
  });
}

export function useRemoveAvatar() {
  const queryClient = useQueryClient();
  const setAvatar = useProfileStore((s) => s.setAvatar);

  return useMutation({
    mutationFn: () => apiRequest<Profile>('/api/profile/avatar', { method: 'DELETE' }),
    onSuccess: (data) => {
      setAvatar(data.avatar_url);
      queryClient.setQueryData(['profile'], data);
    },
  });
}
