import { useEffect, useState } from "react";
import { View, FlatList, TouchableOpacity, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getUsername } from "../src/shared/utils";
import * as FileSystem from "expo-file-system";

import { useAvatarSync, useSocket, useStorage } from "../src/shared/hooks";
import {
  Button,
  Typography,
  Card,
  LoadingSpinner,
} from "../src/shared/components/ui";
import {
  logAvatarCacheStatus,
  cleanOldCache,
  purgeLegacyAvatarCache,
} from "../src/core/storage";

export default function Rooms() {
  const params = useLocalSearchParams();
  const gameType = params.gameType || "bingo"; // Por defecto bingo para compatibilidad

  const [rooms, setRooms] = useState([]);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [joiningRoomId, setJoiningRoomId] = useState(null);
  const [myUsername, setMyUsername] = useState(null);
  const { socket, isConnected, socketId } = useSocket(); // 🆕 Usar el hook
  const { loadItem } = useStorage(); // 🆕 Hook para storage
  const { syncAvatar, getAvatarUrl, setLocalAvatarUrl } = useAvatarSync();

  // Log de caché de avatares al entrar a la lista de salas
  useEffect(() => {
    // Limpia el índice de caché de avatares de inmediato (elimina entradas huérfanas)
    (async () => {
      // Purga caché legado en AsyncStorage para liberar espacio
      await purgeLegacyAvatarCache();
      await cleanOldCache(0);
      await logAvatarCacheStatus();
    })();
  }, []);

  // Helper function to convert local avatar to base64
  const getAvatarBase64 = async () => {
    try {
      const avatarPath = await loadItem("profile:avatar");
      if (!avatarPath) {
        return null;
      }
      const base64 = await FileSystem.readAsStringAsync(avatarPath, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const avatarBase64 = `data:image/jpeg;base64,${base64}`;
      return avatarBase64;
    } catch (error) {
      console.error("❌ Error converting avatar for room:", error);
      return null;
    }
  };

  useEffect(() => {
    const onRooms = (list) => {
      // Filtrar salas por tipo de juego
      const filteredRooms = list.filter((room) => room.gameKey === gameType);
      setRooms(filteredRooms);
    };
    socket.on("rooms", onRooms);
    socket.emit("listRooms");

    // Cargar mi username para comparar con jugadores en salas
    const loadMyUsername = async () => {
      try {
        const username = await getUsername();
        setMyUsername(username);
      } catch (error) {
        console.error("❌ Error loading username:", error);
      }
    };
    loadMyUsername();

    // Cargar mi propio avatar para mostrarlo inmediatamente en las salas
    const loadMyAvatarForRooms = async () => {
      try {
        const myUsername = await getUsername();
        const savedAvatarPath = await loadItem("profile:avatar");
        if (myUsername && savedAvatarPath) {
          const base64 = await FileSystem.readAsStringAsync(savedAvatarPath, {
            encoding: FileSystem.EncodingType.Base64,
          });
          const avatarBase64 = `data:image/jpeg;base64,${base64}`;
          setLocalAvatarUrl(myUsername, avatarBase64);
        }
      } catch (error) {
        console.error("❌ Error loading my avatar in rooms:", error);
      }
    };
    loadMyAvatarForRooms();

    return () => {
      socket.off("rooms", onRooms);
      setIsCreatingRoom(false);
      setJoiningRoomId(null);
    };
  }, [setLocalAvatarUrl, gameType]); // Agregar gameType como dependencia

  // Limpiar estados de loading al desmontarse
  useEffect(() => {
    return () => {
      setIsCreatingRoom(false);
      setJoiningRoomId(null);
    };
  }, []);

  const openRoom = async (roomId, isReconnect = false) => {
    if (joiningRoomId) return; // Prevenir múltiples clicks
    setJoiningRoomId(roomId);
    try {
      const name = await loadItem("profile:name");
      const username = await getUsername();

      if (isReconnect) {
        // Si es una reconexión, ir directamente al juego
        socket.emit("joinRoom", { roomId, player: { name, username } });
        socket.once("joined", ({ roomId: joinedRoomId }) => {
          setJoiningRoomId(null);
          // Ir directamente al juego usando la ruta dinámica
          const room = rooms.find((r) => r.id === joinedRoomId);
          const gameKey = room?.gameKey || gameType;
          router.push(getGameRoute(gameKey, joinedRoomId));
        });
      } else {
        // Flujo normal para salas que no han empezado
        socket.emit("joinRoom", { roomId, player: { name, username } });
        socket.once("joined", ({ roomId: joinedRoomId }) => {
          setJoiningRoomId(null);
          // Buscar el estado inicial de la sala
          const room = rooms.find((r) => r.id === joinedRoomId);
          if (room) {
            router.push({
              pathname: "/waiting",
              params: {
                roomId: joinedRoomId,
                gameType: gameType,
                initialState: JSON.stringify(room),
              },
            });
          } else {
            router.push({
              pathname: "/waiting",
              params: {
                roomId: joinedRoomId,
                gameType: gameType,
              },
            });
          }
        });
      }

      // Timeout de seguridad
      setTimeout(() => {
        setJoiningRoomId(null);
      }, 10000);
    } catch (error) {
      console.error("Error joining room:", error);
      setJoiningRoomId(null);
    }
  };

  const createRoom = async () => {
    if (isCreatingRoom) return; // Prevenir múltiples clicks

    setIsCreatingRoom(true);
    try {
      const name = await loadItem("profile:name");
      const username = await getUsername();
      // No enviar avatar - el servidor lo obtiene de la BD
      socket.emit("createRoom", {
        player: { name, username },
        gameKey: gameType, // Usar el tipo de juego dinámico
      });

      socket.once("joined", ({ roomId }) => {
        setIsCreatingRoom(false);
        router.push({
          pathname: "/waiting",
          params: {
            roomId,
            gameType: gameType,
          },
        });
      });

      // Timeout de seguridad
      setTimeout(() => {
        setIsCreatingRoom(false);
      }, 10000);
    } catch (error) {
      console.error("Error creating room:", error);
      setIsCreatingRoom(false);
    }
  };

  const getGameDisplayName = (gameKey) => {
    const gameNames = {
      bingo: "Bingo",
      truco: "Truco Uruguayo",
    };
    return (
      gameNames[gameKey] || gameKey.charAt(0).toUpperCase() + gameKey.slice(1)
    );
  };

  const getGameRoute = (gameKey, roomId) => {
    return `/games/${gameKey}/${roomId}`;
  };

  const refreshRooms = () => {
    socket.emit("listRooms");
  };

  const renderRoom = ({ item }) => {
    const isInGame = item.started;
    const playerCount = item.players.length;
    const maxPlayers = 8; // Suponiendo un máximo
    const isJoining = joiningRoomId === item.id;
    const cardsPerPlayer = item.cardsPerPlayer || 1;

    // Verificar si estoy en esta sala (para permitir reconexión)
    const amInThisRoom =
      myUsername && item.players.some((p) => p.username === myUsername);
    const canJoin = !isInGame || amInThisRoom;
    const isReconnect = isInGame && amInThisRoom;

    // Determinar el estado de la sala
    let statusText, statusColor, iconName;
    if (isJoining) {
      statusText = "UNIÉNDOSE";
      statusColor = "#f39c12";
      iconName = "hourglass";
    } else if (isReconnect) {
      statusText = "RECONECTAR";
      statusColor = "#3498db";
      iconName = "refresh";
    } else if (isInGame) {
      statusText = "EN JUEGO";
      statusColor = "#e74c3c";
      iconName = "lock-closed";
    } else {
      statusText = "ESPERANDO";
      statusColor = "#27ae60";
      iconName = "arrow-forward";
    }

    return (
      <Card
        onPress={() => openRoom(item.id, isReconnect)}
        disabled={!canJoin || isJoining}
        variant="elevated"
        padding="medium"
        style={{
          marginBottom: 12,
          borderLeftWidth: 4,
          borderLeftColor: statusColor,
          opacity: !canJoin || isJoining ? 0.7 : 1,
        }}
      >
        {/* Header de la sala */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start", // Cambiar a flex-start para mejor alineación
            marginBottom: 12,
          }}
        >
          <View style={{ flex: 1 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 4,
              }}
            >
              <Typography
                variant="heading3"
                style={{
                  color: "#2c3e50",
                  marginRight: 8,
                }}
              >
                Sala {item.id}
              </Typography>
              {/* Badge de estado mejorado */}
              <View
                style={{
                  backgroundColor: statusColor,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 10,
                }}
              >
                <Typography
                  variant="small"
                  style={{
                    color: "white",
                    fontWeight: "600",
                    textTransform: "uppercase",
                  }}
                >
                  {statusText}
                </Typography>
              </View>
              {/* Badge adicional si estoy en la sala */}
              {amInThisRoom && (
                <View
                  style={{
                    backgroundColor: "#27ae60",
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 8,
                    marginLeft: 6,
                  }}
                >
                  <Typography
                    variant="small"
                    style={{
                      color: "white",
                      fontWeight: "600",
                    }}
                  >
                    TÚ
                  </Typography>
                </View>
              )}
            </View>

            {/* Contador de jugadores y cartones */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginRight: 12,
                }}
              >
                <Ionicons name="people" size={16} color="#7f8c8d" />
                <Typography
                  variant="small"
                  style={{ color: "#7f8c8d", marginLeft: 4 }}
                >
                  {playerCount}/{maxPlayers} jugadores
                </Typography>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="grid-outline" size={16} color="#7f8c8d" />
                <Typography
                  variant="small"
                  style={{ color: "#7f8c8d", marginLeft: 4 }}
                >
                  {cardsPerPlayer}{" "}
                  {cardsPerPlayer === 1 ? "cartón" : "cartones"} por jugador
                </Typography>
              </View>
            </View>

            {/* Mensaje adicional para reconexión */}
            {isReconnect && (
              <View
                style={{
                  backgroundColor: "#e8f4f8",
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 8,
                  marginTop: 8,
                }}
              >
                <Typography
                  variant="caption"
                  style={{
                    color: "#2980b9",
                    fontWeight: "600",
                    textAlign: "center",
                  }}
                >
                  🎮 Puedes volver a tu partida en progreso
                </Typography>
              </View>
            )}
          </View>

          {/* Icono de acción mejorado */}
          <View
            style={{
              alignItems: "center",
              justifyContent: "center",
              width: 24,
              height: 24,
              marginTop: 8, // Alinear con la línea del título
            }}
          >
            {isJoining ? (
              <LoadingSpinner
                variant="inline"
                size="small"
                color="#f39c12"
                message=""
                style={{
                  width: 24,
                  height: 24,
                  margin: 0,
                  padding: 0,
                }}
              />
            ) : (
              <Ionicons
                name={iconName}
                size={24}
                color={statusColor}
                style={{
                  width: 24,
                  height: 24,
                  textAlign: "center",
                  textAlignVertical: "center",
                }}
              />
            )}
          </View>
        </View>

        {/* Avatares de jugadores */}
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {item.players.slice(0, 5).map((p, index) => {
            const isMe = p.username === myUsername;
            const avatarUrl = getAvatarUrl(p.username);
            // Si no está en caché, dispara la descarga en background
            if (!avatarUrl && p.avatarId) {
              syncAvatar(p.username, p.avatarId);
            }
            return avatarUrl ? (
              <Image
                key={p.id}
                source={{ uri: avatarUrl }}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  marginRight: 10,
                  borderWidth: isMe ? 3 : 2,
                  borderColor: isMe ? "#3498db" : "#fff",
                  shadowColor: "#000",
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                  elevation: 2,
                }}
              />
            ) : (
              <View
                key={p.id}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  marginRight: 10,
                  backgroundColor: isMe ? "#3498db" : "#f0f0f0",
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: isMe ? 3 : 2,
                  borderColor: isMe ? "#2980b9" : "#fff",
                  shadowColor: "#000",
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                  elevation: 2,
                }}
              >
                <Typography
                  variant="caption"
                  style={{ color: isMe ? "white" : "#666" }}
                >
                  👤
                </Typography>
              </View>
            );
          })}
          {item.players.length > 5 && (
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: "#bdc3c7",
                alignItems: "center",
                justifyContent: "center",
                marginLeft: -6,
              }}
            >
              <Typography
                variant="caption"
                style={{ color: "white", fontWeight: "600" }}
              >
                +{item.players.length - 5}
              </Typography>
            </View>
          )}
          {item.players.length === 0 && (
            <Typography
              variant="caption"
              style={{ color: "#bdc3c7", fontStyle: "italic" }}
            >
              Sin jugadores
            </Typography>
          )}
        </View>
      </Card>
    );
  };

  return (
    <>
      <StatusBar style="light" />
      <View style={{ flex: 1, backgroundColor: "#f8f9fa" }}>
        <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>
          <View style={{ flex: 1, backgroundColor: "#f8f9fa" }}>
            {/* Header fijo con color sólido oscuro - efecto wave */}
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
              {/* Back button */}
              <Button
                onPress={() => router.push("/gameSelect")}
                variant="ghost"
                size="small"
                icon={<Ionicons name="arrow-back" size={20} color="white" />}
                style={{
                  position: "absolute",
                  top: 60,
                  left: 20,
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: "rgba(255,255,255,0.2)",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.3)",
                  paddingVertical: 0,
                  paddingHorizontal: 0,
                }}
              />

              <View style={{ alignItems: "center" }}>
                <Typography
                  variant="heading1"
                  style={{
                    color: "white",
                    marginBottom: 10,
                  }}
                >
                  Salas de {getGameDisplayName(gameType)}
                </Typography>
                <Typography
                  variant="body"
                  style={{
                    color: "rgba(255,255,255,0.8)",
                    textAlign: "center",
                  }}
                >
                  Únete a una sala o crea la tuya
                </Typography>
                {/* Botón ranking en header */}
                <Button
                  title="Ver Ranking"
                  onPress={() =>
                    router.push({
                      pathname: "/leaderboard",
                      params: { gameKey: "bingo" },
                    })
                  }
                  variant="ghost"
                  size="small"
                  icon={<Ionicons name="trophy" size={16} color="#f1c40f" />}
                  style={{
                    marginTop: 12,
                    backgroundColor: "rgba(255,255,255,0.15)",
                    borderRadius: 20,
                    paddingVertical: 8,
                    paddingHorizontal: 14,
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.25)",
                  }}
                  textStyle={{ color: "white", fontWeight: "700" }}
                />
              </View>
            </View>

            {/* Content Area con scroll */}
            <View style={{ flex: 1, backgroundColor: "#f8f9fa" }}>
              {/* Actions Row fijo */}
              <View style={{ padding: 16, paddingBottom: 8 }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  {/* Create Room Button */}
                  <Button
                    title={isCreatingRoom ? "Creando..." : "Crear Sala"}
                    onPress={createRoom}
                    disabled={isCreatingRoom}
                    loading={isCreatingRoom}
                    variant="primary"
                    size="large"
                    icon={
                      !isCreatingRoom && (
                        <Ionicons name="add-circle" size={20} color="white" />
                      )
                    }
                    style={{
                      flex: 1,
                      marginRight: 12,
                      backgroundColor: "#e74c3c",
                    }}
                  />

                  {/* Refresh Button - Pequeño */}
                  <Button
                    onPress={refreshRooms}
                    variant="primary"
                    size="large"
                    icon={<Ionicons name="refresh" size={20} color="white" />}
                    style={{
                      backgroundColor: "#3498db",
                      borderRadius: 12,
                      paddingVertical: 16,
                      paddingHorizontal: 16,
                    }}
                  />
                </View>
              </View>

              {/* Rooms List - Solo esta parte hace scroll */}
              <FlatList
                data={rooms}
                keyExtractor={(r) => r.id}
                renderItem={renderRoom}
                style={{ flex: 1 }}
                contentContainerStyle={{
                  paddingHorizontal: 16,
                  paddingTop: 12,
                  paddingBottom: 20,
                }}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={() => (
                  <View
                    style={{
                      alignItems: "center",
                      justifyContent: "center",
                      paddingVertical: 60,
                    }}
                  >
                    <Ionicons name="home" size={64} color="#bdc3c7" />
                    <Typography
                      variant="heading4"
                      style={{
                        color: "#7f8c8d",
                        marginTop: 16,
                        textAlign: "center",
                      }}
                    >
                      No hay salas disponibles
                    </Typography>
                    <Typography
                      variant="caption"
                      style={{
                        color: "#95a5a6",
                        marginTop: 8,
                        textAlign: "center",
                      }}
                    >
                      ¡Crea la primera sala!
                    </Typography>
                  </View>
                )}
              />
            </View>
          </View>
        </SafeAreaView>
      </View>
    </>
  );
}
