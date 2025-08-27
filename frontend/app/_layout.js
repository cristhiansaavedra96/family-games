import { Stack } from 'expo-router';
import { useFonts, Montserrat_400Regular, Montserrat_500Medium, Montserrat_600SemiBold, Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import { Mukta_400Regular, Mukta_700Bold, Mukta_600SemiBold } from '@expo-google-fonts/mukta';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

// Mantener la pantalla de splash hasta que las fuentes estén cargadas
SplashScreen.preventAutoHideAsync();

export default function Layout() {
  const [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
  Mukta_400Regular,
  Mukta_700Bold,
  Mukta_600SemiBold
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="games" options={{ headerShown: false }} />
      <Stack.Screen name="profile" options={{ headerShown: false }} />
      <Stack.Screen name="lobby" options={{ title: 'Lobby' }} />
      <Stack.Screen name="rooms" options={{ headerShown: false }} />
      <Stack.Screen name="waiting" options={{ headerShown: false }} />
  <Stack.Screen name="game" options={{ headerShown: false }} />
      <Stack.Screen name="summary" options={{ title: 'Resumen' }} />
      <Stack.Screen name="leaderboard" options={{ headerShown: false }} />
    </Stack>
  );
}
