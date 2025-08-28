import { Stack } from 'expo-router';
import { useFonts, Montserrat_400Regular, Montserrat_500Medium, Montserrat_600SemiBold, Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import { Mukta_400Regular, Mukta_700Bold, Mukta_600SemiBold } from '@expo-google-fonts/mukta';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import * as Updates from 'expo-updates';
import { ActivityIndicator, View, Text } from 'react-native';
import { purgeLegacyAvatarCache, cleanOldCache } from '../src/services/avatarCache';

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


  // Estado para actualización OTA
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState(null);

  useEffect(() => {
    // Al cargar fuentes, buscar update si corresponde
    const checkAndUpdate = async () => {
      if (!fontsLoaded) return;
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          setIsUpdating(true);
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        } else {
          SplashScreen.hideAsync();
        }
      } catch (e) {
        setUpdateError(e?.message || 'Error de actualización');
        SplashScreen.hideAsync();
      }
    };
    checkAndUpdate();
  }, [fontsLoaded]);

  // Purga global del caché legado al arrancar para evitar SQLITE_FULL
  useEffect(() => {
    (async () => {
      try {
        await purgeLegacyAvatarCache();
        await cleanOldCache();
      } catch {}
    })();
  }, []);


  if (!fontsLoaded || isUpdating) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#2c3e50' }}>
        <ActivityIndicator size="large" color="#e74c3c" />
        <Text style={{ color: 'white', marginTop: 16, fontSize: 18, fontWeight: '700', fontFamily: 'Montserrat_700Bold' }}>
          {isUpdating ? 'Actualizando app...' : 'Cargando...'}
        </Text>
        {updateError && (
          <Text style={{ color: '#e74c3c', marginTop: 12, fontSize: 14, textAlign: 'center' }}>{updateError}</Text>
        )}
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="gameSelect" options={{ headerShown: false }} />
      <Stack.Screen name="games" options={{ headerShown: false }} />
      <Stack.Screen name="profile" options={{ headerShown: false }} />
      <Stack.Screen name="lobby" options={{ title: 'Lobby' }} />
      <Stack.Screen name="rooms" options={{ headerShown: false }} />
      <Stack.Screen name="waiting" options={{ headerShown: false }} />
      <Stack.Screen name="summary" options={{ title: 'Resumen' }} />
      <Stack.Screen name="leaderboard" options={{ headerShown: false }} />
    </Stack>
  );
}
