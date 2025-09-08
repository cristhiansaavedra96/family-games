import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Image,
  Modal,
  PanResponder,
  Animated,
  Dimensions,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSocket } from "../../../shared/hooks";
import { ChatPanel, ChatButton, ChatToasts } from "../../../shared/components";
import { useAvatarSync, useMyAvatar } from "../../../shared/hooks";
import {
  getUnoCardImage,
  getUnoBackImage,
  getUnoDeckStackImages,
} from "../utils/cardAssets";
import { ChallengeResultModal } from "../components";

// Estado inicial básico para UNO (public + private)
const initialPublic = {
  started: false,
  gameEnded: false,
  currentPlayer: null,
  direction: 1,
  topCard: null,
  currentColor: null,
  discardCount: 0,
  drawCount: 0,
  players: [],
  pendingDrawCount: 0,
  pendingDrawType: null,
  winner: null,
  uno: [],
  wild4Challenge: null,
};

export default function UnoGameScreen() {
  const params = useLocalSearchParams();
  const roomId = params.roomId;
  const { socket } = useSocket();
  const { syncPlayers, getAvatarUrl, syncAvatar } = useAvatarSync();
  const { myAvatar, myUsername } = useMyAvatar();

  const [publicState, setPublicState] = useState(initialPublic);
  const [hand, setHand] = useState([]); // cartas privadas
  const [me, setMe] = useState(null);
  const [hostId, setHostId] = useState(null);
  const [wildColorModal, setWildColorModal] = useState(null); // cardId en selección
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [challengeResult, setChallengeResult] = useState(null); // resultado del desafío
  // Chat state
  const [chatVisible, setChatVisible] = useState(false);
  const [toastMessages, setToastMessages] = useState([]);
  const dragY = useRef(new Animated.Value(0)).current;
  const dragX = useRef(new Animated.Value(0)).current;
  const dragCardId = useRef(null);
  const dragActive = useRef(false);

  // Sistema responsivo
  const [screenData, setScreenData] = useState(Dimensions.get("window"));

  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) =>
      setScreenData(window)
    );
    return () => subscription?.remove?.();
  }, []);

  // Calcular escala basada en altura de pantalla
  const getResponsiveScale = () => {
    const baseHeight = 680; // Altura de referencia (iPhone 11/12 estándar)
    const currentHeight = screenData.height;
    const scale = Math.min(Math.max(currentHeight / baseHeight, 0.8), 1.5);
    return scale;
  };

  // Calcular tamaños dinámicos
  const scale = getResponsiveScale();

  // Detección mejorada para Galaxy S23 y dispositivos similares
  const actualHeight = screenData.height;
  const actualWidth = screenData.width;

  // Galaxy S23 tiene aproximadamente 411x914 en dp, detectarlo específicamente
  const isGalaxyS23Like =
    actualWidth >= 400 &&
    actualWidth <= 420 &&
    actualHeight >= 900 &&
    actualHeight <= 930 &&
    scale > 1.3; // Galaxy S23 tiene alta densidad

  const isReallySmallScreen =
    isGalaxyS23Like || (actualHeight <= 800 && actualHeight >= 750); // Pantallas compactas
  const isSmallScreen = scale < 1.0 || isReallySmallScreen; // Incluir dispositivos compactos de alta resolución
  const isLargeScreen = scale > 1.2 && !isReallySmallScreen;

  const responsiveSize = {
    // Espacios de jugadores
    playerSlot: Math.round(60 * scale),
    avatarSize: Math.round(34 * scale),
    placeholderCircle: Math.round(38 * scale),

    // Centro de mesa - ajustes especiales por tamaño de pantalla
    centerCircle: isSmallScreen
      ? Math.round(140 * scale)
      : Math.round(160 * scale), // Más pequeño en pantallas pequeñas
    discardCard: {
      width: isSmallScreen ? Math.round(60 * scale) : Math.round(70 * scale),
      height: isSmallScreen ? Math.round(95 * scale) : Math.round(110 * scale),
    },
    deckCard: {
      width: isSmallScreen ? Math.round(24 * scale) : Math.round(28 * scale),
      height: isSmallScreen ? Math.round(38 * scale) : Math.round(44 * scale),
    },

    // Cartas de oponentes
    opponentCard: {
      width: Math.round(22 * scale),
      height: Math.round(34 * scale),
    },

    // Espaciados responsivos - diferentes para cada tamaño de pantalla
    rowPadding: Math.round(15 * scale),
    marginVertical: Math.round(4 * scale),

    // Espaciados específicos del centro
    centerHeight: isReallySmallScreen
      ? Math.round(80 * scale) // Mucho más compacto para Galaxy S23
      : isSmallScreen
      ? Math.round(100 * scale)
      : Math.round(120 * scale), // Más compacto en pantallas pequeñas
    centerMarginTop: isReallySmallScreen
      ? -20 // Mucho más agresivo para Galaxy S23
      : isSmallScreen
      ? -2
      : isLargeScreen
      ? 8
      : 5, // Mucho más arriba para Galaxy S23
    centerMarginBottom: isReallySmallScreen
      ? 2 // Muy poco espacio abajo para Galaxy S23
      : isSmallScreen
      ? 6
      : isLargeScreen
      ? 15
      : 10, // Reducido ligeramente

    // Espaciado para la última fila - más conservador en pantallas pequeñas
    bottomRowMarginTop: isReallySmallScreen
      ? 15 // Más espacio arriba para empujar hacia abajo en Galaxy S23
      : isSmallScreen
      ? 5
      : isLargeScreen
      ? 25
      : 15, // Mucho menos en pantallas pequeñas
    bottomRowMarginBottom: isReallySmallScreen
      ? 8 // Más espacio abajo para Galaxy S23
      : isSmallScreen
      ? 3
      : isLargeScreen
      ? 8
      : 5,

    // Textos
    fontSize: {
      small: Math.round(9 * scale),
      medium: Math.round(11 * scale),
      large: Math.round(14 * scale),
    },
  };

  const DRAG_THRESHOLD = 120; // distancia hacia arriba para jugar

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !!dragCardId.current,
      onMoveShouldSetPanResponder: () => !!dragCardId.current,
      onPanResponderGrant: () => {
        dragActive.current = true;
      },
      onPanResponderMove: (_, g) => {
        if (!dragActive.current) return;
        if (g.dy < 0) dragY.setValue(g.dy);
        dragX.setValue(g.dx * 0.5);
      },
      onPanResponderRelease: (_, g) => {
        const cid = dragCardId.current;
        dragActive.current = false;
        dragCardId.current = null;
        if (g.dy < -DRAG_THRESHOLD && cid) {
          const card = hand.find((c) => c.id === cid);
          if (card) playCard(card);
        }
        Animated.parallel([
          Animated.spring(dragY, { toValue: 0, useNativeDriver: true }),
          Animated.spring(dragX, { toValue: 0, useNativeDriver: true }),
        ]).start();
      },
      onPanResponderTerminate: () => {
        dragActive.current = false;
        dragCardId.current = null;
        Animated.parallel([
          Animated.spring(dragY, { toValue: 0, useNativeDriver: true }),
          Animated.spring(dragX, { toValue: 0, useNativeDriver: true }),
        ]).start();
      },
    })
  ).current;

  const isMyTurn =
    publicState.currentPlayer === me ||
    publicState.currentPlayer === socket?.id;

  // Limpiar selección al cambiar de turno si no es mío
  useEffect(() => {
    if (!isMyTurn && selectedCardId) setSelectedCardId(null);
  }, [isMyTurn, selectedCardId]);

  // Suscribirse a eventos
  useEffect(() => {
    if (!socket) return;

    const onState = (s) => {
      setPublicState((prev) => ({ ...prev, ...extractUnoState(s) }));
      if (s.players) {
        // Intentar deducir mi id si no lo tenemos
        if (!me && s.players.some((p) => p.id === socket.id)) {
          setMe(socket.id);
        }
      }
      if (s.hostId) setHostId(s.hostId);
    };
    const onPrivateHand = ({ hand }) => setHand(hand || []);
    const onJoined = ({ id, hostId }) => {
      setMe(id);
      setHostId(hostId);
    };

    socket.on("state", onState);
    socket.on("privateHand", onPrivateHand);
    socket.on("joined", onJoined);
    socket.on("drawCardResult", (res) => {
      console.log("[UNO] drawCardResult", res);
    });

    // Eventos específicos UNO (placeholders para futura UI avanzada)
    socket.on("wild4ChallengeAvailable", (data) => {
      console.log("[UNO][Frontend] wild4ChallengeAvailable received:", data);
      setPublicState((prevData) => ({
        ...prevData,
        wild4Challenge: {
          ...data,
          resolved: false,
        },
      }));
    });
    socket.on("wild4ChallengeResult", (data) => {
      console.log("[UNO][Frontend] wild4ChallengeResult received:", data);

      // Encontrar los nombres de los jugadores
      const challengerPlayer = publicState.players.find(
        (p) => p.id === data.challenger
      );
      const targetPlayer = publicState.players.find(
        (p) => p.id === data.target
      );

      // Mostrar el modal con el resultado
      setChallengeResult({
        ...data,
        challengerName:
          challengerPlayer?.name || challengerPlayer?.username || "Jugador",
        targetName: targetPlayer?.name || targetPlayer?.username || "Jugador",
        challengerUsername: challengerPlayer?.username,
        targetUsername: targetPlayer?.username,
      });

      // Limpiar el challenge del estado
      setPublicState((prevData) => ({
        ...prevData,
        wild4Challenge: null,
      }));
    });
    socket.on("unoDeclared", () => {});
    socket.on("unoCalledOut", () => {});
    socket.on("playerAtUno", () => {});
    socket.on("unoStateCleared", () => {});

    // Pedir estado inicial y mano privada
    socket.emit("getState", { roomId });
    socket.emit("requestPrivateHand", { roomId });

    // Chat listeners
    const onChatMessage = (messageData) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const withId = { ...messageData, id };
      setToastMessages((prev) => [...prev, withId].slice(-4));
    };
    const onPlayerDisconnected = (payload) => {
      if (!payload) return;
      const id = `disc-${payload.playerId}-${Date.now()}`;
      let reasonText = "se desconectó";
      if (payload.reason === "left") reasonText = "salió de la sala";
      else if (payload.reason === "kick") reasonText = "fue expulsado";
      else if (payload.reason === "timeout") reasonText = "perdió la conexión";
      const toast = {
        id,
        type: "system-disconnect",
        content: reasonText,
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
    socket.on("chatMessage", onChatMessage);
    socket.on("playerDisconnected", onPlayerDisconnected);

    return () => {
      socket.off("state", onState);
      socket.off("privateHand", onPrivateHand);
      socket.off("joined", onJoined);
      socket.off("drawCardResult");
      socket.off("wild4ChallengeAvailable");
      socket.off("wild4ChallengeResult");
      socket.off("unoDeclared");
      socket.off("unoCalledOut");
      socket.off("playerAtUno");
      socket.off("unoStateCleared");
      socket.off("chatMessage");
      socket.off("playerDisconnected");
    };
  }, [socket, roomId, me]);

  useEffect(() => {
    if (!socket) return;
    const playersForSync = (publicState.players || []).filter(
      (p) => p.username && p.avatarId
    );
    if (playersForSync.length) syncPlayers(playersForSync);
  }, [publicState.players, syncPlayers, socket]);

  const extractUnoState = (s) => ({
    started: s.started,
    gameEnded: s.gameEnded,
    currentPlayer: s.currentPlayer,
    direction: s.direction,
    topCard: s.topCard,
    currentColor: s.currentColor,
    discardCount: s.discardCount,
    drawCount: s.drawCount,
    players: s.players || [],
    pendingDrawCount: s.pendingDrawCount,
    pendingDrawType: s.pendingDrawType,
    winner: s.winner,
    uno: s.uno || [],
    wild4Challenge: s.wild4Challenge || null,
  });

  // Debug: verificar el currentColor
  console.log("🎨 Public state:", publicState);
  console.log("🎨 Current Color:", publicState.currentColor);
  console.log(
    "🎨 Background Color:",
    getTableBackgroundColor(publicState.currentColor)
  );

  // Acciones básicas
  const handleDraw = () => {
    if (!isMyTurn) return;
    console.log("[UNO] emit drawCard", { roomId, isMyTurn });
    let responded = false;
    const handler = (res) => {
      responded = true;
      console.log("[UNO] drawCardResult (timed)", res);
      socket.off("drawCardResult", handler);
    };
    socket.on("drawCardResult", handler);
    setTimeout(() => {
      if (!responded) {
        console.warn("[UNO] drawCardResult timeout (2s)");
        socket.off("drawCardResult", handler);
      }
    }, 2000);
    socket.emit("drawCard", { roomId });
  };

  const handleDeclareUno = () => {
    socket.emit("declareUno", { roomId });
  };

  const handleCallOut = (targetId) => {
    socket.emit("callOutUno", { roomId, targetPlayerId: targetId });
  };

  const handleChallenge = () => {
    if (
      publicState.wild4Challenge &&
      publicState.wild4Challenge.eligibleChallengers &&
      publicState.wild4Challenge.eligibleChallengers.includes(me)
    ) {
      socket.emit("challengeWild4", { roomId });
    }
  };

  const handleAcceptWild4 = () => {
    if (
      publicState.wild4Challenge &&
      publicState.wild4Challenge.targetPlayer === me
    ) {
      socket.emit("acceptWild4", { roomId });
    }
  };

  // Jugar carta (por ahora sin selector de color para wild -> se enviará null)
  const playCard = (card) => {
    if (!isMyTurn) return;
    if (card.kind === "wild" || card.kind === "wild_draw4") {
      setWildColorModal(card.id);
      return;
    }
    socket.emit("playCard", { roomId, cardId: card.id, chosenColor: null });
  };

  const confirmWildColor = (color) => {
    if (!wildColorModal) return;
    socket.emit("playCard", {
      roomId,
      cardId: wildColorModal,
      chosenColor: color,
    });
    setWildColorModal(null);
  };

  const cancelWild = () => setWildColorModal(null);

  const onSelectCard = (card) => {
    if (!isMyTurn) return; // no seleccionar si no es mi turno
    setSelectedCardId((prev) => {
      if (prev === card.id) {
        // Segundo tap: intentar jugar
        playCard(card);
        return null;
      }
      dragCardId.current = card.id; // preparar drag sólo al seleccionar
      return card.id;
    });
  };

  const renderCard = ({ item }) => {
    const img = getUnoCardImage(item);
    const selected = selectedCardId === item.id;
    // La carta seleccionada se pinta en overlay global
    if (selected)
      return <View style={{ width: 90, height: 140, marginRight: -50 }} />;
    return (
      <TouchableOpacity
        style={styles.cardWrapper}
        onPress={isMyTurn ? () => onSelectCard(item) : undefined}
        onLongPress={isMyTurn ? () => onSelectCard(item) : undefined}
        delayLongPress={120}
        disabled={!isMyTurn}
      >
        <Image source={img} style={styles.cardImage} resizeMode="contain" />
      </TouchableOpacity>
    );
  };

  const otherPlayers = publicState.players.filter((p) => p.id !== me);
  const unoPlayers = publicState.uno || [];

  // Función para obtener las posiciones según el número total de jugadores
  const getPlayerPositions = (totalPlayers) => {
    // Posiciones disponibles en la matriz 5x3:
    // 1x1, 1x2, 1x3 (fila superior)
    // 2x1, 2x3 (fila media, sin centro)
    // 5x1, 5x2, 5x3 (fila inferior, yo siempre en 5x2)

    const availablePositions = [
      { row: 1, col: 1, key: "1x1" },
      { row: 1, col: 2, key: "1x2" },
      { row: 1, col: 3, key: "1x3" },
      { row: 2, col: 1, key: "2x1" },
      { row: 2, col: 3, key: "2x3" },
      { row: 5, col: 1, key: "5x1" },
      { row: 5, col: 3, key: "5x3" },
    ];

    switch (totalPlayers) {
      case 2: // 1 vs 1: rival en 1x2
        return ["1x2"];
      case 3: // yo + 2 rivales: 1x1, 1x3
        return ["1x1", "1x3"];
      case 4: // yo + 3 rivales: 1x2, 2x1, 2x3
        return ["1x2", "2x1", "2x3"];
      case 5: // yo + 4 rivales: 1x1, 1x3, 5x1, 5x3
        return ["1x1", "1x3", "5x1", "5x3"];
      case 6: // yo + 5 rivales: 1x1, 1x2, 1x3, 5x1, 5x3
        return ["1x1", "1x2", "1x3", "5x1", "5x3"];
      case 7: // yo + 6 rivales: 1x1, 1x3, 2x1, 2x3, 5x1, 5x3
        return ["1x1", "1x3", "2x1", "2x3", "5x1", "5x3"];
      case 8: // yo + 7 rivales: todas las posiciones
        return ["1x1", "1x2", "1x3", "2x1", "2x3", "5x1", "5x3"];
      default:
        return [];
    }
  };

  // Crear placeholders para todas las posiciones posibles (máximo 8 jugadores)
  const allPositions = ["1x1", "1x2", "1x3", "2x1", "2x3", "5x1", "5x2", "5x3"];
  const usedPositions = getPlayerPositions(publicState.players.length);

  // Asignar jugadores a posiciones
  const positionedPlayers = {};
  otherPlayers.forEach((player, index) => {
    if (usedPositions[index]) {
      positionedPlayers[usedPositions[index]] = player;
    }
  });

  const shrinkOpponents = otherPlayers.length > 6;

  // Display name propio (asegurar disponible antes del render)
  const myPlayerMeta = publicState.players.find((p) => p.id === me);
  const myDisplayName =
    myPlayerMeta?.name || myPlayerMeta?.username || myUsername || "?";

  // Crear estilos responsivos dinámicos
  const responsiveStyles = createResponsiveStyles(responsiveSize);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }}>
      <LinearGradient
        colors={["#0f1f29", "#0b141a", "#05090c"]}
        style={StyleSheet.absoluteFill}
      />
      <StatusBar style="light" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>UNO</Text>
        <View style={{ width: 32 }} />
      </View>

      <View
        style={[
          styles.tableArea,
          {
            paddingTop: isReallySmallScreen ? 1 : 4, // Casi sin padding arriba para Galaxy S23
            paddingBottom: isReallySmallScreen ? 2 : 12, // Menos padding abajo para Galaxy S23
          },
        ]}
      >
        <View style={responsiveStyles.responsiveGameMatrix}>
          {/* Fila superior (1x1, 1x2, 1x3) */}
          <View style={responsiveStyles.responsiveMatrixRow}>
            <PlayerSlot
              position="1x1"
              player={positionedPlayers["1x1"]}
              unoPlayers={unoPlayers}
              shrink={shrinkOpponents}
              responsiveStyles={responsiveStyles}
              responsiveSize={responsiveSize}
            />
            <PlayerSlot
              position="1x2"
              player={positionedPlayers["1x2"]}
              unoPlayers={unoPlayers}
              shrink={shrinkOpponents}
              responsiveStyles={responsiveStyles}
              responsiveSize={responsiveSize}
            />
            <PlayerSlot
              position="1x3"
              player={positionedPlayers["1x3"]}
              unoPlayers={unoPlayers}
              shrink={shrinkOpponents}
              responsiveStyles={responsiveStyles}
              responsiveSize={responsiveSize}
            />
          </View>

          {/* Fila media (2x1, 2x3) - más cerca de la primera */}
          <View style={responsiveStyles.responsiveMatrixRow}>
            <PlayerSlot
              position="2x1"
              player={positionedPlayers["2x1"]}
              unoPlayers={unoPlayers}
              shrink={shrinkOpponents}
              responsiveStyles={responsiveStyles}
              responsiveSize={responsiveSize}
            />
            <View
              style={[
                styles.spacerForCenter,
                { width: responsiveSize.playerSlot },
              ]}
            />
            <PlayerSlot
              position="2x3"
              player={positionedPlayers["2x3"]}
              unoPlayers={unoPlayers}
              shrink={shrinkOpponents}
              responsiveStyles={responsiveStyles}
              responsiveSize={responsiveSize}
            />
          </View>

          {/* Centro de la mesa - centrado horizontalmente, filas 3-4 */}
          <View style={responsiveStyles.responsiveCenterRowContainer}>
            <View style={styles.centerWrapper}>
              <View style={styles.turnHeaderContainer}>
                <Text style={styles.turnHeaderText} numberOfLines={1}>
                  {publicState.gameEnded
                    ? publicState.winner === me
                      ? "Ganaste"
                      : "Ganó otro jugador"
                    : isMyTurn
                    ? "Tu turno"
                    : publicState.currentPlayer
                    ? (() => {
                        const cp = publicState.players.find(
                          (p) => p.id === publicState.currentPlayer
                        );
                        const name =
                          cp?.name ||
                          cp?.username ||
                          shortId(publicState.currentPlayer);
                        return `Turno de ${name}`;
                      })()
                    : "Esperando"}
                </Text>
                {publicState.pendingDrawCount > 0 && (
                  <Text
                    style={styles.turnHeaderStack}
                  >{`+${publicState.pendingDrawCount}`}</Text>
                )}
              </View>

              <View
                style={[
                  responsiveStyles.responsiveCenterCircle,
                  {
                    backgroundColor: getTableBackgroundColor(
                      publicState.currentColor
                    ),
                    borderColor: getTableBorderColor(publicState.currentColor),
                  },
                ]}
              >
                <View style={styles.gameElementsContainer}>
                  <View style={styles.deckDiscardRow}>
                    <View style={styles.deckZone}>
                      <View style={responsiveStyles.responsiveDeckStackWrapper}>
                        {getUnoDeckStackImages(3).map((img, i) => (
                          <Image
                            key={i}
                            source={img}
                            style={[
                              responsiveStyles.responsiveDeckImage,
                              {
                                position: "absolute",
                                top: i * 1.0,
                                left: i * 1.0,
                              },
                            ]}
                          />
                        ))}
                        <Image
                          source={getUnoBackImage()}
                          style={[
                            responsiveStyles.responsiveDeckImage,
                            { opacity: 0 },
                          ]}
                        />
                      </View>
                      <Text style={styles.deckCountText}>
                        {publicState.drawCount}
                      </Text>
                    </View>

                    <View style={styles.discardZone}>
                      {publicState.topCard ? (
                        <Image
                          source={getUnoCardImage(publicState.topCard)}
                          style={responsiveStyles.responsiveDiscardImage}
                          resizeMode="contain"
                        />
                      ) : (
                        <View
                          style={responsiveStyles.responsivePlaceholderCard}
                        />
                      )}
                    </View>

                    <View style={styles.spacer} />
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Espaciador flexible para empujar la última fila hacia abajo */}
          <View
            style={{
              height: isReallySmallScreen
                ? 70 // Más espaciado para empujar la fila hacia abajo en Galaxy S23
                : scale < 1.0
                ? 10
                : scale > 1.2
                ? 40
                : 25,
            }}
          />

          {/* Fila inferior (5x1, 5x2, 5x3) */}
          <View style={responsiveStyles.responsiveBottomRow}>
            <PlayerSlot
              position="5x1"
              player={positionedPlayers["5x1"]}
              unoPlayers={unoPlayers}
              shrink={shrinkOpponents}
              responsiveStyles={responsiveStyles}
              responsiveSize={responsiveSize}
            />

            {/* Mi posición (5x2) - avatar y nombre arriba de mis cartas */}
            <View
              style={[
                responsiveStyles.responsivePlayerSlot,
                { justifyContent: "center", alignItems: "center" },
              ]}
            >
              {myDisplayName &&
                (myAvatar ? (
                  <Image
                    source={{ uri: myAvatar }}
                    style={[
                      responsiveStyles.responsiveOpponentAvatar,
                      { borderColor: "#2ecc71" }, // Color verde para diferenciar que soy yo
                    ]}
                  />
                ) : (
                  <View
                    style={[
                      responsiveStyles.responsiveOpponentAvatarPlaceholder,
                      { borderColor: "#2ecc71", backgroundColor: "#2ecc71" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.placeholderText,
                        {
                          fontSize: responsiveSize.fontSize.medium,
                          color: "#fff",
                          fontWeight: "bold",
                        },
                      ]}
                    >
                      {(myDisplayName || "?")[0].toUpperCase()}
                    </Text>
                  </View>
                ))}
              {myDisplayName && (
                <Text
                  style={[
                    styles.placeholderSubtext,
                    {
                      fontSize: responsiveSize.fontSize.small,
                      fontWeight: "bold",
                      color: "#2ecc71",
                    },
                  ]}
                  numberOfLines={1}
                >
                  {myDisplayName}
                </Text>
              )}
            </View>

            <PlayerSlot
              position="5x3"
              player={positionedPlayers["5x3"]}
              unoPlayers={unoPlayers}
              shrink={shrinkOpponents}
              responsiveStyles={responsiveStyles}
              responsiveSize={responsiveSize}
            />
          </View>
        </View>
      </View>

      {/* ActionBar movida arriba de las cartas con altura fija para evitar layout shifts */}
      <ActionBar
        isMyTurn={isMyTurn}
        hand={hand}
        publicState={publicState}
        me={me}
        otherPlayers={otherPlayers}
        onDraw={handleDraw}
        onDeclareUno={handleDeclareUno}
        onCallOut={handleCallOut}
        onChallenge={handleChallenge}
        onAcceptWild4={handleAcceptWild4}
        onChatToggle={() => setChatVisible(true)}
      />

      <View style={styles.handArea}>
        {/* Avatar movido a la posición 5x2 arriba - aquí solo van las cartas para ocupar todo el horizontal */}
        <View style={styles.handContainer}>
          <FlatList
            data={hand}
            horizontal
            keyExtractor={(c) => c.id}
            renderItem={renderCard}
            contentContainerStyle={styles.handListContentFull}
            showsHorizontalScrollIndicator={false}
            style={styles.handListContainer}
          />
        </View>
        {hand.length === 0 && (
          <View style={styles.emptyHandOverlay}>
            <Text style={styles.emptyHandText}>Sin cartas recibidas</Text>
            <TouchableOpacity
              style={styles.reloadBtn}
              onPress={() => socket.emit("requestPrivateHand", { roomId })}
            >
              <Text style={styles.reloadBtnText}>Recargar mano</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Modal visible={!!wildColorModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.colorWheelWrapper}>
            {[
              { k: "red", c: "#ec321dff" },
              { k: "yellow", c: "#f1c40f" },
              { k: "green", c: "#289455ff" },
              { k: "blue", c: "#2893dbff" },
            ].map((col, idx) => {
              const positions = [
                { top: 22, left: "50%", transform: [{ translateX: -40 }] },
                { top: "50%", right: 22, transform: [{ translateY: -40 }] },
                { bottom: 22, left: "50%", transform: [{ translateX: -40 }] },
                { top: "50%", left: 22, transform: [{ translateY: -40 }] },
              ];
              return (
                <TouchableOpacity
                  key={col.k}
                  style={[
                    styles.colorDot,
                    { backgroundColor: col.c },
                    positions[idx],
                  ]}
                  onPress={() => confirmWildColor(col.k)}
                  activeOpacity={0.85}
                />
              );
            })}
            <TouchableOpacity
              style={styles.closeColorPicker}
              onPress={cancelWild}
            >
              <Ionicons name="close" size={26} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {selectedCardId && (
        <Animated.View
          {...panResponder.panHandlers}
          style={[
            styles.dragOverlayCard,
            {
              transform: [
                { translateY: dragY },
                { translateX: dragX },
                { scale: 0.9 }, // carta seleccionada más chica
              ],
            },
          ]}
          pointerEvents="auto"
        >
          {(() => {
            const card = hand.find((c) => c.id === selectedCardId);
            if (!card) return null;
            return (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  // Tap en la carta grande juega la carta
                  playCard(card);
                  setSelectedCardId(null);
                }}
              >
                <Image
                  source={getUnoCardImage(card)}
                  style={styles.dragImageSmall}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            );
          })()}
        </Animated.View>
      )}

      {/* Chat Toasts */}
      <ChatToasts
        messages={toastMessages}
        onItemComplete={(id) =>
          setToastMessages((prev) => prev.filter((m) => m.id !== id))
        }
      />

      {/* Chat Panel */}
      <ChatPanel
        isVisible={chatVisible}
        onClose={() => setChatVisible(false)}
        onSendMessage={async (messageData) => {
          // Construir payload similar a waiting/bingo
          const mePlayer = publicState.players.find((p) => p.id === me);
          if (!mePlayer) return;
          const fullMessage = {
            ...messageData,
            player: {
              id: mePlayer.id,
              name: mePlayer.name,
              username: mePlayer.username,
              avatarId: mePlayer.avatarId,
            },
            timestamp: Date.now(),
          };
          socket.emit("sendChatMessage", { roomId, message: fullMessage });
          setChatVisible(false);
        }}
      />

      {/* Challenge Result Modal */}
      <ChallengeResultModal
        visible={!!challengeResult}
        challengeResult={challengeResult}
        getAvatarUrl={getAvatarUrl}
        onClose={() => setChallengeResult(null)}
      />
    </SafeAreaView>
  );
}

