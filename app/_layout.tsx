import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StoreProvider, useStore } from '../hooks/useStore';
import { initSound } from '../utils/sound';
import { requestNotificationPermissions, scheduleDailyReminders } from '../utils/notifications';

function RootNavigator() {
  const { loading, hasOnboarded } = useStore();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;
    const inOnboarding = segments[0] === 'onboarding';
    if (!hasOnboarded && !inOnboarding) {
      router.replace('/onboarding');
    } else if (hasOnboarded && inOnboarding) {
      router.replace('/');
    }
  }, [loading, hasOnboarded]);

  useEffect(() => {
    initSound();
    requestNotificationPermissions().then((granted) => {
      if (granted) scheduleDailyReminders();
    });
  }, []);

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
      <Stack.Screen name="add-habit" options={{ headerShown: false, presentation: 'modal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <StoreProvider>
      <RootNavigator />
    </StoreProvider>
  );
}
