import { useEffect, useState, useMemo } from "react";
import { View, Text, TouchableOpacity, FlatList, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSocket } from "../src/shared/hooks";

const labels = {
  corners: "Esquinas",
  row: "Línea",
  column: "Columna",
  diagonal: "Diagonal",
  border: "Contorno",
  full: "Cartón lleno",
};

export default function Summary() {
  const { roomId } = useLocalSearchParams();
  const { socket, isConnected, socketId } = useSocket(); // 🆕 Usar el hook
  const [state, setState] = useState({
    players: [],
    figuresClaimed: {},
    hostId: null,
  });

  useEffect(() => {
    const onState = (s) => {
      if (!roomId || s.roomId === roomId) setState(s);
    };
    socket.on("state", onState);
    socket.emit("getState", { roomId });
    return () => socket.off("state", onState);
  }, [roomId]);

  const playersMap = useMemo(
    () => Object.fromEntries((state.players || []).map((p) => [p.id, p])),
    [state.players]
  );
  const items = useMemo(
    () => Object.entries(state.figuresClaimed || {}),
    [state.figuresClaimed]
  );

  const playAgain = () => {
    // Host reinicia la partida con la misma configuración
    socket.emit("startGame", { roomId });
    // Ir al juego con roomId en la URL
    router.replace(`/games/bingo/${roomId}`);
  };

  const renderItem = ([key, pid]) => {
    const p = playersMap[pid];
    return (
      <View
        key={key}
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 12,
          borderRadius: 12,
          marginBottom: 10,
          backgroundColor: "#ffffff",
          shadowColor: "#000",
          shadowOpacity: 0.06,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 3 },
          elevation: 3,
        }}
      >
        {p?.avatarUrl ? (
          <Image
            source={{ uri: p.avatarUrl }}
            style={{ width: 36, height: 36, borderRadius: 18, marginRight: 10 }}
          />
        ) : (
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              marginRight: 10,
              backgroundColor: "#3498db",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "white", fontWeight: "700" }}>
              {p?.name?.[0]?.toUpperCase() || "?"}
            </Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View
              style={{
                paddingHorizontal: 10,
                paddingVertical: 4,
                backgroundColor: "#ecf0f1",
                borderRadius: 10,
                marginRight: 8,
              }}
            >
              <Text
                style={{ fontWeight: "700", color: "#2c3e50", fontSize: 12 }}
              >
                {labels[key] || key}
              </Text>
            </View>
            <Text style={{ color: "#7f8c8d", fontSize: 12 }}>ganado por</Text>
          </View>
          <Text
            style={{
              marginTop: 2,
              fontWeight: "700",
              color: "#2c3e50",
              fontSize: 14,
            }}
          >
            {p?.name || "—"}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f5f7fa" }}>
      <View style={{ flex: 1, padding: 16 }}>
        <View style={{ alignItems: "center", marginBottom: 12 }}>
          <Text style={{ fontSize: 24, fontWeight: "800", color: "#2c3e50" }}>
            Resumen de la partida
          </Text>
          <Text style={{ marginTop: 4, color: "#7f8c8d" }}>
            Resultados y ganadores por figura
          </Text>
        </View>

        <View style={{ flex: 1 }}>
          {items.length === 0 ? (
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "#7f8c8d" }}>
                Aún no hay figuras reclamadas
              </Text>
            </View>
          ) : (
            <FlatList
              data={items}
              keyExtractor={([k]) => k}
              renderItem={({ item }) => renderItem(item)}
              contentContainerStyle={{ paddingBottom: 16 }}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

        <View style={{ flexDirection: "row", marginTop: 8 }}>
          <TouchableOpacity
            onPress={() => {
              socket.emit("leaveRoom");
              router.replace("/rooms");
            }}
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              padding: 14,
              borderRadius: 14,
              backgroundColor: "#ecf0f1",
              marginRight: 8,
            }}
          >
            <Ionicons name="exit-outline" size={18} color="#7f8c8d" />
            <Text
              style={{ color: "#7f8c8d", fontWeight: "700", marginLeft: 8 }}
            >
              Salir
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={playAgain}
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              padding: 14,
              borderRadius: 14,
              backgroundColor: "#27ae60",
              marginLeft: 8,
              shadowColor: "#27ae60",
              shadowOpacity: 0.25,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 4 },
              elevation: 7,
            }}
          >
            <Ionicons name="refresh" size={18} color="#fff" />
            <Text style={{ color: "white", fontWeight: "800", marginLeft: 8 }}>
              Jugar nuevamente
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