function PlayerSlot({
  position,
  player,
  unoPlayers,
  shrink,
  responsiveStyles,
  responsiveSize,
}) {
  if (player) {
    // Si hay un jugador asignado, mostrar el componente Opponent normal
    return (
      <Opponent
        player={player}
        unoPlayers={unoPlayers}
        shrink={shrink}
        responsiveStyles={responsiveStyles}
        responsiveSize={responsiveSize}
      />
    );
  }

  // Si no hay jugador, mostrar placeholder
  return (
    <View
      style={[
        responsiveStyles.responsivePlayerSlot,
        shrink && { transform: [{ scale: 0.8 }] },
      ]}
    >
      <View style={responsiveStyles.responsivePlaceholderCircle}>
        <Text
          style={[
            styles.placeholderIcon,
            { fontSize: responsiveSize.fontSize.medium },
          ]}
        >
          👤
        </Text>
      </View>
      <Text
        style={[
          styles.placeholderText,
          { fontSize: responsiveSize.fontSize.small },
        ]}
      >
        {position}
      </Text>
    </View>
  );
}

function shortId(id) {
  return id ? id.slice(0, 4) : "";
}

// Función para obtener el color de fondo de la mesa basado en currentColor
const getTableBackgroundColor = (currentColor) => {
  const colorMap = {
    red: "#4a1c1c", // Rojo oscuro
    blue: "#1c2c4a", // Azul oscuro
    green: "#1c4a2c", // Verde oscuro
    yellow: "#4a4a1c", // Amarillo oscuro
    wild: "#3c2a4a", // Púrpura oscuro para wild
  };
  return colorMap[currentColor?.toLowerCase()] || "#0d3b24"; // Verde por defecto
};

