// Versión de debug para identificar el problema de stack overflow
import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";

export default function GameDebug() {
  console.log("🐛 GameDebug renderizando...");

  const params = useLocalSearchParams();
  const [state, setState] = useState({
    roomId: null,
    players: [],
  });

  useEffect(() => {
    console.log("🐛 useEffect básico ejecutándose");
    // Aquí podríamos probar uno por uno los useEffect del GameScreen original
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#2c3e50" }}>
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
      >
        <Text style={{ color: "white", fontSize: 24, marginBottom: 20 }}>
          🐛 Debug Mode
        </Text>
        <Text
          style={{
            color: "white",
            fontSize: 16,
            textAlign: "center",
            marginBottom: 20,
          }}
        >
          Room ID: {params.roomId}
        </Text>
        <Text
          style={{
            color: "white",
            fontSize: 16,
            textAlign: "center",
            marginBottom: 40,
          }}
        >
          Si ves esto sin errores, el problema no está en la estructura básica.
        </Text>

        <TouchableOpacity
          onPress={() => {
            router.replace("/gameSelect");
          }}
          style={{
            backgroundColor: "#e74c3c",
            padding: 15,
            borderRadius: 10,
          }}
        >
          <Text style={{ color: "white", fontSize: 18, fontWeight: "bold" }}>
            Volver a Game Select
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
