// 🎯 STORE DE JUEGO PARA TRUCO
// Estado principal del juego de Truco

import { create } from "zustand";

export const useTrucoGameStore = create((set, get) => ({
  // Información de la sala
  roomId: null,
  isConnected: false,

  // Jugadores
  players: [],
  currentPlayer: 0,
  myPlayerId: null,

  // Estado del juego
  gameState: "waiting", // waiting, playing, finished
  started: false, // Si el juego ha comenzado (del backend)
  round: 1, // Ronda actual (1, 2, 3)
  hand: 1, // Mano actual

  // Cartas
  myHand: [], // Mi mano de cartas
  playedCards: [], // Cartas jugadas en la mesa
  muestra: null, // Carta de muestra

  // Puntuación
  scores: [0, 0], // Puntajes por equipo
  teams: [], // Información de equipos

  // Estados de juego
  trucoState: {
    level: 0, // 0=no truco, 1=truco, 2=retruco, 3=vale4
    declared: false,
    declarer: null,
    canAccept: false,
    canRaise: false,
  },

  envidoState: {
    active: false,
    type: null, // envido, real_envido, falta_envido
    declared: false,
    declarer: null,
    myEnvido: 0,
    canDeclare: false,
  },

  florState: {
    active: false,
    declared: false,
    hasFlor: false,
    canDeclare: false,
  },

  // Información del turno
  isMyTurn: false,
  canPlayCard: false,
  availableActions: [], // acciones disponibles: play_card, truco, envido, etc.

  // Historial
  actionHistory: [],
  lastAction: null,

  // Acciones para conexión
  setRoomId: (roomId) => set({ roomId }),
  setConnected: (connected) => set({ isConnected: connected }),

  // Acciones para jugadores
  setPlayers: (players) => set({ players }),
  setMyPlayerId: (playerId) => set({ myPlayerId: playerId }),
  setCurrentPlayer: (playerId) => set({ currentPlayer: playerId }),

  // Acciones para estado del juego
  setGameState: (state) => set({ gameState: state }),
  setStarted: (started) => set({ started }),
  setRound: (round) => set({ round }),
  setHand: (hand) => set({ hand }),

  // Acciones para cartas
  setMyHand: (updater) =>
    set((state) => ({
      myHand: typeof updater === "function" ? updater(state.myHand) : updater,
    })),
  setPlayedCards: (cards) => set({ playedCards: cards }),
  setMuestra: (muestra) => set({ muestra }),

  // Acciones para puntuación
  setScores: (scores) => set({ scores }),
  setTeams: (teams) => set({ teams }),

  // Acciones para estados de juego
  setTrucoState: (trucoState) => set({ trucoState }),
  setEnvidoState: (envidoState) => set({ envidoState }),
  setFlorState: (florState) => set({ florState }),

  // Acciones para turno
  setIsMyTurn: (isMyTurn) => set({ isMyTurn }),
  setCanPlayCard: (canPlay) => set({ canPlayCard: canPlay }),
  setAvailableActions: (updater) =>
    set((state) => ({
      availableActions:
        typeof updater === "function"
          ? updater(state.availableActions)
          : updater || [],
    })),

  // Acciones para historial
  addAction: (action) =>
    set((state) => ({
      actionHistory: [...state.actionHistory, action],
      lastAction: action,
    })),

  // Utilidades
  getMyTeam: () => {
    const { myPlayerId, teams } = get();
    if (!myPlayerId || !teams.length) return null;

    return teams.find((team) => team.players.includes(myPlayerId));
  },

  getOpponentTeam: () => {
    const { myPlayerId, teams } = get();
    if (!myPlayerId || !teams.length) return null;

    return teams.find((team) => !team.players.includes(myPlayerId));
  },

  isPlayerInMyTeam: (playerId) => {
    const myTeam = get().getMyTeam();
    return myTeam ? myTeam.players.includes(playerId) : false;
  },

  // Limpiar estado
  resetGameState: () =>
    set({
      gameState: "waiting",
      started: false,
      round: 1,
      hand: 1,
      myHand: [],
      playedCards: [],
      muestra: null,
      trucoState: {
        level: 0,
        declared: false,
        declarer: null,
        canAccept: false,
        canRaise: false,
      },
      envidoState: {
        active: false,
        type: null,
        declared: false,
        declarer: null,
        myEnvido: 0,
        canDeclare: false,
      },
      florState: {
        active: false,
        declared: false,
        hasFlor: false,
        canDeclare: false,
      },
      isMyTurn: false,
      canPlayCard: false,
      availableActions: [],
      actionHistory: [],
      lastAction: null,
    }),
}));
