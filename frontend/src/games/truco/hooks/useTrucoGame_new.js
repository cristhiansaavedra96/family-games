// 🎮 HOOK PRINCIPAL DEL TRUCO (VERSION SIMPLIFICADA)
// Lógica principal del juego de Truco sin loops infinitos

import { useEffect, useCallback, useMemo } from "react";
import { useTrucoGameStore, useTrucoUiStore } from "../stores";
import { useSocket } from "../../../shared/hooks";
import { calculateEnvido, hasFlor } from "../utils/cardHelpers";

export const useTrucoGame = (roomId) => {
  // Socket connection
  const { socket, isConnected } = useSocket();

  // Game state selectors
  const gameState = useTrucoGameStore((state) => state.gameState);
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

    // Socket event listeners
    const handleGameStateUpdate = (state) => {
      console.log("🎯 Estado del juego actualizado:", state);

      if (state.gameState) setGameState(state.gameState);
      if (state.players) setPlayers(state.players);
      if (state.scores) setScores(state.scores);
      if (state.teams) setTeams(state.teams);
      if (state.currentPlayer !== undefined)
        setCurrentPlayer(state.currentPlayer);
      if (state.round) setRound(state.round);
      if (state.hand) setHand(state.hand);
      if (state.muestra) setMuestra(state.muestra);
      if (state.playedCards) setPlayedCards(state.playedCards);
      if (state.trucoState) setTrucoState(state.trucoState);
      if (state.envidoState) setEnvidoState(state.envidoState);
      if (state.florState) setFlorState(state.florState);
    };

    const handleCardsDealt = (data) => {
      console.log("🃏 Cartas recibidas:", data);

      if (data.hand && Array.isArray(data.hand)) {
        setMyHand(data.hand);

        // Calculate envido and check for flor
        const myEnvido = calculateEnvido(data.hand, muestra);
        const florResult = hasFlor(data.hand, muestra);

        console.log("💎 Mi envido calculado:", myEnvido);
        console.log("🌸 ¿Tengo flor?:", florResult.hasFlor);

        setEnvidoState({
          ...envidoState,
          myEnvido,
        });

        setFlorState({
          ...florState,
          hasFlor: florResult.hasFlor,
        });
      }
    };

    const handlePlayerTurn = ({ currentPlayer, availableActions }) => {
      console.log("🎯 Turno actualizado:", currentPlayer, availableActions);

      setCurrentPlayer(currentPlayer);
      setAvailableActions(availableActions || []);

      // Use socket.id directly as myPlayerId might not be set yet
      const myId = myPlayerId || socket.id;
      const isMyTurnNow = currentPlayer === myId;
      setIsMyTurn(isMyTurnNow);
      setCanPlayCard(
        isMyTurnNow && (availableActions || []).includes("play_card")
      );
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
    socket.on("gameState", handleGameStateUpdate);
    socket.on("cardsDealt", handleCardsDealt);
    socket.on("playerTurn", handlePlayerTurn);
    socket.on("joined", handleJoined);
    socket.on("playerId", handlePlayerId);

    // Cleanup
    return () => {
      socket.off("gameStateUpdate", handleGameStateUpdate);
      socket.off("gameState", handleGameStateUpdate);
      socket.off("cardsDealt", handleCardsDealt);
      socket.off("playerTurn", handlePlayerTurn);
      socket.off("joined", handleJoined);
      socket.off("playerId", handlePlayerId);

      resetGameState();
      resetUiState();
    };
  }, [socket, roomId, isConnected]);

  // Game actions
  const playCard = useCallback(
    (card) => {
      if (!socket || !canPlayCard) return;

      console.log("🎴 Jugando carta:", card);
      socket.emit("playCard", {
        roomId,
        playerId: myPlayerId || socket.id,
        card,
      });

      // Clear selected card
      setSelectedCard(null);
    },
    [socket, canPlayCard, roomId, myPlayerId, setSelectedCard]
  );

  const performAction = useCallback(
    (action, data = {}) => {
      if (!socket) return;

      console.log("⚡ Ejecutando acción:", action, data);
      socket.emit("performAction", {
        roomId,
        playerId: myPlayerId || socket.id,
        action,
        data,
      });
    },
    [socket, roomId, myPlayerId]
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
    leaveGame,

    // UI state
    selectedCard,
    setSelectedCard,

    // Player info
    myPlayerId,
  };
};
