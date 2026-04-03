import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { Platform } from 'react-native';
import { seedDefaultCat } from '@/utils/database';
import { useAppStore } from '@/stores/appStore';
import { initPurchases, refreshProStatus } from '@/utils/purchases';
import { setupNotificationHandler } from '@/utils/notifications';
import AnimatedSplash from '@/components/AnimatedSplash';
import '@/i18n';

// Set up foreground notification handler early
setupNotificationHandler();

if (Platform.OS !== 'web') {
  SplashScreen.preventAutoHideAsync();
}

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);
  const [splashDone, setSplashDone] = useState(false);
  const setActiveCatId = useAppStore((s) => s.setActiveCatId);

  const [fontsLoaded] = useFonts({
    'Inter-Regular': require('../assets/fonts/Inter-Regular.ttf'),
    'Inter-Medium': require('../assets/fonts/Inter-Medium.ttf'),
    'Inter-SemiBold': require('../assets/fonts/Inter-SemiBold.ttf'),
    'Inter-Bold': require('../assets/fonts/Inter-Bold.ttf'),
  });

  useEffect(() => {
    async function prepare() {
      try {
        const catId = await seedDefaultCat();
        setActiveCatId(catId);
      } catch (e) {
        console.warn('DB seed error:', e);
      }

      try {
        await initPurchases();
        await refreshProStatus();
      } catch (e) {
        console.warn('RevenueCat init failed:', (e as Error).message);
      }

      setAppReady(true);
    }
    prepare();
  }, []);

  useEffect(() => {
    if (fontsLoaded && appReady && Platform.OS !== 'web') {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, appReady]);

  if (!fontsLoaded || !appReady) return null;

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#FFF8F0' },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="log"
          options={{
            presentation: 'transparentModal',
            gestureEnabled: true,
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="paywall"
          options={{
            presentation: 'modal',
            gestureEnabled: true,
          }}
        />
      </Stack>
      {!splashDone && <AnimatedSplash onFinish={() => setSplashDone(true)} />}
    </>
  );
}
