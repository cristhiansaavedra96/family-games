import { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import socket from "../src/core/socket";
import { ChatPanel, ChatButton, ChatToasts } from "../src/shared/components";
import { useAvatarSync } from "../src/shared/hooks";

const { width } = Dimensions.get("window");

export default function Waiting() {
  const { roomId, initialState } = useLocalSearchParams();
  // Si initialState viene como string, parsear una sola vez
  const parsedInitial = useMemo(() => {
    if (initialState) {
      try {
        return JSON.parse(initialState);
      } catch {
        return null;
      }
    }
    return null;
  }, [initialState]);
  const [state, setState] = useState(
    parsedInitial || {
      roomId,
      name: "",
      players: [],
      hostId: null,
      started: false,
      cardsPerPlayer: 1,
    }
  );
  const [me, setMe] = useState(null);
  const [chatVisible, setChatVisible] = useState(false);
  const [currentMessage, setCurrentMessage] = useState(null); // legacy
  const [toastMessages, setToastMessages] = useState([]);
  const { syncPlayers, getAvatarUrl, clearMemoryCache } = useAvatarSync();
  const [changingCards, setChangingCards] = useState(false);

  // También limpiar memoria al desmontar:
  useEffect(() => {
    return () => {
      clearMemoryCache(); // Limpiar al salir de la sala
    };
  }, [clearMemoryCache]);

  useEffect(() => {
    setMe(socket.id);
    const onConnect = () => setMe(socket.id);
    // Función onState optimizada:
    const onState = (s) => {
      if (s.roomId === roomId) {
        setState(s);
        setChangingCards(false);

        // Siempre cargar avatares cuando llegue estado (desde caché o descarga)
        if (s.players && s.players.length > 0) {
          console.log(
            `🔄 Estado recibido, cargando avatares para ${s.players.length} jugadores`
          );
          syncPlayers(s.players);
        }
      }

      if (s.started) {
        router.replace(`/games/bingo/${roomId}`);
      }
    };

    const onJoined = ({ id }) => setMe(id);
    const onChatMessage = (messageData) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const withId = { ...messageData, id };
      setToastMessages((prev) => [...prev, withId].slice(-4)); // máximo 4 visibles
    };

    socket.on("state", onState);
    socket.on("joined", onJoined);
    socket.on("connect", onConnect);
    socket.on("chatMessage", onChatMessage);
    // Solo pedir el estado si no tenemos uno inicial
    if (!parsedInitial) {
      socket.emit("getState", { roomId });
    }

    return () => {
      socket.off("state", onState);
      socket.off("joined", onJoined);
      socket.off("connect", onConnect);
      socket.off("chatMessage", onChatMessage);
    };
  }, [roomId]);

  const isHost = state.hostId === me;
  const start = () => socket.emit("startGame", { roomId });
  const setCards = (n) => {
    if (changingCards) return;
    setChangingCards(true);
    setState((prev) => ({ ...prev, cardsPerPlayer: n }));
    socket.emit("configure", { roomId, config: { cardsPerPlayer: n } });
  };

  // Ordenar jugadores con el anfitrión primero
  const sortedPlayers = useMemo(() => {
    if (!state.players || state.players.length === 0) return [];

    return [...state.players].sort((a, b) => {
      // El anfitrión siempre va primero
      if (a.id === state.hostId) return -1;
      if (b.id === state.hostId) return 1;
      // Mantener orden original para el resto
      return 0;
    });
  }, [state.players, state.hostId]);

  // Función para salir de la sala
  const leaveRoom = () => {
    // Emitir evento al servidor para salir de la sala
    socket.emit("leaveRoom");
    // Navegar de regreso a la lista de salas
    router.back();
  };

  // Funciones del chat
  const toggleChat = () => {
    setChatVisible(!chatVisible);
  };

  const handleSendMessage = (messageData) => {
    // Encontrar datos del jugador actual
    const currentPlayer = state.players.find((p) => p.id === me);
    if (!currentPlayer) return;

    const fullMessage = {
      ...messageData,
      player: {
        id: me,
        name: currentPlayer.name,
        username: currentPlayer.username,
        avatarId: currentPlayer.avatarId,
      },
      timestamp: Date.now(),
    };
    // Enviar mensaje al servidor
    socket.emit("sendChatMessage", { roomId, message: fullMessage });
    setChatVisible(false);
  };

  const handleMessageComplete = () => {
    setCurrentMessage(null);
  };

  const handleToastComplete = (id) => {
    setToastMessages((prev) => prev.filter((m) => m.id !== id));
  };

  const renderPlayer = ({ item, index }) => {
    const isMe = item.id === me;
    const isHost = item.id === state.hostId;

    return (
      <View
        style={{
          backgroundColor: "transparent", // Sin fondo individual
          borderRadius: 12,
          padding: 16,
          marginBottom: 0, // Sin margen bottom, el separador maneja el spacing
          flexDirection: "row",
          alignItems: "center",
          borderWidth: isMe ? 2 : 0,
          borderColor: isMe ? "#e74c3c" : "transparent",
          backgroundColor: isMe ? "rgba(231, 76, 60, 0.05)" : "transparent", // Fondo sutil solo para el usuario actual
        }}
      >
        {/* Avatar con indicador de estado */}
        <View style={{ position: "relative", marginRight: 16 }}>
          {getAvatarUrl(item.username) ? (
            <Image
              source={{ uri: getAvatarUrl(item.username) }}
              style={{
                width: 50,
                height: 50,
                borderRadius: 25,
                borderWidth: isHost ? 3 : 0,
                borderColor: isHost ? "#e74c3c" : "transparent",
              }}
            />
          ) : (
            <View
              style={{
                width: 50,
                height: 50,
                borderRadius: 25,
                borderWidth: isHost ? 3 : 0,
                borderColor: isHost ? "#e74c3c" : "transparent",
                backgroundColor: "#f0f0f0",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 20, color: "#666" }}>👤</Text>
            </View>
          )}
          {/* Indicador de conexión */}
          <View
            style={{
              position: "absolute",
              bottom: 2,
              right: 2,
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: "#27ae60",
              borderWidth: 2,
              borderColor: "#fff",
            }}
          />
        </View>

        <View style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 4,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: "#2c3e50",
                marginRight: 8,
              }}
            >
              {item.name}
            </Text>

            {/* Badges */}
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              {isHost && (
                <View
                  style={{
                    backgroundColor: "#e74c3c",
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 10,
                    marginRight: 4,
                  }}
                >
                  <Text
                    style={{ color: "white", fontSize: 10, fontWeight: "600" }}
                  >
                    ANFITRIÓN
                  </Text>
                </View>
              )}
              {isMe && (
                <View
                  style={{
                    backgroundColor: "#27ae60",
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 10,
                  }}
                >
                  <Text
                    style={{ color: "white", fontSize: 10, fontWeight: "600" }}
                  >
                    TÚ
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Status adicional */}
          <Text
            style={{
              fontSize: 12,
              color: "#7f8c8d",
              fontStyle: "italic",
            }}
          >
            Listo para jugar
          </Text>
        </View>
      </View>
    );
  };

  return (
    <>
      <StatusBar style="light" />
      <View style={{ flex: 1, backgroundColor: "#2c3e50" }}>
        <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>
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
            <TouchableOpacity
              onPress={() => router.back()}
              style={{
                position: "absolute",
                top: 60,
                left: 20,
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "rgba(255,255,255,0.2)",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.3)",
              }}
            >
              <Ionicons name="arrow-back" size={20} color="white" />
            </TouchableOpacity>

            {/* Exit Room button */}
            <TouchableOpacity
              onPress={leaveRoom}
              style={{
                position: "absolute",
                top: 60,
                right: 20,
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "rgba(255,255,255,0.2)",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.3)",
              }}
            >
              <Ionicons name="exit-outline" size={20} color="white" />
            </TouchableOpacity>

            <View style={{ alignItems: "center" }}>
              <Text
                style={{
                  fontSize: 28,
                  fontWeight: "700",
                  color: "white",
                  marginBottom: 10,
                  fontFamily: "Montserrat_700Bold",
                }}
              >
                Sala {roomId}
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  color: "rgba(255,255,255,0.8)",
                  textAlign: "center",
                  fontFamily: "Montserrat_400Regular",
                }}
              >
                Esperando jugadores...
              </Text>
            </View>
          </View>

          {/* Content Area con scroll */}
          <ScrollView
            style={{ flex: 1, backgroundColor: "#f8f9fa" }}
            showsVerticalScrollIndicator={false}
          >
            {/* Content */}
            <View style={{ padding: 16 }}>
              {/* Game Configuration - Visible para todos */}
              <View
                style={{
                  backgroundColor: "#fff",
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 16,
                  shadowColor: "#000",
                  shadowOpacity: 0.08,
                  shadowRadius: 12,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: 6,
                }}
              >
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "700",
                    color: "#2c3e50",
                    marginBottom: 12,
                  }}
                >
                  Configuración del juego
                </Text>

                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: "#7f8c8d",
                    marginBottom: 8,
                  }}
                >
                  Cartones por jugador:
                </Text>

                <View style={{ flexDirection: "row", marginBottom: 16 }}>
                  {[1, 2, 3, 4].map((n) => (
                    <TouchableOpacity
                      disabled={changingCards || !isHost} // Solo el anfitrión puede cambiar
                      key={n}
                      onPress={() => isHost && setCards(n)} // Solo el anfitrión puede ejecutar
                      style={{
                        backgroundColor:
                          state.cardsPerPlayer === n ? "#e74c3c" : "#ecf0f1",
                        paddingVertical: 8,
                        paddingHorizontal: 16,
                        borderRadius: 8,
                        marginRight: 8,
                        opacity: changingCards || !isHost ? 0.6 : 1,
                      }}
                    >
                      <Text
                        style={{
                          color:
                            state.cardsPerPlayer === n ? "white" : "#7f8c8d",
                          fontWeight: "600",
                        }}
                      >
                        {n}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Mostrar información adicional para jugadores no anfitriones */}
                {!isHost && (
                  <Text
                    style={{
                      fontSize: 12,
                      color: "#7f8c8d",
                      fontStyle: "italic",
                      marginBottom: 8,
                    }}
                  >
                    Solo el anfitrión puede modificar la configuración
                  </Text>
                )}

                {/* Botón de iniciar - Solo para anfitrión */}
                {isHost && (
                  <TouchableOpacity
                    onPress={start}
                    style={{
                      backgroundColor: "#27ae60",
                      borderRadius: 12,
                      paddingVertical: 16,
                      alignItems: "center",
                    }}
                  >
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <Ionicons name="play-circle" size={24} color="white" />
                      <Text
                        style={{
                          color: "white",
                          fontSize: 18,
                          fontWeight: "700",
                          marginLeft: 8,
                        }}
                      >
                        Iniciar Juego
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}

                {/* Mensaje para jugadores no anfitriones */}
                {!isHost && (
                  <View
                    style={{
                      backgroundColor: "#f8f9fa",
                      borderRadius: 12,
                      paddingVertical: 16,
                      alignItems: "center",
                      borderWidth: 1,
                      borderColor: "#e9ecef",
                    }}
                  >
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <Ionicons
                        name="hourglass-outline"
                        size={24}
                        color="#7f8c8d"
                      />
                      <Text
                        style={{
                          color: "#7f8c8d",
                          fontSize: 16,
                          fontWeight: "600",
                          marginLeft: 8,
                        }}
                      >
                        Esperando al anfitrión
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Players List */}
              <View
                style={{
                  backgroundColor: "#fff",
                  borderRadius: 16,
                  padding: 16,
                  shadowColor: "#000",
                  shadowOpacity: 0.08,
                  shadowRadius: 12,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: 6,
                  overflow: "hidden", // Esto asegura que el contenido se recorte según el borderRadius
                }}
              >
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "700",
                    color: "#2c3e50",
                    marginBottom: 16,
                  }}
                >
                  Jugadores ({state.players.length})
                </Text>

                <FlatList
                  data={sortedPlayers} // Usar la lista ordenada
                  keyExtractor={(item) => item.id}
                  renderItem={renderPlayer}
                  scrollEnabled={false}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{
                    flexGrow: 1,
                  }}
                  ItemSeparatorComponent={() => (
                    <View
                      style={{
                        height: 1,
                        backgroundColor: "rgba(44, 62, 80, 0.08)",
                        marginHorizontal: 16,
                        marginVertical: 4,
                      }}
                    />
                  )}
                  ListEmptyComponent={() => (
                    <View
                      style={{
                        alignItems: "center",
                        justifyContent: "center",
                        paddingVertical: 20,
                      }}
                    >
                      <Ionicons name="people" size={48} color="#bdc3c7" />
                      <Text
                        style={{
                          fontSize: 16,
                          color: "#7f8c8d",
                          marginTop: 8,
                          textAlign: "center",
                        }}
                      >
                        Esperando jugadores...
                      </Text>
                    </View>
                  )}
                />
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>

        {/* Chat Button */}
        <ChatButton onPress={toggleChat} />

        {/* Chat Panel */}
        <ChatPanel
          isVisible={chatVisible}
          onClose={() => setChatVisible(false)}
          onSendMessage={handleSendMessage}
        />
      </View>

      {/* Chat Toasts apilados a la derecha */}
      <ChatToasts
        messages={toastMessages}
        onItemComplete={handleToastComplete}
      />
    </>
  );
}