const getTableBorderColor = (currentColor) => {
  const colorMap = {
    red: "#6b2d2d", // Rojo borde
    blue: "#2d3a6b", // Azul borde
    green: "#2d6b3a", // Verde borde
    yellow: "#6b6b2d", // Amarillo borde
    wild: "#54396b", // Púrpura borde para wild
  };
  return colorMap[currentColor?.toLowerCase()] || "#145c36"; // Verde por defecto
};

// Función para crear estilos responsivos
const createResponsiveStyles = (responsiveSize) =>
  StyleSheet.create({
    // Estilos dinámicos que cambian con el tamaño de pantalla
    responsivePlayerSlot: {
      alignItems: "center",
      width: responsiveSize.playerSlot,
      height: responsiveSize.playerSlot,
    },
    responsivePlaceholderCircle: {
      width: responsiveSize.placeholderCircle,
      height: responsiveSize.placeholderCircle,
      borderRadius: responsiveSize.placeholderCircle / 2,
      backgroundColor: "#2c3e50",
      borderWidth: 2,
      borderColor: "#34495e",
      borderStyle: "dashed",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 3,
    },
    responsiveCenterCircle: {
      width: responsiveSize.centerCircle,
      height: responsiveSize.centerCircle,
      borderRadius: responsiveSize.centerCircle / 2,
      backgroundColor: "#0d3b24",
      borderWidth: 2,
      borderColor: "#145c36",
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOpacity: 0.45,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 4 },
      elevation: 9,
    },
    responsiveDiscardImage: {
      width: responsiveSize.discardCard.width,
      height: responsiveSize.discardCard.height,
    },
    responsivePlaceholderCard: {
      width: responsiveSize.discardCard.width,
      height: responsiveSize.discardCard.height,
      backgroundColor: "#333",
      borderRadius: 13,
    },
    responsiveDeckStackWrapper: {
      width: responsiveSize.deckCard.width,
      height: responsiveSize.deckCard.height,
      position: "relative",
      alignItems: "center",
      justifyContent: "center",
    },
    responsiveDeckImage: {
      width: responsiveSize.deckCard.width,
      height: responsiveSize.deckCard.height,
      borderRadius: 5,
    },
    responsiveMatrixRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: responsiveSize.rowPadding,
      marginVertical: responsiveSize.marginVertical,
    },
    responsiveCenterRowContainer: {
      justifyContent: "flex-start",
      alignItems: "center",
      marginTop: responsiveSize.centerMarginTop,
      marginBottom: responsiveSize.centerMarginBottom,
      height: responsiveSize.centerHeight,
    },
    responsiveBottomRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: responsiveSize.rowPadding,
      marginTop: responsiveSize.bottomRowMarginTop,
      marginBottom: responsiveSize.bottomRowMarginBottom,
    },
    responsiveGameMatrix: {
      flex: 1,
      justifyContent: "flex-start",
      paddingVertical: 5,
      minHeight: Math.round(350 * (responsiveSize.centerCircle / 160)), // Altura mínima proporcional
    },
    responsiveOpponentAvatar: {
      width: responsiveSize.avatarSize,
      height: responsiveSize.avatarSize,
      borderRadius: responsiveSize.avatarSize / 2,
      borderWidth: 2,
      borderColor: "#3498db",
      marginBottom: 3,
    },
    responsiveOpponentAvatarPlaceholder: {
      width: responsiveSize.avatarSize,
      height: responsiveSize.avatarSize,
      borderRadius: responsiveSize.avatarSize / 2,
      backgroundColor: "#333",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 3,
      borderWidth: 2,
      borderColor: "#444",
    },
  });

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingTop: 6,
  },
  backBtn: { padding: 8 },
  title: { color: "#fff", fontSize: 22, fontWeight: "700" },
  tableArea: {
    flex: 1,
    paddingHorizontal: 8,
    paddingTop: 4,
    justifyContent: "flex-start", // Cambiado de "center" a "flex-start"
    paddingBottom: 12, // Aumentado de 8 a 12 para más espacio
  },
  gameMatrix: {
    flex: 1,
    justifyContent: "flex-start", // Volver a flex-start para mejor control
    paddingVertical: 5,
  },
  matrixRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15, // Reducido de 20 a 15
    marginVertical: 4, // Reducido de 8 a 4
  },
  matrixRowSecond: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15, // Reducido de 20 a 15
    marginTop: 8, // Reducido de 15 a 8 - más cerca de la primera fila
    marginBottom: 4, // Reducido de 8 a 4
  },
  centerRowContainer: {
    justifyContent: "flex-start", // Cambiado de "center" a "flex-start"
    alignItems: "center",
    marginTop: 5, // Reducido significativamente de 15 a 5
    marginBottom: 10, // Reducido de 15 a 10
    height: 120, // Altura fija más pequeña para que ocupe menos espacio
  },
  spacerForCenter: {
    width: 60, // Reducido de 80 a 60
  },
  playerSlotPlaceholder: {
    alignItems: "center",
    width: 60, // Reducido de 80 a 60
    height: 60, // Reducido de 80 a 60
  },
  placeholderCircle: {
    width: 38, // Reducido de 50 a 38
    height: 38, // Reducido de 50 a 38
    borderRadius: 19, // Ajustado al nuevo tamaño
    backgroundColor: "#2c3e50",
    borderWidth: 2,
    borderColor: "#34495e",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 3, // Reducido de 4 a 3
  },
  placeholderIcon: {
    fontSize: 16, // Reducido de 20 a 16
    opacity: 0.6,
  },
  placeholderText: {
    color: "#7f8c8d",
    fontSize: 9, // Reducido de 10 a 9
    fontWeight: "600",
    textAlign: "center",
  },
  placeholderSubtext: {
    color: "#7f8c8d",
    fontSize: 7, // Reducido de 8 a 7
    opacity: 0.7,
    textAlign: "center",
  },
  mySlotPlaceholder: {
    alignItems: "center",
    width: 60, // Reducido de 80 a 60
    height: 60, // Reducido de 80 a 60
    justifyContent: "center",
  },
  centerZoneCircle: {
    width: 160, // Reducido de 200 a 160
    height: 160, // Reducido de 200 a 160
    borderRadius: 80, // Ajustado al nuevo tamaño
    backgroundColor: "#0d3b24",
    borderWidth: 2,
    borderColor: "#145c36",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 9,
  },
  gameElementsContainer: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  deckDiscardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12, // Reducido de 15 a 12
    width: "100%",
  },
  deckZone: {
    alignItems: "center",
    justifyContent: "center",
  },
  deckStackWrapper: {
    width: 28, // Reducido de 32 a 28
    height: 44, // Reducido de 50 a 44
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  deckImage: {
    width: 28, // Reducido de 32 a 28
    height: 44, // Reducido de 50 a 44
    borderRadius: 5,
  },
  deckCountText: {
    color: "#f1c40f",
    fontWeight: "700",
    fontSize: 10,
    marginTop: 3,
    textAlign: "center",
    textShadowColor: "#000",
    textShadowRadius: 2,
    textShadowOffset: { width: 0, height: 1 },
  },
  discardZone: {
    alignItems: "center",
    justifyContent: "center",
  },
  discardImage: {
    width: 70, // Reducido de 85 a 70
    height: 110, // Reducido de 135 a 110
  },
  placeholderCard: {
    width: 70, // Reducido de 85 a 70
    height: 110, // Reducido de 135 a 110
    backgroundColor: "#333",
    borderRadius: 13,
  },
  spacer: {
    width: 5, // Mismo ancho que el deckZone para equilibrar
  },
  turnHeaderContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    marginBottom: 6, // Reducido de 10 a 6
  },
  turnHeaderCircle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  turnHeaderText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    maxWidth: 200,
    textAlign: "center",
  },
  turnHeaderStack: {
    color: "#f39c12",
    fontSize: 15,
    fontWeight: "700",
    marginLeft: 8,
  },
  centerWrapper: {
    alignItems: "center",
    justifyContent: "center",
    width: 200, // Reducido de 250 a 200
  },
  middleRow: {
    flexDirection: "row",
    alignItems: "stretch",
    justifyContent: "space-between",
  },
  opponentBox: {
    alignItems: "center",
    minWidth: 55, // Reducido de 70 a 55
    maxWidth: 65, // Reducido de 80 a 65
  },
  opponentId: {
    color: "#fff",
    fontSize: 11, // Reducido para ser más compacto
    opacity: 0.8,
  },
  opponentHandRow: {
    flexDirection: "row",
    marginTop: 2,
  },
  backSmallWrapper: {
    width: 22, // Reducido de 26 a 22
    height: 34, // Reducido de 40 a 34
    marginRight: -14, // Ajustado para el nuevo tamaño
  },
  backSmall: {
    width: 22, // Reducido de 26 a 22
    height: 34, // Reducido de 40 a 34
  },
  opponentCount: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12, // Reducido de 14 a 12
    marginTop: 2, // Reducido de 4 a 2
  },
  unoBadge: {
    color: "#e74c3c",
    fontWeight: "800",
    fontSize: 10, // Reducido de 12 a 10
    marginTop: 1, // Reducido de 2 a 1
  },
  handArea: {
    height: 140,
    backgroundColor: "#181818",
    borderTopWidth: 1,
    borderTopColor: "#222",
    borderBottomWidth: 1,
    borderBottomColor: "#222",
    justifyContent: "center",
  },
  handListContentFull: {
    alignItems: "center",
    paddingHorizontal: 50,
    minWidth: "100%",
  },
  handListContainer: {
    flexGrow: 0,
  },
  handContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingHorizontal: 10,
  },
  cardWrapper: {
    width: 72,
    height: 112,
    marginRight: -35,
    alignItems: "center",
    justifyContent: "center",
  },
  cardImage: {
    width: 72,
    height: 112,
  },
  actionBarContainer: {
    flexDirection: "row",
    justifyContent: "space-between", // Cambiado de space-around a space-between
    alignItems: "center",
    height: 56, // Altura fija para evitar layout shifts
    paddingHorizontal: 12,
    backgroundColor: "#111",
    borderTopWidth: 1,
    borderTopColor: "#222",
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  actionBtn: {
    backgroundColor: "#34495e",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  actionText: { color: "#fff", fontWeight: "600" },
  disabledBtn: { opacity: 0.35 },
  dangerBtn: { backgroundColor: "#c0392b" },
  successBtn: { backgroundColor: "#16a085" },
  warnBtn: { backgroundColor: "#f39c12" },
  emptyHandOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  emptyHandText: { color: "#fff", marginBottom: 8 },
  reloadBtn: {
    backgroundColor: "#444",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  reloadBtnText: { color: "#fff", fontWeight: "600" },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  colorWheelWrapper: {
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(30,30,30,0.9)",
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#444",
  },
  colorDot: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    shadowColor: "#000",
    shadowOpacity: 0.6,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
    borderWidth: 3,
    borderColor: "#111",
  },
  closeColorPicker: {
    position: "absolute",
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#222",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  dragOverlayCard: {
    position: "absolute",
    bottom: 150,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 999,
    elevation: 999,
    pointerEvents: "none",
  },
  dragImageSmall: { width: 100, height: 156 },
  meOverlayAvatarCentered: {
    position: "absolute",
    top: 2,
    left: "50%",
    transform: [{ translateX: -27 }],
    width: 54,
    alignItems: "center",
    zIndex: 10,
  },
  meAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "#2ecc71",
  },
  meAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#444",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#555",
  },
  meAvatarLetter: { color: "#fff", fontWeight: "700", fontSize: 20 },
  meAvatarNameSmall: {
    color: "#fff",
    fontSize: 10,
    marginTop: 2,
    maxWidth: 54,
    textAlign: "center",
  },
  opponentAvatar: {
    width: 34, // Reducido de 40 a 34
    height: 34, // Reducido de 40 a 34
    borderRadius: 17, // Ajustado al nuevo tamaño
    borderWidth: 2,
    borderColor: "#3498db",
    marginBottom: 3, // Reducido de 4 a 3
  },
  opponentAvatarPlaceholder: {
    width: 34, // Reducido de 40 a 34
    height: 34, // Reducido de 40 a 34
    borderRadius: 17, // Ajustado al nuevo tamaño
    backgroundColor: "#333",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 3, // Reducido de 4 a 3
    borderWidth: 2,
    borderColor: "#444",
  },
  opponentAvatarLetter: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14, // Reducido de 16 (por defecto) a 14
  },
});

