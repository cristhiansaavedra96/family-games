// 🎮 GAME STORE - Estado base para todos los juegos
// Store padre que contiene la lógica compartida entre juegos

import { create } from "zustand";

const useGameStore = create((set, get) => ({
  // === ESTADO GENERAL DEL JUEGO ===

  // Información básica
  gameKey: null,
  gameState: "idle", // "idle" | "waiting" | "starting" | "playing" | "paused" | "finished"

  // Configuración del juego
  config: {
    speed: 1,
    autoPlay: false,
    showHints: true,
  },

  // Jugadores en el juego
  players: [],
  myPlayerId: null,

  // Estado de la partida
  isHost: false,
  gameStarted: false,
  gameEnded: false,
  gameWinner: null,
  gameScore: {},

  // Configuración de UI durante el juego
  ui: {
    showDebugPanel: __DEV__,
    showStats: false,
    showChat: false,
    chatMessages: [],
    toastMessages: [],
  },

  // === ACCIONES GENERALES ===

  // Inicialización del juego
  initializeGame: (gameKey, config = {}) =>
    set((state) => ({
      gameKey,
      config: { ...state.config, ...config },
      gameState: "waiting",
    })),

  // Estado del juego
  setGameState: (state) => set({ gameState: state }),

  startGame: () =>
    set({
      gameState: "playing",
      gameStarted: true,
      gameEnded: false,
      gameWinner: null,
    }),

  pauseGame: () => set({ gameState: "paused" }),

  resumeGame: () => set({ gameState: "playing" }),

  endGame: (winner = null, score = {}) =>
    set({
      gameState: "finished",
      gameEnded: true,
      gameWinner: winner,
      gameScore: score,
    }),

  // Configuración
  updateConfig: (updates) =>
    set((state) => ({
      config: { ...state.config, ...updates },
    })),

  setSpeed: (speed) =>
    set((state) => ({
      config: { ...state.config, speed },
    })),

  // Jugadores
  setPlayers: (players) => set({ players }),

  setMyPlayerId: (playerId) => set({ myPlayerId: playerId }),

  updatePlayer: (playerId, updates) =>
    set((state) => ({
      players: state.players.map((player) =>
        player.id === playerId ? { ...player, ...updates } : player
      ),
    })),

  // Host
  setIsHost: (isHost) => set({ isHost }),

  // === ACCIONES DE UI ===

  // Panel de debug
  toggleDebugPanel: () =>
    set((state) => ({
      ui: { ...state.ui, showDebugPanel: !state.ui.showDebugPanel },
    })),

  setDebugPanelVisible: (visible) =>
    set((state) => ({
      ui: { ...state.ui, showDebugPanel: visible },
    })),

  // Chat
  toggleChat: () =>
    set((state) => ({
      ui: { ...state.ui, showChat: !state.ui.showChat },
    })),

  setChatVisible: (visible) =>
    set((state) => ({
      ui: { ...state.ui, showChat: visible },
    })),

  addChatMessage: (message) =>
    set((state) => ({
      ui: {
        ...state.ui,
        chatMessages: [...state.ui.chatMessages.slice(-99), message],
      },
    })),

  clearChatMessages: () =>
    set((state) => ({
      ui: { ...state.ui, chatMessages: [] },
    })),

  // Toast messages
  addToastMessage: (message) =>
    set((state) => ({
      ui: {
        ...state.ui,
        toastMessages: [...state.ui.toastMessages.slice(-4), message],
      },
    })),

  removeToastMessage: (messageId) =>
    set((state) => ({
      ui: {
        ...state.ui,
        toastMessages: state.ui.toastMessages.filter(
          (msg) => msg.id !== messageId
        ),
      },
    })),

  clearToastMessages: () =>
    set((state) => ({
      ui: { ...state.ui, toastMessages: [] },
    })),

  // Estadísticas
  toggleStats: () =>
    set((state) => ({
      ui: { ...state.ui, showStats: !state.ui.showStats },
    })),

  // === RESET Y LIMPIEZA ===

  // Reset del juego (mantiene configuración)
  resetGame: () =>
    set((state) => ({
      gameState: "idle",
      gameStarted: false,
      gameEnded: false,
      gameWinner: null,
      gameScore: {},
      players: [],
      myPlayerId: null,
      isHost: false,
      ui: {
        ...state.ui,
        chatMessages: [],
        toastMessages: [],
        showChat: false,
        showStats: false,
      },
    })),

  // Reset completo
  resetAll: () =>
    set({
      gameKey: null,
      gameState: "idle",
      config: {
        speed: 1,
        autoPlay: false,
        showHints: true,
      },
      players: [],
      myPlayerId: null,
      isHost: false,
      gameStarted: false,
      gameEnded: false,
      gameWinner: null,
      gameScore: {},
      ui: {
        showDebugPanel: __DEV__,
        showStats: false,
        showChat: false,
        chatMessages: [],
        toastMessages: [],
      },
    }),
}));

export default useGameStore;
