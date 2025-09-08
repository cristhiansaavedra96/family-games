import React, { useEffect, useState, useRef, useCallback } from "react";
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
import {
  ChallengeResultModal,
  RoundEndModal,
  DebugPanel,
  UnoClaimResultModal,
} from "../components";
import UnoGameSummaryModal from "../components/GameSummaryModal";
import { SHOW_DEBUG } from "../../../core/config/debug";

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
  scores: {},
  eliminatedPlayers: [],
  roundWinner: null,
};

export default function UnoGameScreen() {
  const params = useLocalSearchParams();
  const roomId = params.roomId;
  const { socket } = useSocket();
  const { syncPlayers, getAvatarUrl, syncAvatar } = useAvatarSync();
  const { myAvatar, myUsername, myName } = useMyAvatar();

  const [publicState, setPublicState] = useState(initialPublic);
  const [hand, setHand] = useState([]); // cartas privadas
  const [me, setMe] = useState(null);
  const [hostId, setHostId] = useState(null);
  const [wildColorModal, setWildColorModal] = useState(null); // cardId en selección
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [challengeResult, setChallengeResult] = useState(null); // resultado del desafío
  const [isDragging, setIsDragging] = useState(false); // estado para drag visual
  // Chat state
  const [chatVisible, setChatVisible] = useState(false);
  const [toastMessages, setToastMessages] = useState([]);
  // Game Summary state
  const [gameSummaryVisible, setGameSummaryVisible] = useState(false);
  const [finalGameData, setFinalGameData] = useState(null);
  const [playersReady, setPlayersReady] = useState({});
  const [countdown, setCountdown] = useState(null); // Estado para el contador 3, 2, 1
  // Round End Modal state
  const [roundEndVisible, setRoundEndVisible] = useState(false);
  const [roundEndData, setRoundEndData] = useState(null);
  // UNO Claim system state
  const [unoClaimResult, setUnoClaimResult] = useState(null); // Resultado del reclamo UNO
  const [playersWithOneCard, setPlayersWithOneCard] = useState([]); // Jugadores con 1 carta que pueden ser reclamados
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

  // Estilo extra para ChatToasts cuando el resumen está activo (asegurar capa superior)
  const chatToastsExtraStyle = gameSummaryVisible
    ? { zIndex: 3000000, elevation: 3000000 }
    : null;

  const DRAG_THRESHOLD = 120; // distancia hacia arriba para jugar
  // Detección de interacción
  const DOUBLE_TAP_DELAY = 260; // ms máximo entre taps
  const TAP_DEADZONE = 10; // px de movimiento permitido para considerarse tap
  const lastTapRef = useRef({ time: 0, cardId: null });
  const touchStartRef = useRef({ x: 0, y: 0 });
  const movedRef = useRef(false); // Para saber si se movió fuera de deadzone

  // PanResponder global eliminado - ahora cada carta maneja su propio drag
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

      // Actualizar estado de jugadores listos
      if (s.playersReady) {
        const readyObj = {};
        s.playersReady.forEach((playerId) => {
          readyObj[playerId] = true;
        });
        setPlayersReady(readyObj);
      }
    };
    const onPrivateHand = ({ hand }) => {
      console.log(
        "[UNO][Frontend] privateHand received:",
        hand ? hand.length : 0,
        "cards"
      );
      setHand(hand || []);
    };
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
    socket.on("unoCalledOut", (data) => {
      console.log("[UNO] unoCalledOut received:", data);

      // Encontrar los nombres de los jugadores
      const targetPlayer = publicState.players.find(
        (p) => p.id === data.target
      );
      const byPlayer = publicState.players.find((p) => p.id === data.by);

      // Mostrar el modal con el resultado
      setUnoClaimResult({
        success: true,
        targetPlayerId: data.target,
        targetPlayerName:
          targetPlayer?.name || targetPlayer?.username || "Jugador",
        targetUsername: targetPlayer?.username,
        byPlayerId: data.by,
        byPlayerName: byPlayer?.name || byPlayer?.username || "Jugador",
        claimerUsername: byPlayer?.username,
        penalty: data.penalty || 2,
      });

      // Auto-cerrar el modal después de 5 segundos
      setTimeout(() => {
        setUnoClaimResult(null);
      }, 5000);
    });
    socket.on("playerAtUno", () => {});
    socket.on("unoStateCleared", () => {});

    // Game Over / Winner event
    socket.on("winner", (data) => {
      console.log("[UNO][Frontend] winner received:", data);
      setFinalGameData(data); // Guardar los datos finales del juego
      setGameSummaryVisible(true);
    });

    // Round End event
    socket.on("roundEnd", (data) => {
      console.log("[UNO][Frontend] roundEnd received:", data);
      console.log(
        "[UNO][Frontend] playersWithScores:",
        data?.playersWithScores
      );
      console.log("[UNO][Frontend] Setting modal visible");
      setRoundEndData(data);
      setRoundEndVisible(true);
    });

    // Nueva ronda iniciada - actualizar estado
    socket.on("newRoundStarted", (data) => {
      console.log("[UNO][Frontend] newRoundStarted received:", data);
      // Cerrar modal de fin de ronda si está abierto
      setRoundEndVisible(false);
      setRoundEndData(null);

      // Forzar solicitud del estado Y mano privada después de un pequeño delay
      setTimeout(() => {
        socket.emit("getState", { roomId });
        socket.emit("requestPrivateHand", { roomId });
      }, 100);
    });

    // Juego iniciado - similar a nueva ronda
    socket.on("gameStarted", (data) => {
      console.log("[UNO][Frontend] gameStarted received:", data);
      // Asegurar que se limpie cualquier estado previo
      setRoundEndVisible(false);
      setRoundEndData(null);
      setGameSummaryVisible(false);
      setPlayersReady({});

      // Forzar solicitud del estado Y mano privada después de un pequeño delay
      setTimeout(() => {
        socket.emit("getState", { roomId });
        socket.emit("requestPrivateHand", { roomId });
      }, 100);
    });

    // Ready state for play again functionality
    // Nota: playersReady ahora se maneja en onState

    // Debug result listener
    socket.on("debugWinPlayerResult", (result) => {
      console.log(`[DEBUG] Received debugWinPlayerResult:`, result);
      if (result.ok) {
        console.log(`[DEBUG] Player win successful! Winner:`, result.winner);
      } else {
        console.error(`[DEBUG] Player win failed. Reason:`, result.reason);
        // Mostrar toast de error si es necesario
        if (result.reason === "debug_disabled_in_production") {
          console.warn("[DEBUG] Debug is disabled in production");
        } else if (result.reason === "game_not_active") {
          console.warn("[DEBUG] Game is not active");
        } else if (result.reason === "player_not_in_game") {
          console.warn("[DEBUG] Player not in game");
        }
      }
    });

    // Conectar a la sala con información del jugador
    const connectToRoom = async () => {
      let username = myUsername;
      let name = myName;

      // Si no tenemos la información, intentar obtenerla del storage
      if (!username || !name) {
        try {
          const { loadItem } = await import("../../../core/storage");
          if (!username) username = await loadItem("profile:username");
          if (!name) name = await loadItem("profile:name");
        } catch (error) {
          console.warn("Could not load profile data:", error);
        }
      }

      // Unirse a la sala (esto dispara ensurePlayerInSingleRoom en el backend)
      socket.emit("joinRoom", {
        roomId,
        player: { username, name },
      });

      // Pedir estado inicial y mano privada
      socket.emit("getState", { roomId });
      socket.emit("requestPrivateHand", { roomId });
    };
    connectToRoom();

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
      socket.off("winner");
      socket.off("roundEnd");
      socket.off("newRoundStarted");
      socket.off("gameStarted");
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

  // Efecto para auto-solicitar cartas cuando están vacías pero el juego ha comenzado
  useEffect(() => {
    if (!socket || !me || !publicState.started) return;

    // Si el juego ha comenzado, tengo mi ID, pero no tengo cartas
    if (hand.length === 0 && publicState.started && !publicState.gameEnded) {
      console.log(
        "[UNO][Frontend] Auto-requesting private hand - game started but no cards"
      );
      const timer = setTimeout(() => {
        socket.emit("requestPrivateHand", { roomId });
      }, 500); // Pequeño delay para evitar spam

      return () => clearTimeout(timer);
    }
  }, [
    socket,
    me,
    publicState.started,
    publicState.gameEnded,
    hand.length,
    roomId,
  ]);

  // Efecto para detectar cambios en la cantidad de cartas
  useEffect(() => {
    console.log(`[UNO][Frontend] Hand updated: ${hand.length} cards`);
    if (hand.length > 0) {
      console.log(
        "[UNO][Frontend] Cards loaded successfully:",
        hand.map((c) => `${c.color}-${c.kind}-${c.value}`)
      );
    }
  }, [hand.length]);

  // 🔧 detectar jugadores con una sola carta para habilitar reclamo UNO
  useEffect(() => {
    if (!publicState.started || publicState.gameEnded) {
      setPlayersWithOneCard([]);
      return;
    }

    const oneCardPlayers = publicState.players.filter(
      (player) => player.handCount === 1 && player.id !== me
    );

    setPlayersWithOneCard(oneCardPlayers.map((p) => p.id));
  }, [publicState.players, publicState.started, publicState.gameEnded, me]);

  // 🔧 detectar cuando todos los jugadores están listos para nueva partida
  useEffect(() => {
    const totalPlayers = publicState.players?.length || 0;
    const readyPlayerIds = Object.keys(playersReady).filter(
      (id) => playersReady[id]
    );
    const readyCount = readyPlayerIds.length;

    if (
      totalPlayers > 0 &&
      readyCount === totalPlayers &&
      gameSummaryVisible &&
      !countdown
    ) {
      console.log("🎮 UNO - Todos listos - iniciando contador");
      startCountdown();
    }
  }, [playersReady, publicState.players, gameSummaryVisible, countdown]);

  // Función para iniciar el contador de 5, 4, 3, 2, 1
  const startCountdown = useCallback(() => {
    setCountdown(5);

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null) {
          clearInterval(countdownInterval);
          return null;
        }

        if (prev === 1) {
          setTimeout(() => {
            setGameSummaryVisible(false);
            setPlayersReady({});
            setFinalGameData(null);
          }, 50);
          clearInterval(countdownInterval);
          return null;
        }

        return prev - 1;
      });
    }, 1000);
  }, []);

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
    scores: s.scores || {},
    eliminatedPlayers: s.eliminatedPlayers || [],
    roundWinner: s.roundWinner || null,
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

  const handleClaimUno = (targetId) => {
    console.log(`[UNO] Reclamando UNO a jugador: ${targetId}`);
    socket.emit("callOutUno", { roomId, targetPlayerId: targetId });

    // Escuchar resultado del reclamo
    const onUnoClaimResult = (result) => {
      console.log("[UNO] Resultado del reclamo UNO:", result);
      if (result.success) {
        setUnoClaimResult(result);

        // Auto-cerrar el modal después de 5 segundos
        setTimeout(() => {
          setUnoClaimResult(null);
        }, 5000);
      }

      socket.off("callOutUnoResult", onUnoClaimResult);
    };

    socket.on("callOutUnoResult", onUnoClaimResult);
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

  // Game Summary handlers
  const handleCloseSummary = () => {
    setGameSummaryVisible(false);
    setFinalGameData(null); // Limpiar los datos finales
    router.back(); // Volver a la lista de salas
  };

  const handlePlayAgain = () => {
    if (playersReady[me]) return; // Ya está listo
    socket.emit("readyForNewGame", { roomId });
    setPlayersReady((prev) => ({ ...prev, [me]: true }));
  };

  // Maneja el single tap (selección) y double tap (jugar carta)
  const handleTapCard = (card) => {
    if (!isMyTurn) return;
    const now = Date.now();
    const { time: lastTime, cardId: lastId } = lastTapRef.current;
    if (lastId === card.id && now - lastTime < DOUBLE_TAP_DELAY) {
      // Double tap: jugar carta
      lastTapRef.current = { time: 0, cardId: null };
      playCard(card);
      setSelectedCardId(null);
      return;
    }
    // Single tap: seleccionar
    lastTapRef.current = { time: now, cardId: card.id };
    setSelectedCardId(card.id);
  };

  const renderCard = ({ item, index }) => {
    const img = getUnoCardImage(item);
    const selected = selectedCardId === item.id;

    // Determinar si la carta es jugable (reglas espejo del backend)
    const isPlayable = (() => {
      // Solo interesa si es mi turno; si no, marcamos no jugable para el efecto visual pero sin interacción
      if (!isMyTurn) return false;
      const state = publicState;
      if (!state || !state.topCard) return false;

      // Stacking activo
      if (state.pendingDrawCount > 0) {
        if (state.pendingDrawType === "draw2" && item.kind === "draw2")
          return true;
        if (
          state.pendingDrawType === "wild_draw4" &&
          item.kind === "wild_draw4"
        )
          return true;
        return false;
      }

      // Wilds siempre jugables
      if (item.kind === "wild" || item.kind === "wild_draw4") return true;

      // Coincidir por color (usar currentColor si existe, sino el color de topCard)
      const activeColor = state.currentColor || state.topCard.color;
      if (item.color && item.color === activeColor) return true;

      // Coincidir por tipo/valor con la carta superior
      const topCard = state.topCard;

      // Si ambas son cartas numéricas, comparar valor
      if (item.kind === "number" && topCard.kind === "number") {
        return item.value === topCard.value;
      }

      // Si ambas son del mismo tipo especial (skip, reverse, draw2)
      if (item.kind !== "number" && item.kind === topCard.kind) {
        return true;
      }

      return false;
    })();

    // Efecto visual de selección mejorado (sin borde): levantar + glow
    const cardScale = selected ? 1.0 : 1.0;
    const cardMarginRight = selected ? -25 : -35; // Menos superposición cuando está seleccionada
    // zIndex incremental evita que se solapen overlays de cartas anteriores creando "bandas"
    const cardZIndex = selected ? 1000 : index + 1;
    const liftTranslate = selected && !isDragging ? -2 : 0; // levantamiento más sutil

    // PanResponder individual para cada carta para drag directo
    const cardPanResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => isMyTurn && isPlayable,
      onMoveShouldSetPanResponder: (_, g) => {
        if (!isMyTurn || !isPlayable) return false;
        // Si ya estamos activos arrastrando, continuar
        if (dragActive.current) return true;
        // Detectar si se excedió deadzone para iniciar drag
        const moved =
          Math.abs(g.dx) > TAP_DEADZONE || Math.abs(g.dy) > TAP_DEADZONE;
        return moved; // Solo si se movió iniciamos pan responder para drag
      },
      onPanResponderGrant: (e) => {
        if (!isMyTurn || !isPlayable) return;
        const { pageX, pageY } = e.nativeEvent;
        touchStartRef.current = { x: pageX, y: pageY };
        movedRef.current = false;
        // No activamos drag aún; esperamos a superar deadzone en move
      },
      onPanResponderMove: (_, g) => {
        if (!isMyTurn || !isPlayable) return;
        const moved =
          Math.abs(g.dx) > TAP_DEADZONE || Math.abs(g.dy) > TAP_DEADZONE;
        if (moved) movedRef.current = true;
        if (moved && !dragActive.current) {
          // Activar drag ahora
          setSelectedCardId(item.id);
          dragCardId.current = item.id;
          dragActive.current = true;
          setIsDragging(true);
        }
        if (dragActive.current) {
          if (g.dy < 0) dragY.setValue(g.dy);
          dragX.setValue(g.dx * 0.5);
        }
      },
      onPanResponderRelease: (e, g) => {
        if (!isMyTurn || !isPlayable) return;
        const wasDragging = dragActive.current;
        dragActive.current = false;
        dragCardId.current = null;
        setIsDragging(false);

        if (wasDragging) {
          // Caso drag
          if (g.dy < -DRAG_THRESHOLD) {
            playCard(item);
            setSelectedCardId(null);
          } else {
            // Volver a posición original; mantener selección un instante
            setTimeout(() => {
              setSelectedCardId(null);
            }, 120);
          }
          Animated.parallel([
            Animated.spring(dragY, { toValue: 0, useNativeDriver: true }),
            Animated.spring(dragX, { toValue: 0, useNativeDriver: true }),
          ]).start();
          return;
        }

        // Si no hubo drag (deadzone), esto es un tap
        handleTapCard(item);
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderTerminate: () => {
        dragActive.current = false;
        dragCardId.current = null;
        setIsDragging(false);
        Animated.parallel([
          Animated.spring(dragY, { toValue: 0, useNativeDriver: true }),
          Animated.spring(dragX, { toValue: 0, useNativeDriver: true }),
        ]).start();
      },
    });

    return (
      <Animated.View
        {...cardPanResponder.panHandlers}
        style={[
          styles.cardWrapper,
          {
            marginRight: cardMarginRight,
            zIndex: cardZIndex,
            elevation: selected ? 50 : 0,
            // Solo bajar opacidad temporal al arrastrar la carta seleccionada
            opacity: isDragging && selected ? 0.3 : 1.0,
            transform: [{ scale: cardScale }, { translateY: liftTranslate }],
          },
        ]}
      >
        {selected && !isDragging && (
          <View style={styles.cardGlowContainer} pointerEvents="none">
            <View style={styles.cardGlow} />
          </View>
        )}
        <Image source={img} style={styles.cardImage} resizeMode="contain" />
      </Animated.View>
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

  // Props comunes para PlayerSlot
  const getPlayerSlotProps = (position, player) => ({
    position,
    player,
    unoPlayers,
    shrink: shrinkOpponents,
    responsiveStyles,
    responsiveSize,
    scores: publicState.scores,
    eliminatedPlayers: publicState.eliminatedPlayers,
    getAvatarUrl,
    playersWithOneCard,
    onClaimUno: handleClaimUno,
    me,
  });

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
              {...getPlayerSlotProps("1x1", positionedPlayers["1x1"])}
            />
            <PlayerSlot
              {...getPlayerSlotProps("1x2", positionedPlayers["1x2"])}
            />
            <PlayerSlot
              {...getPlayerSlotProps("1x3", positionedPlayers["1x3"])}
            />
          </View>

          {/* Fila media (2x1, 2x3) - más cerca de la primera */}
          <View style={responsiveStyles.responsiveMatrixRow}>
            <PlayerSlot
              {...getPlayerSlotProps("2x1", positionedPlayers["2x1"])}
            />
            <View
              style={[
                styles.spacerForCenter,
                { width: responsiveSize.playerSlot },
              ]}
            />
            <PlayerSlot
              {...getPlayerSlotProps("2x3", positionedPlayers["2x3"])}
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
              {...getPlayerSlotProps("5x1", positionedPlayers["5x1"])}
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
              {/* Mostrar mis puntos */}
              {publicState.scores && publicState.scores[me] !== undefined && (
                <Text
                  style={[
                    styles.placeholderSubtext,
                    {
                      fontSize: responsiveSize.fontSize.small,
                      color: "#f39c12",
                      fontWeight: "bold",
                    },
                  ]}
                >
                  {publicState.scores[me]}pts
                </Text>
              )}
            </View>

            <PlayerSlot
              {...getPlayerSlotProps("5x3", positionedPlayers["5x3"])}
            />
          </View>
        </View>
      </View>

      {/* ActionBar movida arriba de las cartas con altura fija para evitar layout shifts */}
      {!publicState.gameEnded && (
        <ActionBar
          isMyTurn={isMyTurn}
          hand={hand}
          publicState={publicState}
          me={me}
          otherPlayers={otherPlayers}
          onDraw={handleDraw}
          onDeclareUno={handleDeclareUno}
          onChallenge={handleChallenge}
          onAcceptWild4={handleAcceptWild4}
          onChatToggle={() => setChatVisible(true)}
          playersWithOneCard={playersWithOneCard}
          onClaimUno={handleClaimUno}
          socket={socket}
          roomId={roomId}
        />
      )}

      <View style={styles.handArea}>
        {/* Avatar movido a la posición 5x2 arriba - aquí solo van las cartas para ocupar todo el horizontal */}
        <View style={styles.handContainer}>
          <FlatList
            data={hand}
            horizontal
            keyExtractor={(c) => c.id}
            renderItem={({ item, index }) => renderCard({ item, index })}
            contentContainerStyle={styles.handListContentFull}
            showsHorizontalScrollIndicator={false}
            style={styles.handListContainer}
            extraData={`${hand.length}-${selectedCardId}-${isDragging}`} // Forzar re-render cuando cambien estos estados
            removeClippedSubviews={false} // Evitar que se clipeen las cartas
            initialNumToRender={10} // Renderizar más cartas inicialmente
            maxToRenderPerBatch={5} // Renderizar en lotes más pequeños
            updateCellsBatchingPeriod={50} // Actualizar más frecuentemente
            windowSize={10} // Mantener más items en memoria
          />
        </View>
        {hand.length === 0 && publicState.started && (
          <View style={styles.emptyHandOverlay}>
            <Text style={styles.emptyHandText}>Sin cartas recibidas</Text>
            <Text style={styles.emptyHandSubtext}>
              Jugador: {me || "No definido"} | Juego iniciado:{" "}
              {publicState.started ? "Sí" : "No"}
            </Text>
            <TouchableOpacity
              style={styles.reloadBtn}
              onPress={() => {
                console.log("[UNO][Frontend] Manual request for private hand");
                socket.emit("requestPrivateHand", { roomId });
              }}
            >
              <Text style={styles.reloadBtnText}>Recargar mano</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.reloadBtn,
                { backgroundColor: "#555", marginTop: 8 },
              ]}
              onPress={() => {
                console.log("[UNO][Frontend] Manual request for state");
                socket.emit("getState", { roomId });
              }}
            >
              <Text style={styles.reloadBtnText}>Recargar estado</Text>
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

      {/* Overlay de drag global para mostrar la carta fuera del contenedor */}
      {isDragging && selectedCardId && (
        <Animated.View
          style={[
            styles.dragOverlayCard,
            {
              transform: [
                { translateY: dragY },
                { translateX: dragX },
                { scale: 1.0 },
              ],
            },
          ]}
          pointerEvents="none"
        >
          {(() => {
            const card = hand.find((c) => c.id === selectedCardId);
            if (!card) return null;
            return (
              <Image
                source={getUnoCardImage(card)}
                style={styles.dragImageSmall}
                resizeMode="contain"
              />
            );
          })()}
        </Animated.View>
      )}

      {/* Overlay de drag eliminado - ahora las cartas se arrastran desde su posición original */}

      {/* Chat Toasts */}
      <ChatToasts
        messages={toastMessages}
        onItemComplete={(id) =>
          setToastMessages((prev) => prev.filter((m) => m.id !== id))
        }
        extraContainerStyle={chatToastsExtraStyle}
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

      {/* UNO Claim Result Modal */}
      <UnoClaimResultModal
        visible={!!unoClaimResult}
        unoClaimResult={unoClaimResult}
        getAvatarUrl={getAvatarUrl}
        onClose={() => setUnoClaimResult(null)}
        currentColor={publicState.currentColor}
      />

      {/* Game Summary Modal */}
      <UnoGameSummaryModal
        visible={gameSummaryVisible}
        players={publicState.players}
        winner={publicState.winner}
        finalGameData={finalGameData} // Pasar los datos finales del juego
        playersReady={playersReady}
        me={me}
        getAvatarUrl={getAvatarUrl} // Pasar la función getAvatarUrl
        onClose={handleCloseSummary}
        onPlayAgain={handlePlayAgain}
        onSendMessage={async (messageData) => {
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
        }}
      />

      {/* Round End Modal */}
      <RoundEndModal
        visible={roundEndVisible}
        roundData={roundEndData}
        getAvatarUrl={getAvatarUrl}
        onClose={() => {
          setRoundEndVisible(false);
          setRoundEndData(null);
        }}
      />

      {/* Debug Panel - Solo en desarrollo */}
      <DebugPanel
        players={publicState.players || []}
        roomId={roomId}
        socket={socket}
        visible={publicState.started && !publicState.gameEnded}
      />

      {/* Contador 5-4-3-2-1 */}
      {countdown && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.8)",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000000,
          }}
        >
          <View
            style={{
              width: 200,
              height: 200,
              borderRadius: 100,
              backgroundColor: "#e74c3c",
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#000",
              shadowOpacity: 0.3,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 5 },
              elevation: 10,
            }}
          >
            <Text
              style={{
                fontSize: 80,
                fontWeight: "800",
                color: "#fff",
              }}
            >
              {countdown}
            </Text>
          </View>
          <Text
            style={{
              marginTop: 30,
              fontSize: 24,
              fontWeight: "700",
              color: "#fff",
              textAlign: "center",
            }}
          >
            Nueva partida comenzando...
          </Text>
        </View>
      )}
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
  scores,
  eliminatedPlayers,
  getAvatarUrl,
  playersWithOneCard,
  onClaimUno,
  me,
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
        scores={scores}
        eliminatedPlayers={eliminatedPlayers}
        getAvatarUrl={getAvatarUrl}
        playersWithOneCard={playersWithOneCard}
        onClaimUno={onClaimUno}
        me={me}
      />
    );
  }

  // Si no hay jugador, mostrar placeholder (visible solo si SHOW_DEBUG está habilitado)
  return (
    <View
      style={[
        responsiveStyles.responsivePlayerSlot,
        shrink && { transform: [{ scale: 0.8 }] },
        !SHOW_DEBUG && { opacity: 0 }, // Invisible pero mantiene el espacio
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
  opponentScore: {
    color: "#f39c12",
    fontWeight: "600",
    fontSize: 10,
    marginTop: 1,
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
    overflow: "visible",
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
    overflow: "visible",
  },
  cardWrapper: {
    width: 72,
    height: 112,
    marginRight: -35,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    overflow: "hidden", // Evita que bordes superpuestos generen líneas claras
    position: "relative", // Necesario para que zIndex funcione de forma consistente (Android)
  },
  cardImage: {
    width: 72,
    height: 112,
  },
  cardGlowContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  cardGlow: {
    position: "absolute",
    width: 72,
    height: 112,
    borderRadius: 12,
    backgroundColor: "#f5c54233", // suave amarillo translúcido
    shadowColor: "#f1c40f",
    shadowOpacity: 0.9,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  cardDisabledOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // Overlay simple sin bordes redondeados para evitar artefactos blancos
    backgroundColor: "rgba(0,0,0,0.35)",
    // Remover borderRadius para evitar rayas blancas por desalineación
    zIndex: 20,
    elevation: 20,
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
  emptyHandSubtext: {
    color: "#bbb",
    fontSize: 12,
    marginBottom: 8,
    textAlign: "center",
  },
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
  scores,
  eliminatedPlayers,
  getAvatarUrl,
  playersWithOneCard,
  onClaimUno,
  me,
}) {
  const unoFlag = unoPlayers.find((u) => u.playerId === player.id);
  const back = getUnoBackImage();
  const stacks = Math.min(player.handCount, 6);
  const arr = Array.from({ length: stacks });
  const displayName = player.name || player.username || "?";
  const avatarUrl = getAvatarUrl(player.username);
  const playerScore = scores[player.id] || 0;
  const isEliminated = eliminatedPlayers.includes(player.id);

  // Usar tamaños responsivos si están disponibles, si no, usar estilos fijos
  const avatarStyle = responsiveStyles
    ? responsiveStyles.responsiveOpponentAvatar
    : styles.opponentAvatar;
  const avatarPlaceholderStyle = responsiveStyles
    ? responsiveStyles.responsiveOpponentAvatarPlaceholder
    : styles.opponentAvatarPlaceholder;

  return (
    <View
      style={[
        styles.opponentBox,
        shrink && { transform: [{ scale: 0.9 }] },
        isEliminated && { opacity: 0.5 },
      ]}
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
            isEliminated && { borderColor: "#e74c3c" },
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
            isEliminated && { borderColor: "#e74c3c" },
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
          isEliminated && {
            color: "#e74c3c",
            textDecorationLine: "line-through",
          },
        ]}
        numberOfLines={1}
      >
        {displayName} {isEliminated && "(ELIM)"}
      </Text>
      <Text
        style={[
          styles.opponentCount,
          { fontSize: responsiveSize ? responsiveSize.fontSize.medium : 12 },
        ]}
      >
        {player.handCount}
      </Text>
      <Text
        style={[
          styles.opponentScore,
          { fontSize: responsiveSize ? responsiveSize.fontSize.small : 10 },
          isEliminated && { color: "#e74c3c" },
        ]}
      >
        {playerScore}pts
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

      {/* Botón de reclamar UNO */}
      {playersWithOneCard &&
        playersWithOneCard.includes(player.id) &&
        onClaimUno &&
        !unoFlag &&
        !isEliminated && (
          <TouchableOpacity
            style={{
              position: "absolute",
              bottom: -5,
              right: -5,
              backgroundColor: "#e74c3c",
              borderRadius: 12,
              padding: 4,
              borderWidth: 1,
              borderColor: "#fff",
              shadowColor: "#000",
              shadowOpacity: 0.3,
              shadowRadius: 3,
              shadowOffset: { width: 1, height: 1 },
              elevation: 3,
            }}
            onPress={() => onClaimUno(player.id)}
          >
            <Text
              style={{
                color: "#fff",
                fontSize: 8,
                fontWeight: "bold",
              }}
            >
              UNO!
            </Text>
          </TouchableOpacity>
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
  onChallenge,
  onAcceptWild4,
  onChatToggle,
  playersWithOneCard,
  onClaimUno,
  socket,
  roomId,
}) {
  // Forzar re-render para actualizar graceRemainingMs en tiempo real
  const [_, force] = useState(0);
  useEffect(() => {
    // Solo activar el temporizador si hay jugadores en estado UNO
    const unoData = publicState.uno || [];
    if (unoData.length > 0 && socket && roomId) {
      const id = setInterval(() => {
        force((x) => x + 1);
        // Solicitar estado actualizado al backend para obtener graceRemainingMs actualizado
        socket.emit("getState", { roomId });
      }, 300);
      return () => clearInterval(id);
    }
  }, [publicState.uno, socket, roomId]);

  const unoData = publicState.uno || [];
  const myHandSize = hand.length;
  const pending = publicState.pendingDrawCount;
  const pendingType = publicState.pendingDrawType;
  const challenge = publicState.wild4Challenge;

  const canDeclareUno =
    myHandSize === 1 && unoData.find((u) => u.playerId === me && !u.declared);

  // Challenge activo para mí (soy target del +4 y aún dentro de ventana)
  const challengeActive = challenge && challenge.targetPlayer === me;

  // Puedo desafiar si hay un challenge activo y estoy en la lista de elegibles
  const canChallenge =
    challenge &&
    challenge.eligibleChallengers &&
    challenge.eligibleChallengers.includes(me);

  // Detectar jugadores que pueden ser reclamados por UNO
  const playersToClaimUno = otherPlayers.filter((p) => {
    // Buscar en unoData si este jugador tiene información de UNO
    const unoFlag = unoData.find((u) => u.playerId === p.id);

    // Condiciones para poder reclamar:
    // 1. El jugador tiene 1 carta (está en playersWithOneCard O tiene unoFlag)
    // 2. No ha declarado UNO (declared = false)
    // 3. El período de gracia ha expirado (graceRemainingMs <= 0)
    const hasOneCard = playersWithOneCard?.includes(p.id) || !!unoFlag;
    const hasNotDeclaredUno = unoFlag && !unoFlag.declared;
    const graceExpired = unoFlag && unoFlag.graceRemainingMs <= 0;

    console.log(
      `[UNO DEBUG] Player ${p.name}: hasOneCard=${hasOneCard}, hasNotDeclaredUno=${hasNotDeclaredUno}, graceExpired=${graceExpired}, graceRemainingMs=${unoFlag?.graceRemainingMs}, declared=${unoFlag?.declared}`
    );

    return hasOneCard && hasNotDeclaredUno && graceExpired;
  });

  // Logs de debug más detallados
  if (unoData.length > 0) {
    console.log(`[UNO DEBUG] === Estado UNO ===`);
    console.log(`[UNO DEBUG] playersWithOneCard:`, playersWithOneCard);
    console.log(`[UNO DEBUG] unoData:`, unoData);
    console.log(
      `[UNO DEBUG] playersToClaimUno:`,
      playersToClaimUno.map((p) => p.name)
    );
    console.log(`[UNO DEBUG] ==================`);
  }

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
        {playersToClaimUno.length > 0 && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.dangerBtn]}
            onPress={() => {
              // Si hay múltiples jugadores, tomar el primero (podrías agregar lógica más sofisticada)
              const targetPlayer = playersToClaimUno[0];
              if (targetPlayer && onClaimUno) {
                onClaimUno(targetPlayer.id);
              }
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