function Opponent({
  player,
  unoPlayers,
  shrink,
  responsiveStyles,
  responsiveSize,
}) {
  const unoFlag = unoPlayers.find((u) => u.playerId === player.id);
  const back = getUnoBackImage();
  const stacks = Math.min(player.handCount, 6);
  const arr = Array.from({ length: stacks });
  const displayName = player.name || player.username || "?";
  const avatarUrl = player.avatarUrl;

  // Usar tamaños responsivos si están disponibles, si no, usar estilos fijos
  const avatarStyle = responsiveStyles
    ? responsiveStyles.responsiveOpponentAvatar
    : styles.opponentAvatar;
  const avatarPlaceholderStyle = responsiveStyles
    ? responsiveStyles.responsiveOpponentAvatarPlaceholder
    : styles.opponentAvatarPlaceholder;

  return (
    <View
      style={[styles.opponentBox, shrink && { transform: [{ scale: 0.9 }] }]}
    >
      {avatarUrl ? (
        <Image
          source={{ uri: avatarUrl }}
          style={[
            avatarStyle,
            shrink &&
              responsiveSize && {
                width: responsiveSize.avatarSize * 0.85,
                height: responsiveSize.avatarSize * 0.85,
                borderRadius: (responsiveSize.avatarSize * 0.85) / 2,
              },
          ]}
        />
      ) : (
        <View
          style={[
            avatarPlaceholderStyle,
            shrink &&
              responsiveSize && {
                width: responsiveSize.avatarSize * 0.85,
                height: responsiveSize.avatarSize * 0.85,
                borderRadius: (responsiveSize.avatarSize * 0.85) / 2,
              },
          ]}
        >
          <Text
            style={[
              styles.opponentAvatarLetter,
              {
                fontSize: responsiveSize ? responsiveSize.fontSize.medium : 14,
              },
              shrink && {
                fontSize: responsiveSize ? responsiveSize.fontSize.small : 12,
              },
            ]}
          >
            {displayName[0].toUpperCase()}
          </Text>
        </View>
      )}
      <View style={[styles.opponentHandRow, { justifyContent: "center" }]}>
        {arr.map((_, i) => (
          <View
            key={i}
            style={[
              styles.backSmallWrapper,
              responsiveSize && {
                width: responsiveSize.opponentCard.width,
                height: responsiveSize.opponentCard.height,
                marginRight: -(responsiveSize.opponentCard.width * 0.6),
              },
              shrink &&
                responsiveSize && {
                  width: responsiveSize.opponentCard.width * 0.8,
                  height: responsiveSize.opponentCard.height * 0.8,
                  marginRight: -(responsiveSize.opponentCard.width * 0.8 * 0.6),
                },
            ]}
          >
            <Image
              source={back}
              style={[
                styles.backSmall,
                responsiveSize && {
                  width: responsiveSize.opponentCard.width,
                  height: responsiveSize.opponentCard.height,
                },
                shrink &&
                  responsiveSize && {
                    width: responsiveSize.opponentCard.width * 0.8,
                    height: responsiveSize.opponentCard.height * 0.8,
                  },
              ]}
            />
          </View>
        ))}
      </View>
      <Text
        style={[
          styles.opponentId,
          {
            marginTop: 2,
            fontSize: responsiveSize ? responsiveSize.fontSize.small : 11,
          },
        ]}
        numberOfLines={1}
      >
        {displayName}
      </Text>
      <Text
        style={[
          styles.opponentCount,
          { fontSize: responsiveSize ? responsiveSize.fontSize.medium : 12 },
        ]}
      >
        {player.handCount}
      </Text>
      {unoFlag && (
        <Text
          style={[
            styles.unoBadge,
            { fontSize: responsiveSize ? responsiveSize.fontSize.small : 10 },
          ]}
        >
          UNO{unoFlag.graceRemainingMs > 0 ? "*" : ""}
        </Text>
      )}
    </View>
  );
}

