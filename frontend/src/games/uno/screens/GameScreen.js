import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
  StyleSheet,
  Vibration,
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
import ColorSelectorModal from "../components/ColorSelectorModal";
import { useAvatarSync, useMyAvatar } from "../../../shared/hooks";
import { getUnoCardImage } from "../utils/cardAssets";
import {
  ChallengeResultModal,
  RoundEndModal,
  DebugPanel,
  UnoClaimResultModal,
} from "../components";
import CardEffects from "../components/CardEffects";
import AudioControlPanel from "../components/AudioControlPanel";
import { useBackgroundMusic } from "../hooks/useBackgroundMusic";
import UnoGameSummaryModal from "../components/GameSummaryModal";
import { SHOW_DEBUG } from "../../../core/config/debug";

// Componentes refactorizados
import ActionBar from "../components/ActionBar";
import PlayerSlot from "../components/PlayerSlot";
import CenterTable from "../components/CenterTable";
import HandArea from "../components/HandArea";

// Utilidades y estilos
import {
  shortId,
  getTableBackgroundColor,
  getTableBorderColor,
  getPlayerPositions,
  getResponsiveScale,
  extractUnoState,
} from "../utils/gameHelpers";
import { styles, createResponsiveStyles } from "./GameScreen.styles";

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

  // Hook para música de fondo
  const {
    isPlaying,
    volume,
    showAudioPanel,
    startMusic,
    stopMusic,
    toggleMusic,
    changeVolume,
    toggleAudioPanel,
    closeAudioPanel,
  } = useBackgroundMusic();

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
  // Card effects state
  const [cardEffects, setCardEffects] = useState({
    visible: false,
    cardType: null,
    color: null,
  });
  const [lastPlayedCard, setLastPlayedCard] = useState(null); // Para tracking de la última carta jugada
  const dragY = useRef(new Animated.Value(0)).current;
  const dragX = useRef(new Animated.Value(0)).current;
  const dragCardId = useRef(null);
  const dragActive = useRef(false);
  const centerTableRef = useRef(null); // Referencia al componente CenterTable

  // Sistema responsivo
  const [screenData, setScreenData] = useState(Dimensions.get("window"));

  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) =>
      setScreenData(window)
    );
    return () => subscription?.remove?.();
  }, []);

  // Calcular tamaños dinámicos
  const scale = getResponsiveScale(screenData.height);

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
    marginVertical: Math.round(2 * scale), // Reducido de 4 a 2

    // Espaciados específicos del centro
    centerHeight: isReallySmallScreen
      ? Math.round(80 * scale) // Mucho más compacto para Galaxy S23
      : isSmallScreen
      ? Math.round(100 * scale)
      : Math.round(120 * scale), // Más compacto en pantallas pequeñas
    centerMarginTop: isReallySmallScreen
      ? -20 // Mucho más agresivo para Galaxy S23
      : isSmallScreen
      ? -5 // Reducido de -2 a -5
      : isLargeScreen
      ? 5 // Reducido de 8 a 5
      : 2, // Reducido de 5 a 2
    centerMarginBottom: isReallySmallScreen
      ? 2 // Muy poco espacio abajo para Galaxy S23
      : isSmallScreen
      ? 3 // Reducido de 6 a 3
      : isLargeScreen
      ? 10 // Reducido de 15 a 10
      : 6, // Reducido de 10 a 6

    // Espaciado para la última fila - más conservador en pantallas pequeñas
    bottomRowMarginTop: isReallySmallScreen
      ? 10 // Reducido de 15 a 10
      : isSmallScreen
      ? 3 // Reducido de 5 a 3
      : isLargeScreen
      ? 15 // Reducido de 25 a 15
      : 8, // Reducido de 15 a 8
    bottomRowMarginBottom: isReallySmallScreen
      ? 6 // Reducido de 8 a 6
      : isSmallScreen
      ? 2 // Reducido de 3 a 2
      : isLargeScreen
      ? 6 // Reducido de 8 a 6
      : 3, // Reducido de 5 a 3

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

  // Determinar si es mi turno
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
      const newUnoState = extractUnoState(s);

      setPublicState((prev) => {
        // Si los nuevos players están vacíos pero teníamos datos antes, preservar los anteriores
        if (!newUnoState.players && prev.players && prev.players.length > 0) {
          return { ...prev, ...newUnoState, players: prev.players };
        }
        return { ...prev, ...newUnoState };
      });

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

    // Listener para cuando se juega una carta exitosamente (backup/redundancia)
    socket.on("playCardResult", (result) => {
      console.log("[UNO][Frontend] playCardResult received:", result);
      // Las animaciones principales ahora se manejan automáticamente en CenterTable
      // Este listener se mantiene como fallback para casos donde el estado no se actualice inmediatamente

      // Limpiar la carta guardada después de un momento
      setTimeout(() => {
        setLastPlayedCard(null);
      }, 1000);
    }); // Eventos específicos UNO (placeholders para futura UI avanzada)
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
      socket.off("playCardResult");
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

  // 🔧 Vibración cuando un rival juega una carta
  const previousCurrentPlayer = useRef(publicState.currentPlayer);
  useEffect(() => {
    // Solo vibrar si el juego ha empezado y hay un cambio de turno
    if (!publicState.started || publicState.gameEnded) return;

    const currentPlayer = publicState.currentPlayer;
    const prevPlayer = previousCurrentPlayer.current;

    // Si cambió el jugador actual y el anterior no era yo, vibrar
    if (currentPlayer !== prevPlayer && prevPlayer && prevPlayer !== me) {
      Vibration.vibrate(100); // Vibración corta de 100ms
    }

    previousCurrentPlayer.current = currentPlayer;
  }, [
    publicState.currentPlayer,
    publicState.started,
    publicState.gameEnded,
    me,
  ]);

  // 🎵 Control de música de fondo según el estado del juego
  useEffect(() => {
    if (publicState.started && !publicState.gameEnded && !isPlaying) {
      // Solo iniciar música automáticamente cuando empiece el juego
      // No parar automáticamente para respetar la elección del usuario
      startMusic();
    }
    // Nota: No paramos la música automáticamente cuando termina el juego
    // para que el usuario mantenga control manual
  }, [publicState.started, publicState.gameEnded, isPlaying]); // Removido stopMusic

  // 🧹 Limpiar música al desmontar el componente
  useEffect(() => {
    return () => {
      if (isPlaying) {
        stopMusic();
      }
    };
  }, []); // Solo ejecutar al montar/desmontar

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

    // Guardar la carta que se está jugando para usar en animaciones
    setLastPlayedCard(card);
    console.log(
      "[UNO][Frontend] Setting lastPlayedCard:",
      card.kind,
      card.color
    );

    if (card.kind === "wild" || card.kind === "wild_draw4") {
      // Para cartas Wild, NO mostrar efectos hasta seleccionar color
      setWildColorModal(card.id);
      return;
    }

    // Solo para cartas normales, mostrar efectos inmediatamente
    const cardColor = card.color || "#FFD700";
    setCardEffects({
      visible: true,
      cardType: card.kind,
      color: cardColor,
    });

    socket.emit("playCard", { roomId, cardId: card.id, chosenColor: null });
  };

  const confirmWildColor = (color) => {
    if (!wildColorModal) return;

    // Buscar la carta wild en la mano para guardarla
    const wildCard = hand.find((card) => card.id === wildColorModal);
    if (wildCard) {
      setLastPlayedCard(wildCard);
    }

    // AHORA SÍ mostrar efectos después de seleccionar el color
    setCardEffects({
      visible: true,
      cardType: wildCard?.kind || "wild",
      color: color,
    });

    console.log("[UNO][Frontend] Playing wild card with color:", color);

    socket.emit("playCard", {
      roomId,
      cardId: wildColorModal,
      chosenColor: color,
    });

    setWildColorModal(null);
    // Las animaciones del centro ahora se manejan automáticamente
    // cuando el estado público se actualiza desde el servidor
  };

  const cancelWild = () => {
    // Cerrar el modal sin realizar ninguna acción
    // La carta debería permanecer en la mano del jugador
    // ya que nunca se envió al servidor para cartas wild
    setWildColorModal(null);

    // Log para debug - verificar que la carta sigue en la mano
    console.log("Modal de color cancelado - carta debería permanecer en mano");
  };

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

  const otherPlayers = publicState.players.filter((p) => p.id !== me);
  const unoPlayers = publicState.uno || [];

  // Posiciones según el número total de jugadores
  const usedPositions = getPlayerPositions(
    publicState.players.length,
    SHOW_DEBUG
  );

  // Asignar jugadores a posiciones
  const positionedPlayers = {};

  if (SHOW_DEBUG && publicState.players.length === 2) {
    // En modo debug con 1 vs 1, llenar todas las posiciones con el adversario
    const opponent = otherPlayers[0]; // El único oponente
    if (opponent) {
      usedPositions.forEach((position) => {
        positionedPlayers[position] = opponent;
      });
    }
  } else {
    // Comportamiento normal
    otherPlayers.forEach((player, index) => {
      if (usedPositions[index]) {
        positionedPlayers[usedPositions[index]] = player;
      }
    });
  }

  const shrinkOpponents = otherPlayers.length > 6;

  // Display name propio (asegurar disponible antes del render)
  const myPlayerMeta = publicState.players.find((p) => p.id === me);
  const myDisplayName =
    myPlayerMeta?.name || myPlayerMeta?.username || myUsername || "?";

  // Debug para mi jugador
  console.log("GameScreen - Mi jugador debug:", {
    me,
    myUsername,
    myDisplayName,
    myAvatar,
    myPlayerMeta,
  });

  // Crear estilos responsivos dinámicos
  const responsiveStyles = createResponsiveStyles(responsiveSize);

  // Detectar número de jugadores activos para escalado especial
  const activePlayers =
    publicState.players?.filter(
      (p) => !publicState.eliminatedPlayers?.includes(p.id)
    ) || [];
  const activePlayerCount = activePlayers.length;

  // Función para determinar si un slot debe tener escala especial
  const shouldEnlargeSlot = (position) => {
    if (activePlayerCount === 2) {
      // En 1v1, agrandar el rival (1x2)
      return position === "1x2";
    } else if (activePlayerCount === 3) {
      // En 3 jugadores, agrandar los rivales (1x1 y 1x3)
      return position === "1x1" || position === "1x3";
    }
    return false;
  };

  // Función para determinar si mi posición (5x2) necesita margen adicional hacia abajo
  const shouldMoveMyPositionDown = (position, player) => {
    // Solo para mi posición cuando hay pocos jugadores
    if (
      position === "5x2" &&
      player &&
      player.id === me &&
      activePlayerCount <= 3
    ) {
      return true;
    }
    return false;
  };

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
    currentPlayer: publicState.currentPlayer, // Agregar información del turno actual
    shouldEnlarge: shouldEnlargeSlot(position), // Agregar información de escalado especial
    shouldMoveDown: shouldMoveMyPositionDown(position, player), // Agregar información de margen adicional para mi posición
  });

  const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0d1421" }}>
      {/* Imagen de fondo de UNO - ocupando toda la altura y centrada */}
      <Image
        source={require("../../../images/uno/UNO-background.png")}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: screenWidth,
          height: screenHeight,
          opacity: 1,
        }}
        resizeMode="cover" // Cubrir toda la altura, centrado automáticamente
      />
      {/* Gradiente más suave para mantener legibilidad */}
      <LinearGradient
        colors={["rgba(0,0,0,0.15)", "rgba(0,0,0,0.2)", "rgba(0,0,0,0.25)"]}
        style={StyleSheet.absoluteFill}
      />
      <StatusBar style="light" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>UNO</Text>
        <TouchableOpacity onPress={toggleAudioPanel} style={styles.backBtn}>
          <Ionicons
            name={isPlaying ? "volume-high" : "volume-mute"}
            size={22}
            color="#fff"
          />
        </TouchableOpacity>
      </View>

      <View
        style={[
          styles.tableArea,
          {
            paddingTop: isReallySmallScreen ? 1 : 4, // Casi sin padding arriba para Galaxy S23
            paddingBottom: isReallySmallScreen ? 2 : 12, // Menos padding abajo para Galaxy S23
            marginHorizontal: 2, // Margen horizontal mínimo de 2px
            marginTop: activePlayerCount <= 3 ? 20 : 0, // Mover zona de juego más abajo en partidas de hasta 3 jugadores
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
          <CenterTable
            ref={centerTableRef}
            publicState={publicState}
            responsiveStyles={responsiveStyles}
            responsiveSize={responsiveSize}
            styles={styles}
            me={me}
          />

          {/* Espaciador flexible para empujar la última fila hacia abajo */}
          <View
            style={{
              height: isReallySmallScreen
                ? 50 // Reducido de 70 a 50
                : scale < 1.0
                ? 5 // Reducido de 10 a 5
                : scale > 1.2
                ? 25 // Reducido de 40 a 25
                : 15, // Reducido de 25 a 15
            }}
          />

          {/* Fila inferior (5x1, 5x2, 5x3) */}
          <View style={responsiveStyles.responsiveBottomRow}>
            <PlayerSlot
              {...getPlayerSlotProps("5x1", positionedPlayers["5x1"])}
            />

            {/* Mi posición (5x2) - idéntico a los demás jugadores */}
            <PlayerSlot
              {...getPlayerSlotProps("5x2", {
                id: me,
                name: myDisplayName,
                username: myUsername, // Usar el username real para el avatar
                handCount: hand.length,
              })}
            />

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

      {/* Hand Area Component */}
      <HandArea
        hand={hand}
        isMyTurn={isMyTurn}
        selectedCardId={selectedCardId}
        isDragging={isDragging}
        styles={styles}
        dragY={dragY}
        dragX={dragX}
        dragCardId={dragCardId}
        dragActive={dragActive}
        onPlayCard={playCard}
        setSelectedCardId={setSelectedCardId}
        setIsDragging={setIsDragging}
        socket={socket}
        roomId={roomId}
        me={me}
        publicState={publicState}
        wildColorModal={wildColorModal} // Pasar el modal para detectar cancelaciones
      />

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

      {/* Modal de selección de color para cartas Wild */}
      <ColorSelectorModal
        visible={!!wildColorModal}
        onClose={cancelWild}
        onColorSelect={confirmWildColor}
      />

      {/* Efectos especiales de cartas */}
      <CardEffects
        visible={cardEffects.visible}
        cardType={cardEffects.cardType}
        color={cardEffects.color}
        onComplete={() =>
          setCardEffects({ visible: false, cardType: null, color: null })
        }
      />

      {/* Panel de control de audio */}
      <AudioControlPanel
        visible={showAudioPanel}
        isPlaying={isPlaying}
        volume={volume}
        onToggleMusic={toggleMusic}
        onVolumeChange={changeVolume}
        onClose={closeAudioPanel}
      />
    </SafeAreaView>
  );
}
