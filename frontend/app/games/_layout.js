import { Stack } from "expo-router";

export default function GamesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="bingo/[roomId]" options={{ title: "Bingo" }} />
      <Stack.Screen name="truco/[roomId]" options={{ title: "Truco" }} />
      {/* Aquí se pueden agregar más juegos en el futuro */}
    </Stack>
  );
}