function ActionBar({
  isMyTurn,
  hand,
  publicState,
  me,
  otherPlayers,
  onDraw,
  onDeclareUno,
  onCallOut,
  onChallenge,
  onAcceptWild4,
  onChatToggle,
}) {
  const unoData = publicState.uno || [];
  const myHandSize = hand.length;
  const pending = publicState.pendingDrawCount;
  const pendingType = publicState.pendingDrawType;
  const challenge = publicState.wild4Challenge;

  const canDeclareUno =
    isMyTurn && myHandSize === 2 && !unoData.find((u) => u.playerId === me);
  const canCallOut = otherPlayers.some((p) => {
    const flag = unoData.find((u) => u.playerId === p.id);
    return flag && !flag.declared && flag.graceRemainingMs === 0;
  });

  // Challenge activo para mí (soy target del +4 y aún dentro de ventana)
  const challengeActive = challenge && challenge.targetPlayer === me;

  // Puedo desafiar si hay un challenge activo y estoy en la lista de elegibles
  const canChallenge =
    challenge &&
    challenge.eligibleChallengers &&
    challenge.eligibleChallengers.includes(me);

  // Caso especial: si challengeActive => reemplazamos Robar por botones Desafiar / Tomar +N
  // 'Tomar +N' ejecuta onDraw (paga las cartas acumuladas) y avanza turno.
  // Mientras dure el challenge no mostramos declarar UNO ni acusar.
  if (challengeActive) {
    const drawLabel = pending > 0 ? `Tomar +${pending}` : "Tomar +4";
    return (
      <View style={styles.actionBarContainer}>
        {/* Botón de chat a la izquierda */}
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: "#3498db" }]}
          onPress={onChatToggle}
        >
          <Ionicons name="chatbubbles" size={18} color="white" />
        </TouchableOpacity>

        {/* Contenedor para los botones de acción centrales */}
        <View style={{ flexDirection: "row", gap: 10 }}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.dangerBtn]}
            onPress={onChallenge}
          >
            <Text style={styles.actionText}>Desafiar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: "#8e44ad" }]}
            onPress={onDraw}
          >
            <Text style={styles.actionText}>{drawLabel}</Text>
          </TouchableOpacity>
        </View>

        {/* Espaciador a la derecha para balance */}
        <View style={{ width: 40 }} />
      </View>
    );
  }

  // Botón Robar visible en mi turno (si hay acumulación draw2/draw4 stacking y soy el jugador actual)
  const showDraw = isMyTurn;
  const drawLabel = pending > 0 ? `Tomar +${pending}` : "Robar";

  return (
    <View style={styles.actionBarContainer}>
      {/* Botón de chat a la izquierda */}
      <TouchableOpacity
        style={[styles.actionBtn, { backgroundColor: "#3498db" }]}
        onPress={onChatToggle}
      >
        <Ionicons name="chatbubbles" size={18} color="white" />
      </TouchableOpacity>

      {/* Contenedor para los botones de acción centrales */}
      <View style={{ flexDirection: "row", gap: 10 }}>
        {showDraw && (
          <TouchableOpacity
            style={[
              styles.actionBtn,
              pending > 0 && { backgroundColor: "#8e44ad" },
            ]}
            onPress={onDraw}
          >
            <Text style={styles.actionText}>{drawLabel}</Text>
          </TouchableOpacity>
        )}
        {canDeclareUno && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.warnBtn]}
            onPress={onDeclareUno}
          >
            <Text style={styles.actionText}>Decir UNO</Text>
          </TouchableOpacity>
        )}
        {canCallOut && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.dangerBtn]}
            onPress={() => {
              const target = otherPlayers.find((p) => {
                const f = unoData.find((u) => u.playerId === p.id);
                return f && !f.declared && f.graceRemainingMs === 0;
              });
              if (target) onCallOut(target.id);
            }}
          >
            <Text style={styles.actionText}>Acusar</Text>
          </TouchableOpacity>
        )}
        {canChallenge && !challengeActive && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.dangerBtn]}
            onPress={onChallenge}
          >
            <Text style={styles.actionText}>Desafiar +4</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Espaciador a la derecha para balance */}
      <View style={{ width: 40 }} />
    </View>
  );
}

function Countdowns({ publicState, me }) {
  const [_, force] = useState(0);
  useEffect(() => {
    const id = setInterval(() => force((x) => x + 1), 300);
    return () => clearInterval(id);
  }, []);
  const unoData = publicState.uno || [];
  const myUno = unoData.find(
    (u) => u.playerId === me && u.graceRemainingMs > 0
  );
  return (
    <View style={{ marginTop: 4, alignItems: "center" }}>
      {myUno && (
        <Text style={{ color: "#f1c40f", fontSize: 12 }}>
          Decí UNO {Math.ceil(myUno.graceRemainingMs / 1000)}s
        </Text>
      )}
    </View>
  );
}
