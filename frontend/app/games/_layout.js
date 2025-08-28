import { Stack } from 'expo-router';

export default function GamesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="bingo" options={{ title: 'Bingo' }} />
      {/* Aquí se pueden agregar más juegos en el futuro */}
    </Stack>
  );
}
