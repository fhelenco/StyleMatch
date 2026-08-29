import React from 'react';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { AuthGuard } from '../components/auth/AuthGuard';
import { useWardrobeStore } from '../stores/wardrobeStore';
import { useEffect } from 'react';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 2 * 60 * 1000 } },
});

export default function RootLayout() {
  const hydrate = useWardrobeStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthGuard>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="add-item" options={{ presentation: 'modal' }} />
          <Stack.Screen name="outfit/[id]" />
        </Stack>
      </AuthGuard>
    </QueryClientProvider>
  );
}
