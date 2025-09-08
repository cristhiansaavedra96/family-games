import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getAvailableGames, getGameInfo } from "../src/games/registry";
import { useStorage, useSocket } from "../src/shared/hooks";
import { getUsername } from "../src/shared/utils";

export default function Games() {
  const { loadItem, saveItem } = useStorage(); // 🆕 Hook para storage
  const { socket } = useSocket();
  const [userAvatar, setUserAvatar] = useState(null);
  const [avatarLoading, setAvatarLoading] = useState(true);

  // Cargar avatar del usuario
  useEffect(() => {
    loadUserAvatar();
  }, []);

  const loadUserAvatar = async () => {
    try {
      const savedAvatar = await loadItem("profile:avatar");
      if (savedAvatar) {
        setUserAvatar(savedAvatar);
        setAvatarLoading(false);
        return;
      }

      // Intentar fetch remoto si no hay local
      const uname = await getUsername();
      if (uname && socket && socket.connected) {
        await new Promise((resolve) => {
          socket.emit(
            "getPlayerProfile",
            { username: uname, gameKey: "bingo" },
            async (res) => {
              if (res?.ok && res.player) {
                if (res.player.avatarUrl) {
                  setUserAvatar(res.player.avatarUrl);
                  await saveItem("profile:avatar", res.player.avatarUrl);
                }
                if (res.player.name) {
                  await saveItem("profile:name", res.player.name);
                }
              }
              resolve();
            }
          );
        });
      }
    } catch (error) {
      console.log("Error loading avatar:", error);
    } finally {
      setAvatarLoading(false);
    }
  };

  // Obtener juegos disponibles del registro centralizado
  const games = getAvailableGames();
  //ordenar games por los que no están disabled primero
  games.sort((a, b) => (a.disabled === b.disabled ? 0 : a.disabled ? 1 : -1));

  const selectGame = (gameId) => {
    //if game has property "disabled" in true, return
    const game = getGameInfo(gameId);
    if (game && game.disabled) {
      return;
    }

    if (gameId === "bingo") {
      router.push({ pathname: "/rooms", params: { gameType: "bingo" } });
    } else if (gameId === "truco") {
      router.push({ pathname: "/rooms", params: { gameType: "truco" } });
    } else if (gameId === "uno") {
      router.push({ pathname: "/rooms", params: { gameType: "uno" } });
    }
    // Aquí se pueden agregar más juegos en el futuro
  };

  return (
    <>
      <StatusBar style="light" />
      {/* Fondo claro para que se vean las esquinas redondeadas del header oscuro */}
      <View style={{ flex: 1, backgroundColor: "#f8f9fa" }}>
        <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>
          {/* Header fijo */}
          <View
            style={{
              backgroundColor: "#2c3e50",
              paddingTop: 80,
              paddingBottom: 28,
              paddingHorizontal: 20,
              borderBottomLeftRadius: 30,
              borderBottomRightRadius: 30,
              marginTop: -40,
              zIndex: 10,
            }}
          >
            {/* Botón perfil */}
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
              ) : avatarLoading ? (
                <Ionicons name="time" size={24} color="white" />
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
                  marginBottom: 8,
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

          {/* Contenido scrollable (solo lista) */}
          <View style={{ flex: 1, backgroundColor: "#f8f9fa" }}>
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{
                paddingHorizontal: 20,
                paddingTop: 24,
                paddingBottom: 40,
              }}
              showsVerticalScrollIndicator={false}
            >
              <View style={{ gap: 20 }}>
                {games.map((game) => (
                  <TouchableOpacity
                    key={game.id}
                    onPress={() => selectGame(game.id)}
                    style={{
                      backgroundColor: game.disabled ? "#f0f0f0" : "#fff",
                      borderRadius: 18,
                      paddingVertical: 10,
                      paddingHorizontal: 14,
                      shadowColor: "#000",
                      shadowOpacity: game.disabled ? 0.035 : 0.08,
                      shadowRadius: 10,
                      shadowOffset: { width: 0, height: 4 },
                      elevation: game.disabled ? 1 : 5,
                      borderWidth: 1,
                      borderColor: "rgba(44,62,80,0.05)",
                      opacity: game.disabled ? 0.63 : 1,
                      minHeight: 112,
                    }}
                    activeOpacity={game.disabled ? 1 : 0.7}
                    disabled={game.disabled}
                  >
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      {game.assets?.previewImage ? (
                        <View
                          style={{
                            width: 92,
                            height: 92,
                            borderRadius: 14,
                            overflow: "hidden",
                            backgroundColor: "#ffffff",
                            marginRight: 14,
                            shadowColor: "#000",
                            shadowOpacity: 0.08,
                            shadowRadius: 6,
                            shadowOffset: { width: 0, height: 3 },
                            elevation: 3,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Image
                            source={game.assets.previewImage}
                            style={{ width: "100%", height: "100%" }}
                            resizeMode={
                              game.assets.fit === "cover" ? "cover" : "contain"
                            }
                          />
                          {game.assets.overlayDark && (
                            <View
                              pointerEvents="none"
                              style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundColor: "rgba(0,0,0,0.35)",
                              }}
                            />
                          )}
                          {game.disabled && (
                            <View
                              style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundColor: "rgba(0,0,0,0.35)",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Ionicons
                                name="lock-closed"
                                size={30}
                                color="rgba(255,255,255,0.9)"
                              />
                            </View>
                          )}
                        </View>
                      ) : (
                        <View
                          style={{
                            width: 92,
                            height: 92,
                            borderRadius: 16,
                            backgroundColor: game.disabled
                              ? "#bdc3c7"
                              : game.color,
                            alignItems: "center",
                            justifyContent: "center",
                            marginRight: 14,
                            shadowColor: game.color,
                            shadowOpacity: game.disabled ? 0 : 0.18,
                            shadowRadius: 6,
                            shadowOffset: { width: 0, height: 3 },
                            elevation: game.disabled ? 0 : 3,
                          }}
                        >
                          <Ionicons
                            name={game.icon}
                            size={40}
                            color={game.disabled ? "#ecf0f1" : "white"}
                          />
                        </View>
                      )}

                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 20,
                            fontWeight: "800",
                            color: game.disabled ? "#7f8c8d" : "#2c3e50",
                            marginBottom: 3,
                            fontFamily: "Montserrat_800ExtraBold",
                          }}
                        >
                          {game.name}
                        </Text>
                        {game.disabled ? (
                          <Text
                            style={{
                              fontSize: 11,
                              color: "#95a5a6",
                              lineHeight: 16,
                              fontFamily: "Montserrat_500Medium",
                              fontStyle: "italic",
                            }}
                          >
                            Próximamente
                          </Text>
                        ) : (
                          <Text
                            style={{
                              fontSize: 12,
                              color: "#7f8c8d",
                              lineHeight: 17,
                              fontFamily: "Montserrat_500Medium",
                            }}
                          >
                            {game.description}
                          </Text>
                        )}
                      </View>

                      {!game.disabled && (
                        <View
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 18,
                            backgroundColor: "rgba(44, 62, 80, 0.08)",
                            alignItems: "center",
                            justifyContent: "center",
                            marginLeft: 10,
                          }}
                        >
                          <Ionicons
                            name="arrow-forward"
                            size={18}
                            color="#2c3e50"
                          />
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </SafeAreaView>
      </View>
    </>
  );
}
