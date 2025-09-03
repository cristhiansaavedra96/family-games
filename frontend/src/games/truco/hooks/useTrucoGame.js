// 🎮 HOOK PRINCIPAL DEL TRUCO (VERSION SIMPLIFICADA)
// Lógica principal del juego de Truco sin loops infinitos

import { useEffect, useCallback, useMemo, useRef } from "react";
import { Alert } from "react-native";
import { useTrucoGameStore, useTrucoUiStore } from "../stores";
import { useSocket } from "../../../shared/hooks";
import { calculateEnvido, hasFlor } from "../utils/cardHelpers";

export const useTrucoGame = (roomId) => {
  // Socket connection
  const { socket, isConnected } = useSocket();

  // Flag: have we received at least one full game state from server?
  const hasGameState = useRef(false);

  // Game state selectors
  const gameState = useTrucoGameStore((state) => state.gameState);
  const started = useTrucoGameStore((state) => state.started);
  const players = useTrucoGameStore((state) => state.players);
  const myPlayerId = useTrucoGameStore((state) => state.myPlayerId);
  const currentPlayer = useTrucoGameStore((state) => state.currentPlayer);
  const isMyTurn = useTrucoGameStore((state) => state.isMyTurn);
  const canPlayCard = useTrucoGameStore((state) => state.canPlayCard);
  const myHand = useTrucoGameStore((state) => state.myHand);
  const playedCards = useTrucoGameStore((state) => state.playedCards);
  const muestra = useTrucoGameStore((state) => state.muestra);
  const scores = useTrucoGameStore((state) => state.scores);
  const teams = useTrucoGameStore((state) => state.teams);
  const availableActions = useTrucoGameStore((state) => state.availableActions);
  const trucoState = useTrucoGameStore((state) => state.trucoState);
  const envidoState = useTrucoGameStore((state) => state.envidoState);
  const florState = useTrucoGameStore((state) => state.florState);
  const round = useTrucoGameStore((state) => state.round);
  const hand = useTrucoGameStore((state) => state.hand);
  const roomIdStore = useTrucoGameStore((state) => state.roomId);
  const isConnectedStore = useTrucoGameStore((state) => state.isConnected);

  // Actions selectors
  const setRoomId = useTrucoGameStore((state) => state.setRoomId);
  const setConnected = useTrucoGameStore((state) => state.setConnected);
  const setMyPlayerId = useTrucoGameStore((state) => state.setMyPlayerId);
  const setGameState = useTrucoGameStore((state) => state.setGameState);
  const setStarted = useTrucoGameStore((state) => state.setStarted);
  const setPlayers = useTrucoGameStore((state) => state.setPlayers);
  const setCurrentPlayer = useTrucoGameStore((state) => state.setCurrentPlayer);
  const setIsMyTurn = useTrucoGameStore((state) => state.setIsMyTurn);
  const setCanPlayCard = useTrucoGameStore((state) => state.setCanPlayCard);
  const setAvailableActions = useTrucoGameStore(
    (state) => state.setAvailableActions
  );
  const setMyHand = useTrucoGameStore((state) => state.setMyHand);
  const setPlayedCards = useTrucoGameStore((state) => state.setPlayedCards);
  const setMuestra = useTrucoGameStore((state) => state.setMuestra);
  const setScores = useTrucoGameStore((state) => state.setScores);
  const setTeams = useTrucoGameStore((state) => state.setTeams);
  const setTrucoState = useTrucoGameStore((state) => state.setTrucoState);
  const setEnvidoState = useTrucoGameStore((state) => state.setEnvidoState);
  const setFlorState = useTrucoGameStore((state) => state.setFlorState);
  const setRound = useTrucoGameStore((state) => state.setRound);
  const setHand = useTrucoGameStore((state) => state.setHand);
  const resetGameState = useTrucoGameStore((state) => state.resetGameState);

  // UI store
  const selectedCard = useTrucoUiStore((state) => state.selectedCard);
  const setSelectedCard = useTrucoUiStore((state) => state.setSelectedCard);
  const addBanner = useTrucoUiStore((state) => state.addBanner);
  const clearBanners = useTrucoUiStore((state) => state.clearBanners);
  const setOpenActions = useTrucoUiStore((state) => state.setOpenActions);
  const resetUiState = useTrucoUiStore((state) => state.resetUiState);

  // Connect to room and setup socket listeners
  useEffect(() => {
    if (!isConnected || !socket || !roomId) return;

    console.log("🎮 Conectando a la sala de Truco:", roomId);
    setRoomId(roomId);
    setConnected(true);
    setMyPlayerId(socket.id);

    // Join room
    socket.emit("joinRoom", {
      roomId,
      gameType: "truco",
      playerId: socket.id,
    });

    // Pedir reenvío de mano privada por si el evento se emitió antes
    socket.emit("requestPrivateHand", { roomId });

    // Track if we've ever received a full game state from server

    // Socket event listeners
    const handleGameStateUpdate = (state) => {
      // Reduced logging to prevent spam
      if (state.started !== started) {
        console.log("🎯 Estado del juego - started:", state.started);
      }

      // Mark that we've received game state at least once
      hasGameState.current = true;

      if (state.gameState) setGameState(state.gameState);
      if (state.started !== undefined) setStarted(state.started);
      if (state.players) setPlayers(state.players);
      if (state.scores) setScores(state.scores);
      if (state.teams) setTeams(state.teams);
      if (state.currentPlayerSocketId !== undefined) {
        setCurrentPlayer(state.currentPlayerSocketId);
        // También actualizamos isMyTurn basado en el estado completo
        const myIdNow = myPlayerId || socket.id;
        if (myIdNow) {
          const mineNow = state.currentPlayerSocketId === myIdNow;
          setIsMyTurn(mineNow);
          if (mineNow) {
            // Si no tenemos acciones aún, permitir jugar carta por defecto
            setAvailableActions((prev) =>
              Array.isArray(prev) && prev.length > 0 ? prev : ["play_card"]
            );
            setCanPlayCard(true);
          }
        }
      }
      if (state.round) setRound(state.round);
      if (state.hand) setHand(state.hand);
      if (state.muestra) setMuestra(state.muestra);
      if (state.playedCards) setPlayedCards(state.playedCards);
      if (state.trucoState) setTrucoState(state.trucoState);
      if (state.envidoState) setEnvidoState(state.envidoState);
      if (state.florState) setFlorState(state.florState);
    };

    const handlePrivateHand = (data) => {
      console.log("🃏 Cartas recibidas:", data);

      if (data.hand && Array.isArray(data.hand)) {
        setMyHand(data.hand);

        // Use backend-provided envido/flor if available, else calculate
        const myEnvido =
          typeof data.envido === "number"
            ? data.envido
            : calculateEnvido(data.hand, muestra);
        const florResult = data.flor || hasFlor(data.hand, muestra);

        console.log("💎 Mi envido:", myEnvido);
        console.log("🌸 ¿Tengo flor?:", !!florResult?.hasFlor);

        setEnvidoState({
          ...envidoState,
          myEnvido,
        });

        setFlorState({
          ...florState,
          hasFlor: !!florResult?.hasFlor,
        });
      }
    };

    const handlePlayerTurn = ({ currentPlayer, availableActions }) => {
      console.log("🎯 Turno actualizado:", currentPlayer, availableActions);

      setCurrentPlayer(currentPlayer);
      const actions = Array.isArray(availableActions) ? availableActions : [];
      setAvailableActions(actions);

      // Use socket.id directly as myPlayerId might not be set yet
      const myId = myPlayerId || socket.id;
      const isMyTurnNow = currentPlayer === myId;
      setIsMyTurn(isMyTurnNow);
      // No auto-abrir panel aquí; solo permitir jugar si incluye play_card
      setCanPlayCard(isMyTurnNow && actions.includes("play_card"));
    };

    const handleCardPlayed = ({
      playerSocketId,
      card,
      gameState,
      turnInfo,
    }) => {
      // Actualizar mesa desde el estado público si viene
      if (gameState?.playedCards) {
        setPlayedCards(gameState.playedCards);
      }

      // Sincronizar info clave de la partida si viene en el evento
      if (gameState) {
        if (gameState.round !== undefined) setRound(gameState.round);
        if (gameState.hand !== undefined) setHand(gameState.hand);
        if (gameState.scores) setScores(gameState.scores);
        if (gameState.muestra) setMuestra(gameState.muestra);
        if (gameState.currentPlayerSocketId) {
          setCurrentPlayer(gameState.currentPlayerSocketId);
        }
      }

      // Si yo jugué la carta, removerla de mi mano localmente
      const myId = myPlayerId || socket.id;
      if (myId && playerSocketId === myId && card?.id) {
        setMyHand((prev) =>
          Array.isArray(prev) ? prev.filter((c) => c.id !== card.id) : prev
        );
      }

      // Actualizar currentPlayer si viene en turnInfo
      // Nota: evitamos usar turnInfo.currentPlayer aquí porque puede quedar desfasado
      // si la ronda terminó y el backend reasignó el turno al ganador.
    };

    // Al finalizar una ronda, el backend emite el nuevo estado
    const handleRoundFinished = ({ gameState: gs }) => {
      if (!gs) return;
      if (gs.playedCards) setPlayedCards(gs.playedCards);
      if (gs.round !== undefined) setRound(gs.round);
      if (gs.hand !== undefined) setHand(gs.hand);
      if (gs.scores) setScores(gs.scores);
      if (gs.muestra) setMuestra(gs.muestra);
      if (gs.currentPlayerSocketId) setCurrentPlayer(gs.currentPlayerSocketId);

      // Al iniciar la siguiente ronda, habilitar jugar por defecto si es mi turno
      const myId = myPlayerId || socket.id;
      if (myId && gs.currentPlayerSocketId === myId) {
        setAvailableActions((prev) =>
          Array.isArray(prev) && prev.length > 0 ? prev : ["play_card"]
        );
        setCanPlayCard(true);
      }
    };

    // Al finalizar la mano se prepara una nueva o se termina el juego
    const handleHandFinished = ({ gameState: gs }) => {
      if (!gs) return;
      if (gs.round !== undefined) setRound(gs.round);
      if (gs.hand !== undefined) setHand(gs.hand);
      if (gs.scores) setScores(gs.scores);
      if (gs.muestra) setMuestra(gs.muestra);
      if (gs.currentPlayerSocketId) setCurrentPlayer(gs.currentPlayerSocketId);
      if (gs.playedCards) setPlayedCards(gs.playedCards);
    };

    // Nueva mano iniciada: llegan nuevas cartas por privateHand
    const handleNewHandStarted = ({ gameState: gs }) => {
      if (!gs) return;
      if (gs.round !== undefined) setRound(gs.round);
      if (gs.hand !== undefined) setHand(gs.hand);
      if (gs.scores) setScores(gs.scores);
      if (gs.muestra) setMuestra(gs.muestra);
      if (gs.currentPlayerSocketId) setCurrentPlayer(gs.currentPlayerSocketId);
      if (gs.playedCards) setPlayedCards(gs.playedCards);

      // Pedimos por las dudas reenvío de mano privada
      socket.emit("requestPrivateHand", { roomId });
      // Nota: No forzar acciones aquí; el backend emitirá 'turnChanged' con availableActions correctas
    };

    // Fin del juego
    const handleGameOver = ({ gameState: gs }) => {
      if (!gs) return;
      if (gs.scores) setScores(gs.scores);
      if (gs.currentPlayerSocketId) setCurrentPlayer(gs.currentPlayerSocketId);
      setCanPlayCard(false);
    };

    const handleJoined = (data) => {
      console.log("👤 Unido a la sala:", data);
      setMyPlayerId(socket.id);
    };

    const handlePlayerId = ({ playerId }) => {
      console.log("🆔 ID del jugador asignado:", playerId);
      setMyPlayerId(playerId);
    };

    // Add event listeners
    socket.on("gameStateUpdate", handleGameStateUpdate);
    socket.on("state", handleGameStateUpdate);
    socket.on("gameState", handleGameStateUpdate);
    socket.on("privateHand", handlePrivateHand);
    socket.on("playerTurn", handlePlayerTurn);
    socket.on("turnChanged", handlePlayerTurn);
    // Gating por-jugador de acciones
    socket.on(
      "availableActionsUpdate",
      ({ availableActions, currentPlayer }) => {
        if (Array.isArray(availableActions)) {
          setAvailableActions(availableActions);
          // Abrir solo si se trata de RESPONDER (aceptar/rechazar o contracantos), no por turno
          const respondActions = [
            "accept_truco",
            "reject_truco",
            "accept_envido",
            "reject_envido",
            "contraflor",
            "contraflor_al_resto",
            "con_flor_envido",
          ];
          const shouldOpen = availableActions.some((a) =>
            respondActions.includes(a)
          );
          setOpenActions(shouldOpen);
        }
        if (currentPlayer) setCurrentPlayer(currentPlayer);
      }
    );
    socket.on("cardPlayed", handleCardPlayed);
    socket.on("roundFinished", handleRoundFinished);
    socket.on("handFinished", handleHandFinished);
    socket.on("newHandStarted", handleNewHandStarted);
    socket.on("gameOver", handleGameOver);
    socket.on("joined", handleJoined);
    socket.on("playerId", handlePlayerId);
    // Envido events
    socket.on("envidoDeclared", ({ declarer, type, chain, pot }) => {
      // Banner visible en mesa
      const canto = type?.toUpperCase?.() || "ENVIDO";
      const msg = `${canto}`;
      addBanner({
        id: `envido-${Date.now()}`,
        playerId: declarer,
        message: msg,
        type: "info",
      });

      // Activar estado de envido y habilitar respuestas/levantamientos
      setEnvidoState({
        ...envidoState,
        active: true,
        type,
        chain: Array.isArray(chain) ? chain : [type].filter(Boolean),
        pot: pot ?? undefined,
      });

      // Abrir panel para responder
      setOpenActions(true);
    });

    socket.on("envidoResponse", ({ player, response, chain, pot }) => {
      setEnvidoState((prev) => ({
        ...prev,
        active: prev?.active ?? true,
        chain: Array.isArray(chain) ? chain : prev?.chain,
        pot: pot ?? prev?.pot,
        lastResponse: response,
      }));
    });

    socket.on("envidoDeclined", ({ winnerTeam, points }) => {
      // Quitar banners de envido
      clearBanners();
      setEnvidoState((prev) => ({ ...prev, active: false }));
      // Tras declinar, las acciones vuelven a las del turno; no forzamos aquí
    });

    socket.on("envidoResolved", ({ winner, points, team }) => {
      clearBanners();
      setEnvidoState((prev) => ({ ...prev, active: false }));
    });

    socket.on("envidoCanceled", ({ reason }) => {
      // Flor mata envido
      clearBanners();
      setEnvidoState((prev) => ({ ...prev, active: false }));
    });
    socket.on("florDeclared", ({ playerId, gameState: gs }) => {
      addBanner({
        id: `flor-${Date.now()}`,
        playerId,
        message: "Tengo FLOR",
        type: "info",
      });
      if (gs) {
        setFlorState(gs.florState);
        if (gs.currentPlayerSocketId)
          setCurrentPlayer(gs.currentPlayerSocketId);
        // Si soy el actual, asegurar acciones por lo menos por defecto
        const myId = myPlayerId || socket.id;
        if (gs.currentPlayerSocketId === myId) {
          const list = Array.isArray(gs.turnInfo?.availableActions)
            ? gs.turnInfo.availableActions
            : ["play_card"]; // fallback
          setAvailableActions(list);
          setCanPlayCard(true);
        }
      }
    });
    socket.on("contraflorDeclared", ({ playerId, gameState: gs }) => {
      addBanner({
        id: `contraflor-${Date.now()}`,
        playerId,
        message: "CONTRAFLOR",
        type: "warning",
      });
      if (gs) {
        setFlorState(gs.florState);
      }
    });

    // Truco events
    socket.on("trucoDeclared", ({ declarer, level, name, teamWithWord }) => {
      addBanner({
        id: `truco-${Date.now()}`,
        playerId: declarer,
        message: name?.toUpperCase?.() || "TRUCO",
        type: "warning",
      });
      // Abrir panel para responder
      setOpenActions(true);
    });
    socket.on("trucoAccepted", ({ responder, level }) => {
      addBanner({
        id: `truco-accepted-${Date.now()}`,
        playerId: responder,
        message: "QUIERO",
        type: "info",
      });
    });
    socket.on("trucoDeclined", ({ responder, winnerTeam, points }) => {
      addBanner({
        id: `truco-declined-${Date.now()}`,
        playerId: responder,
        message: "NO QUIERO",
        type: "info",
      });
    });

    // Cleanup
    return () => {
      socket.off("gameStateUpdate", handleGameStateUpdate);
      socket.off("state", handleGameStateUpdate);
      socket.off("gameState", handleGameStateUpdate);
      socket.off("privateHand", handlePrivateHand);
      socket.off("playerTurn", handlePlayerTurn);
      socket.off("turnChanged", handlePlayerTurn);
      socket.off("availableActionsUpdate");
      socket.off("cardPlayed", handleCardPlayed);
      socket.off("roundFinished", handleRoundFinished);
      socket.off("handFinished", handleHandFinished);
      socket.off("newHandStarted", handleNewHandStarted);
      socket.off("gameOver", handleGameOver);
      socket.off("joined", handleJoined);
      socket.off("playerId", handlePlayerId);
      socket.off("envidoDeclared");
      socket.off("envidoResponse");
      socket.off("envidoDeclined");
      socket.off("envidoResolved");
      socket.off("envidoCanceled");
      socket.off("florDeclared");
      socket.off("contraflorDeclared");

      resetGameState();
      resetUiState();
    };
  }, [socket, roomId, isConnected]);

  // Derivar isMyTurn/canPlay cada vez que cambian los IDs o acciones
  useEffect(() => {
    const myIdNow = myPlayerId || socket?.id;
    if (!myIdNow || !currentPlayer) return;

    const mine = currentPlayer === myIdNow;
    setIsMyTurn(mine);
    // Si no hay acciones disponibles informadas aún, por defecto permitir jugar carta en tu turno
    const list = Array.isArray(availableActions) ? availableActions : [];
    const canPlayByActions =
      list.length > 0 ? list.includes("play_card") : true;
    setCanPlayCard(mine && canPlayByActions);
  }, [
    currentPlayer,
    myPlayerId,
    socket,
    availableActions,
    setIsMyTurn,
    setCanPlayCard,
  ]);

  // Game actions
  const playCard = useCallback(
    (card) => {
      if (!socket || !canPlayCard || !card?.id) return;

      console.log("🎴 Jugando carta:", card);
      socket.emit("playCard", {
        roomId,
        cardId: card.id,
      });

      // Clear selected card
      setSelectedCard(null);
    },
    [socket, canPlayCard, roomId, setSelectedCard]
  );

  const performAction = useCallback(
    (action, data = {}) => {
      if (!socket) return;

      console.log("⚡ Ejecutando acción:", action, data);
      switch (action) {
        case "tiene":
          // Acción local: confirmar que el rival tiene FLOR; solo cerramos el panel
          setOpenActions(false);
          break;
        case "envido":
        case "real_envido":
        case "falta_envido":
          socket.emit("envido", { roomId, type: action });
          setOpenActions(false);
          break;
        case "accept_envido":
          socket.emit("envidoResponse", { roomId, response: "acepto" });
          setOpenActions(false);
          break;
        case "reject_envido":
          socket.emit("envidoResponse", { roomId, response: "no_acepto" });
          setOpenActions(false);
          break;
        case "truco":
          socket.emit("truco", { roomId });
          setOpenActions(false);
          break;
        case "accept_truco":
          socket.emit("trucoResponse", { roomId, response: "acepto" });
          setOpenActions(false);
          break;
        case "reject_truco":
          socket.emit("trucoResponse", { roomId, response: "no_acepto" });
          setOpenActions(false);
          break;
        case "flor":
          socket.emit("flor", { roomId });
          setOpenActions(false);
          break;
        case "contraflor":
          socket.emit("contraflor", { roomId });
          setOpenActions(false);
          break;
        default:
          break;
      }
    },
    [socket, roomId]
  );

  const leaveGame = useCallback(() => {
    if (!socket) return;

    console.log("🚪 Dejando el juego");
    socket.emit("leaveRoom", { roomId });
    resetGameState();
    resetUiState();
  }, [socket, roomId, resetGameState, resetUiState]);

  // Computed values
  const gameInfo = useMemo(() => {
    const getMyTeam = () => {
      if (!myPlayerId || !teams.length) return null;
      return teams.find((team) => team.players.includes(myPlayerId));
    };

    const getOpponentTeam = () => {
      if (!myPlayerId || !teams.length) return null;
      return teams.find((team) => !team.players.includes(myPlayerId));
    };

    return {
      isConnected: isConnectedStore,
      gameState,
      isMyTurn,
      canPlay: canPlayCard,
      myTeam: getMyTeam(),
      opponentTeam: getOpponentTeam(),
    };
  }, [isConnectedStore, gameState, isMyTurn, canPlayCard, teams, myPlayerId]);

  return {
    // Game info
    ...gameInfo,

    // Game status
    gameStarted: started,
    gameState,
    hasGameState: hasGameState.current || false,

    // Game data
    players,
    myHand,
    playedCards,
    muestra,
    scores,
    teams,
    currentPlayer,
    round,
    hand,

    // Game states
    trucoState,
    envidoState,
    florState,

    // Available actions
    availableActions,

    // Actions
    playCard,
    performAction,
    // Nota: evitamos usar turnInfo.currentPlayer aquí porque puede quedar desfasado
    // si la ronda terminó y el backend reasignó el turno al ganador.
    selectedCard,
    setSelectedCard,

    // Player info
    myPlayerId,
  };
};
