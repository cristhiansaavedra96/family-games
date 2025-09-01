import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getAvailableGames } from "../src/games/registry";
import { useStorage } from "../src/shared/hooks";

export default function Games() {
  const { loadItem } = useStorage(); // 🆕 Hook para storage
  const [userAvatar, setUserAvatar] = useState(null);

  // Cargar avatar del usuario
  useEffect(() => {
    loadUserAvatar();
  }, []);

  const loadUserAvatar = async () => {
    try {
      const savedAvatar = await loadItem("profile:avatar");
      if (savedAvatar) {
        setUserAvatar(savedAvatar);
      }
    } catch (error) {
      console.log("Error loading avatar:", error);
    }
  };

  // Obtener juegos disponibles del registro centralizado
  const games = getAvailableGames();

  const selectGame = (gameId) => {
    if (gameId === "bingo") {
      router.push("/rooms");
    }
    // Aquí se pueden agregar más juegos en el futuro
  };

  return (
    <>
      <StatusBar style="light" />
      <View style={{ flex: 1, backgroundColor: "#2c3e50" }}>
        <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>
          <ScrollView
            style={{ flex: 1, backgroundColor: "#f8f9fa" }}
            showsVerticalScrollIndicator={false}
          >
            {/* Header con color sólido oscuro - efecto wave */}
            <View
              style={{
                backgroundColor: "#2c3e50",
                paddingTop: 80,
                paddingBottom: 40,
                paddingHorizontal: 20,
                borderBottomLeftRadius: 30,
                borderBottomRightRadius: 30,
                marginTop: -40,
              }}
            >
              {/* Profile button */}
              <TouchableOpacity
                onPress={() => router.push("/profile")}
                style={{
                  position: "absolute",
                  top: 55,
                  right: 20,
                  width: 50,
                  height: 50,
                  borderRadius: 25,
                  backgroundColor: userAvatar
                    ? "transparent"
                    : "rgba(255,255,255,0.2)",
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: userAvatar ? 3 : 1,
                  borderColor: userAvatar
                    ? "rgba(255,255,255,0.8)"
                    : "rgba(255,255,255,0.3)",
                  shadowColor: "#000",
                  shadowOpacity: userAvatar ? 0.2 : 0,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: userAvatar ? 4 : 0,
                }}
              >
                {userAvatar ? (
                  <Image
                    source={{ uri: userAvatar }}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                    }}
                    resizeMode="cover"
                  />
                ) : (
                  <Ionicons name="person" size={24} color="white" />
                )}
              </TouchableOpacity>

              <View style={{ alignItems: "center" }}>
                <Text
                  style={{
                    fontSize: 32,
                    fontWeight: "800",
                    color: "white",
                    marginBottom: 10,
                    fontFamily: "Montserrat_800ExtraBold",
                  }}
                >
                  Juegos
                </Text>
                <Text
                  style={{
                    fontSize: 16,
                    color: "rgba(255,255,255,0.8)",
                    textAlign: "center",
                    fontFamily: "Montserrat_400Regular",
                  }}
                >
                  Elige tu juego favorito
                </Text>
              </View>
            </View>

            {/* Games Grid */}
            <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
              <View style={{ gap: 20 }}>
                {games.map((game) => (
                  <TouchableOpacity
                    key={game.id}
                    onPress={() => selectGame(game.id)}
                    style={{
                      backgroundColor: "#fff",
                      borderRadius: 24,
                      padding: 24,
                      shadowColor: "#000",
                      shadowOpacity: 0.12,
                      shadowRadius: 16,
                      shadowOffset: { width: 0, height: 8 },
                      elevation: 10,
                      borderWidth: 1,
                      borderColor: "rgba(44, 62, 80, 0.08)",
                    }}
                    activeOpacity={0.7}
                  >
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      {/* Icon */}
                      <View
                        style={{
                          width: 70,
                          height: 70,
                          borderRadius: 35,
                          backgroundColor: game.color,
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: 20,
                          shadowColor: game.color,
                          shadowOpacity: 0.3,
                          shadowRadius: 8,
                          shadowOffset: { width: 0, height: 4 },
                          elevation: 6,
                        }}
                      >
                        <Ionicons name={game.icon} size={32} color="white" />
                      </View>

                      {/* Game Info */}
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 26,
                            fontWeight: "800",
                            color: "#2c3e50",
                            marginBottom: 6,
                            fontFamily: "Montserrat_800ExtraBold",
                          }}
                        >
                          {game.name}
                        </Text>
                        <Text
                          style={{
                            fontSize: 15,
                            color: "#7f8c8d",
                            lineHeight: 22,
                            fontFamily: "Montserrat_500Medium",
                          }}
                        >
                          {game.description}
                        </Text>
                      </View>

                      {/* Arrow indicator */}
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          backgroundColor: "rgba(44, 62, 80, 0.08)",
                          alignItems: "center",
                          justifyContent: "center",
                          marginLeft: 12,
                        }}
                      >
                        <Ionicons
                          name="arrow-forward"
                          size={20}
                          color="#2c3e50"
                        />
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </>
  );
}
