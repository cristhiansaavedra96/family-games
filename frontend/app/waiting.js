import { useEffect, useState, useMemo, useRef } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Dimensions,
  AppState,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ChatPanel, ChatButton, ChatToasts } from "../src/shared/components";
import { useAvatarSync, useSocket, useStorage } from "../src/shared/hooks";
import { getUsername } from "../src/shared/utils";
import { Button, ConfirmModal, KickedModal } from "../src/shared/components/ui";

const { width } = Dimensions.get("window");

export default function Waiting() {
  const { roomId, gameType = "bingo", initialState } = useLocalSearchParams();
  const { socket, isConnected, socketId } = useSocket(); // 🆕 Usar el hook
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
      pointsToWin: 500, // Configuración para UNO
    }
  );
  const [me, setMe] = useState(null);
  const [chatVisible, setChatVisible] = useState(false);
  const [currentMessage, setCurrentMessage] = useState(null); // legacy
  const [toastMessages, setToastMessages] = useState([]);
  const [confirmKick, setConfirmKick] = useState({
    visible: false,
    target: null,
  });
  const [wasKicked, setWasKicked] = useState(false);
  const { syncPlayers, getAvatarUrl, clearMemoryCache } = useAvatarSync();
  const [changingCards, setChangingCards] = useState(false);
  const { loadItem } = useStorage();
  const lastIdentityRef = useRef({ username: null, name: null });

  // Función para obtener la ruta del juego según el tipo
  const getGameRoute = (gameKey, roomId) => {
    return `/games/${gameKey}/${roomId}`;
  };

  // Función para obtener el nombre del juego
  const getGameDisplayName = (gameKey) => {
    const gameNames = {
      bingo: "Bingo",
      truco: "Truco Uruguayo",
    };
    return (
      gameNames[gameKey] || gameKey.charAt(0).toUpperCase() + gameKey.slice(1)
    );
  };

  // También limpiar memoria al desmontar:
  useEffect(() => {
    return () => {
      clearMemoryCache(); // Limpiar al salir de la sala
    };
  }, [clearMemoryCache]);

  const lastJoinRef = useRef(0);
  const attemptingReconnectRef = useRef(false);
  const appStateRef = useRef(AppState.currentState);
  const wentBackgroundAtRef = useRef(null);

  useEffect(() => {
    // Listener AppState para ampliar período de gracia y evitar desconexión por minimizar
    const sub = AppState.addEventListener("change", (nextState) => {
      const prev = appStateRef.current;
      appStateRef.current = nextState;
      if (!socket) return;
      if (
        (prev === "active" || prev === "inactive") &&
        nextState === "background"
      ) {
        wentBackgroundAtRef.current = Date.now();
        socket.emit("appBackground");
      } else if (prev === "background" && nextState === "active") {
        const diff = Date.now() - (wentBackgroundAtRef.current || Date.now());
        wentBackgroundAtRef.current = null;
        socket.emit("appForeground", { timeAwayMs: diff });
        if (roomId) {
          socket.emit("getState", { roomId });
        }
      }
    });

    if (socketId) {
      setMe(socketId);
    }
    const emitRejoinIfNeeded = async () => {
      // Evitar SPAM: mínimo 1s entre intentos
      if (Date.now() - lastJoinRef.current < 1000) return;
      if (!roomId) return;
      lastJoinRef.current = Date.now();
      // Intentar obtener identidad fiable
      let mePlayer = state.players?.find((p) => p.id === me);
      let username = mePlayer?.username || lastIdentityRef.current.username;
      let name = mePlayer?.name || lastIdentityRef.current.name;
      if (!username) {
        try {
          username = await getUsername();
        } catch {}
      }
      if (!name) {
        try {
          name = await loadItem("profile:name");
        } catch {}
      }
      if (username) {
        lastIdentityRef.current.username = username;
      }
      if (name) {
        lastIdentityRef.current.name = name;
      }
      const playerPayload = { username, name };
      socket.emit("joinRoom", { roomId, player: playerPayload });
      socket.emit("getState", { roomId });
    };

    const onConnect = () => {
      if (socket.id) {
        setMe(socket.id);
        emitRejoinIfNeeded();
      }
    };
    const onReconnect = () => {
      emitRejoinIfNeeded();
    };
    // Función onState optimizada:
    const onState = (s) => {
      //console.log("🎮 Estado recibido en waiting:", s);
      if (s.roomId === roomId) {
        // Asegurar que players siempre sea un array
        const safeState = {
          ...s,
          players: s.players || [],
          pointsToWin: s.pointsToWin || 500, // Valor por defecto para UNO
        };
        console.log(
          "🔄 Actualizando estado con players count:",
          safeState.players?.length || 0
        );
        setState(safeState);
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
        router.replace(getGameRoute(gameType, roomId));
      }
    };

    const onJoined = ({ id }) => setMe(id);
    const onChatMessage = (messageData) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const withId = { ...messageData, id };
      setToastMessages((prev) => [...prev, withId].slice(-4)); // máximo 4 visibles
    };
    const onPlayerDisconnected = (payload) => {
      if (!payload) return;
      const id = `disc-${payload.playerId}-${Date.now()}`;
      let reasonText = "se desconectó";
      if (payload.reason === "left") reasonText = "salió de la sala";
      else if (payload.reason === "kick") reasonText = "fue expulsado";
      else if (payload.reason === "timeout") reasonText = "perdió la conexión";
      // El nombre ya se muestra en ChatToastItem (header). Mantener solo la acción.
      const text = reasonText;
      const toast = {
        id,
        type: "system-disconnect",
        content: text,
        player: payload.username
          ? {
              id: payload.playerId,
              name: payload.name,
              username: payload.username,
              avatarId: payload.avatarId,
            }
          : null,
        meta: { reason: payload.reason },
        timestamp: payload.timestamp || Date.now(),
      };
      setToastMessages((prev) => [...prev, toast].slice(-4));
    };

    socket.on("state", onState);
    socket.on("joined", onJoined);
    socket.on("connect", onConnect);
    socket.on("reconnect", onReconnect);
    socket.on("chatMessage", onChatMessage);
    socket.on("playerDisconnected", onPlayerDisconnected);
    const onKicked = () => {
      // Mostrar modal y luego redirigir
      setWasKicked(true);
      // Pedir estado para reflejar salida
      setTimeout(() => {
        socket.emit("getState", { roomId });
      }, 200);
    };
    socket.on("kicked", onKicked);
    // Solo pedir el estado si no tenemos uno inicial
    if (!parsedInitial) {
      socket.emit("getState", { roomId });
    }

    return () => {
      socket.off("state", onState);
      socket.off("joined", onJoined);
      socket.off("connect", onConnect);
      socket.off("reconnect", onReconnect);
      socket.off("chatMessage", onChatMessage);
      socket.off("playerDisconnected", onPlayerDisconnected);
      socket.off("kicked", onKicked);
      sub?.remove?.();
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
  const setPoints = (points) => {
    if (changingCards) return;
    setChangingCards(true);
    setState((prev) => ({ ...prev, pointsToWin: points }));
    socket.emit("configure", { roomId, config: { pointsToWin: points } });
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
    const currentPlayer = state.players?.find((p) => p.id === me);
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
    const canKick = state.hostId === me && !isHost; // Yo soy host y este jugador no lo es

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

        {canKick && (
          <TouchableOpacity
            onPress={() => setConfirmKick({ visible: true, target: item })}
            style={{
              marginLeft: 12,
              backgroundColor: "#e74c3c",
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 8,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Text style={{ color: "white", fontSize: 12, fontWeight: "700" }}>
              Expulsar
            </Text>
          </TouchableOpacity>
        )}
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
            <Button
              onPress={() => router.back()}
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

            {/* Exit Room button */}
            <Button
              onPress={leaveRoom}
              variant="ghost"
              size="small"
              icon={<Ionicons name="exit-outline" size={20} color="white" />}
              style={{
                position: "absolute",
                top: 60,
                right: 20,
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
                {getGameDisplayName(gameType)} - Esperando jugadores...
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
              {/* Game Configuration - Bingo / Truco / UNO */}
              {(gameType === "bingo" ||
                gameType === "truco" ||
                gameType === "uno") && (
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

                  {/* Configuración específica para Bingo */}
                  {gameType === "bingo" && (
                    <>
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
                                state.cardsPerPlayer === n
                                  ? "#e74c3c"
                                  : "#ecf0f1",
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
                                  state.cardsPerPlayer === n
                                    ? "white"
                                    : "#7f8c8d",
                                fontWeight: "600",
                              }}
                            >
                              {n}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </>
                  )}

                  {/* Configuración específica para Truco */}
                  {gameType === "truco" && (
                    <>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "600",
                          color: "#7f8c8d",
                          marginBottom: 8,
                        }}
                      >
                        Modalidad: Truco Uruguayo (1 vs 1)
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          color: "#95a5a6",
                          marginBottom: 16,
                          lineHeight: 18,
                        }}
                      >
                        • Se juega a 30 puntos
                        {"\n"}• Cada jugador recibe 3 cartas por mano
                        {"\n"}• Incluye Envido, Truco y Flor
                      </Text>
                    </>
                  )}

                  {/* Configuración específica para UNO */}
                  {gameType === "uno" && (
                    <>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "600",
                          color: "#7f8c8d",
                          marginBottom: 8,
                        }}
                      >
                        Puntos para ganar:
                      </Text>

                      <View style={{ flexDirection: "row", marginBottom: 16 }}>
                        {[300, 500, 700].map((points) => (
                          <TouchableOpacity
                            disabled={changingCards || !isHost} // Solo el anfitrión puede cambiar
                            key={points}
                            onPress={() => isHost && setPoints(points)} // Solo el anfitrión puede ejecutar
                            style={{
                              backgroundColor:
                                state.pointsToWin === points
                                  ? "#e67e22"
                                  : "#ecf0f1",
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
                                  state.pointsToWin === points
                                    ? "white"
                                    : "#7f8c8d",
                                fontWeight: "600",
                              }}
                            >
                              {points}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </>
                  )}

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
                      Solo el anfitrión puede iniciar la partida
                    </Text>
                  )}

                  {/* Botón de iniciar - Solo para anfitrión */}
                  {isHost && (
                    <>
                      {/* Verificar condiciones para iniciar */}
                      {gameType === "bingo" ? (
                        <Button
                          title="Iniciar Juego"
                          onPress={start}
                          variant="primary"
                          size="large"
                          icon={
                            <Ionicons
                              name="play-circle"
                              size={24}
                              color="white"
                            />
                          }
                          style={{
                            backgroundColor: "#27ae60",
                            borderRadius: 12,
                          }}
                        />
                      ) : gameType === "truco" ? (
                        <Button
                          title="Iniciar Truco"
                          onPress={start}
                          variant="primary"
                          size="large"
                          disabled={state.players?.length !== 2}
                          icon={
                            <Ionicons
                              name={
                                state.players?.length === 2
                                  ? "play-circle"
                                  : "people"
                              }
                              size={24}
                              color="white"
                            />
                          }
                          style={{
                            backgroundColor:
                              state.players?.length === 2
                                ? "#e74c3c"
                                : "#95a5a6",
                            borderRadius: 12,
                            opacity: state.players?.length === 2 ? 1 : 0.7,
                          }}
                        />
                      ) : gameType === "uno" ? (
                        <Button
                          title="Iniciar UNO"
                          onPress={start}
                          variant="primary"
                          size="large"
                          disabled={(state.players?.length || 0) < 2}
                          icon={
                            <Ionicons
                              name={
                                (state.players?.length || 0) >= 2
                                  ? "play-circle"
                                  : "people"
                              }
                              size={24}
                              color="white"
                            />
                          }
                          style={{
                            backgroundColor:
                              (state.players?.length || 0) >= 2
                                ? "#e67e22"
                                : "#95a5a6",
                            borderRadius: 12,
                            opacity:
                              (state.players?.length || 0) >= 2 ? 1 : 0.7,
                          }}
                        />
                      ) : null}

                      {/* Mensaje de estado para Truco */}
                      {gameType === "truco" && state.players?.length !== 2 && (
                        <Text
                          style={{
                            fontSize: 12,
                            color: "#e67e22",
                            textAlign: "center",
                            marginTop: 8,
                            fontWeight: "600",
                          }}
                        >
                          Se necesitan exactamente 2 jugadores para iniciar
                        </Text>
                      )}
                      {gameType === "uno" &&
                        (state.players?.length || 0) < 2 && (
                          <Text
                            style={{
                              fontSize: 12,
                              color: "#e67e22",
                              textAlign: "center",
                              marginTop: 8,
                              fontWeight: "600",
                            }}
                          >
                            Se necesitan al menos 2 jugadores para iniciar UNO
                          </Text>
                        )}
                    </>
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
              )}

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
                  Jugadores ({state.players?.length || 0})
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

      <ConfirmModal
        visible={confirmKick.visible}
        title="Expulsar jugador"
        message={`¿Seguro que quieres expulsar a ${
          confirmKick.target?.name || "este jugador"
        } de la sala?`}
        confirmLabel="Expulsar"
        cancelLabel="Cancelar"
        variant="danger"
        onCancel={() => setConfirmKick({ visible: false, target: null })}
        onConfirm={() => {
          if (confirmKick.target) {
            socket.emit("kickPlayer", {
              roomId: state.roomId || roomId,
              targetPlayerId: confirmKick.target.id,
            });
          }
          setConfirmKick({ visible: false, target: null });
        }}
      />

      <KickedModal
        visible={wasKicked}
        onClose={() => {
          setWasKicked(false);
          // Asegurar abandono definitivo local
          router.replace("/gameSelect");
        }}
        title="Fuiste expulsado"
        message="El anfitrión te removió de la sala. Puedes unirte a otra cuando quieras."
        actionLabel="Entendido"
      />
    </>
  );
}
