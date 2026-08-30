import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { useFonts } from 'expo-font';
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_400Regular_Italic,
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold,
} from '@expo-google-fonts/playfair-display';
import { AuthGuard } from '../components/auth/AuthGuard';
import { ThemeProvider, useTheme } from '../contexts/theme';
import { useWardrobeStore } from '../stores/wardrobeStore';
import { useProfileStore } from '../stores/profileStore';
import { useThemeStore } from '../stores/themeStore';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 2 * 60 * 1000 } },
});

function ThemedApp({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { colors, scheme } = useTheme();

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <AuthGuard>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="add-item" options={{ presentation: 'modal' }} />
          <Stack.Screen name="matching" />
          <Stack.Screen name="item/[id]" />
          <Stack.Screen name="outfit/[id]" />
        </Stack>
      </AuthGuard>
    </View>
  );
}

export default function RootLayout() {
  const hydrate = useWardrobeStore((s) => s.hydrate);
  const hydrateProfile = useProfileStore((s) => s.hydrate);
  const hydrateTheme = useThemeStore((s) => s.hydrate);

  const [fontsLoaded] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_400Regular_Italic,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
  });

  useEffect(() => {
    hydrate();
    hydrateProfile();
    hydrateTheme();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ThemedApp fontsLoaded={fontsLoaded} />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
