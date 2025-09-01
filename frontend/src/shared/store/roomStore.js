// 🏠 ROOM STORE - Estado de salas y navegación
// Maneja la información de salas, jugadores conectados y navegación entre juegos

import { create } from "zustand";

const useRoomStore = create((set, get) => ({
  // === ESTADO DE SALAS ===

  // Lista de salas disponibles
  availableRooms: [],

  // Sala actual
  currentRoom: {
    id: null,
    name: null,
    gameKey: null,
    maxPlayers: null,
    config: {},
    players: [],
    isGameStarted: false,
    isGameEnded: false,
  },

  // Mi información como jugador
  myPlayer: {
    id: null,
    name: null,
    username: null,
    avatarId: null,
    isHost: false,
    isReady: false,
  },

  // Estado de conexión a sala
  roomConnectionStatus: "idle", // "idle" | "joining" | "joined" | "leaving" | "error"

  // === NAVEGACIÓN ENTRE JUEGOS ===

  // Historial de navegación
  navigationHistory: [],

  // Juego actualmente seleccionado
  selectedGame: null,

  // === ACCIONES ===

  // Gestión de salas disponibles
  setAvailableRooms: (rooms) => set({ availableRooms: rooms }),

  addRoom: (room) =>
    set((state) => ({
      availableRooms: [...state.availableRooms, room],
    })),

  removeRoom: (roomId) =>
    set((state) => ({
      availableRooms: state.availableRooms.filter((room) => room.id !== roomId),
    })),

  updateRoom: (roomId, updates) =>
    set((state) => ({
      availableRooms: state.availableRooms.map((room) =>
        room.id === roomId ? { ...room, ...updates } : room
      ),
    })),

  // Gestión de sala actual
  setCurrentRoom: (roomData) =>
    set((state) => ({
      currentRoom: { ...state.currentRoom, ...roomData },
    })),

  joinRoom: (roomData) =>
    set({
      currentRoom: roomData,
      roomConnectionStatus: "joined",
    }),

  leaveRoom: () =>
    set({
      currentRoom: {
        id: null,
        name: null,
        gameKey: null,
        maxPlayers: null,
        config: {},
        players: [],
        isGameStarted: false,
        isGameEnded: false,
      },
      myPlayer: {
        id: null,
        name: null,
        username: null,
        avatarId: null,
        isHost: false,
        isReady: false,
      },
      roomConnectionStatus: "idle",
    }),

  // Gestión de jugadores
  updatePlayers: (players) =>
    set((state) => ({
      currentRoom: { ...state.currentRoom, players },
    })),

  addPlayer: (player) =>
    set((state) => ({
      currentRoom: {
        ...state.currentRoom,
        players: [...state.currentRoom.players, player],
      },
    })),

  removePlayer: (playerId) =>
    set((state) => ({
      currentRoom: {
        ...state.currentRoom,
        players: state.currentRoom.players.filter((p) => p.id !== playerId),
      },
    })),

  updatePlayer: (playerId, updates) =>
    set((state) => ({
      currentRoom: {
        ...state.currentRoom,
        players: state.currentRoom.players.map((p) =>
          p.id === playerId ? { ...p, ...updates } : p
        ),
      },
    })),

  // Gestión de mi jugador
  setMyPlayer: (playerData) =>
    set((state) => ({
      myPlayer: { ...state.myPlayer, ...playerData },
    })),

  // Estado de conexión
  setRoomConnectionStatus: (status) => set({ roomConnectionStatus: status }),

  // Navegación
  setSelectedGame: (gameKey) => set({ selectedGame: gameKey }),

  addToNavigationHistory: (route) =>
    set((state) => ({
      navigationHistory: [...state.navigationHistory.slice(-9), route],
    })),

  // Estado del juego
  setGameStarted: (started) =>
    set((state) => ({
      currentRoom: { ...state.currentRoom, isGameStarted: started },
    })),

  setGameEnded: (ended) =>
    set((state) => ({
      currentRoom: { ...state.currentRoom, isGameEnded: ended },
    })),

  // Configuración de sala
  updateRoomConfig: (config) =>
    set((state) => ({
      currentRoom: {
        ...state.currentRoom,
        config: { ...state.currentRoom.config, ...config },
      },
    })),

  // Reset completo
  resetRoom: () => {
    const initialState = get();
    set({
      availableRooms: [],
      currentRoom: {
        id: null,
        name: null,
        gameKey: null,
        maxPlayers: null,
        config: {},
        players: [],
        isGameStarted: false,
        isGameEnded: false,
      },
      myPlayer: {
        id: null,
        name: null,
        username: null,
        avatarId: null,
        isHost: false,
        isReady: false,
      },
      roomConnectionStatus: "idle",
      navigationHistory: [],
      selectedGame: null,
    });
  },
}));

export default useRoomStore;
