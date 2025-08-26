import { Stack } from 'expo-router';
export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="profile" options={{ title: 'Perfil' }} />
      <Stack.Screen name="lobby" options={{ title: 'Lobby' }} />
      <Stack.Screen name="rooms" options={{ title: 'Salas' }} />
      <Stack.Screen name="waiting" options={{ title: 'Sala de espera' }} />
  <Stack.Screen name="game" options={{ headerShown: false }} />
      <Stack.Screen name="summary" options={{ title: 'Resumen' }} />
    </Stack>
  );
}
