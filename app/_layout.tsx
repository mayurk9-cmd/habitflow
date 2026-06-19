import { useEffect, useRef } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StoreProvider, useStore } from '../hooks/useStore';
import { useAuth } from '../hooks/useAuth';
import { initSound } from '../utils/sound';
import { requestNotificationPermissions, scheduleDailyReminders } from '../utils/notifications';

function RootNavigator() {
  const { loading: authLoading, session } = useAuth();
  const { loading: storeLoading, hasOnboarded } = useStore();
  const router = useRouter();
  const segments = useSegments();
  const ready = !authLoading && !storeLoading;
  const didRoute = useRef(false);

  useEffect(() => {
    if (!ready) return;

    const inAuth       = segments[0] === 'auth';
    const inOnboarding = segments[0] === 'onboarding';

    if (!session) {
      // No user → auth screen
      if (!inAuth) router.replace('/auth');
    } else if (!hasOnboarded) {
      // Logged in but not yet onboarded
      if (!inOnboarding) router.replace('/onboarding');
    } else {
      // Fully set up → home
      if (inAuth || inOnboarding) router.replace('/');
    }

    didRoute.current = true;
  }, [ready, session, hasOnboarded]);

  useEffect(() => {
    initSound();
    requestNotificationPermissions().then((granted) => {
      if (granted) scheduleDailyReminders();
    });
  }, []);

  return (
    <Stack>
      <Stack.Screen name="(tabs)"      options={{ headerShown: false }} />
      <Stack.Screen name="auth"        options={{ headerShown: false }} />
      <Stack.Screen name="onboarding"  options={{ headerShown: false, presentation: 'fullScreenModal' }} />
      <Stack.Screen name="add-habit"   options={{ headerShown: false, presentation: 'modal' }} />
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
