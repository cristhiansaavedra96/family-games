// 🏪 SHARED STORES EXPORTS
// Sistema centralizado de gestión de estado para toda la aplicación

// === STORES PRINCIPALES ===

// Store global de la aplicación
export { default as useAppStore } from "./appStore";

// Store de salas y navegación
export { default as useRoomStore } from "./roomStore";

// Store base de juegos
export { default as useGameStore } from "./gameStore";

// === HOOKS COMBINADOS ===

// Hook que combina información del usuario de diferentes stores
export const useUserInfo = () => {
  const appUser = useAppStore((state) => state.user);
  const roomPlayer = useRoomStore((state) => state.myPlayer);

  return {
    // Información de la app (persistente)
    isLoggedIn: appUser.isLoggedIn,
    preferences: appUser.preferences,

    // Información de la sala actual (temporal)
    name: roomPlayer.name || appUser.name,
    username: roomPlayer.username || appUser.username,
    avatarId: roomPlayer.avatarId || appUser.avatarId,
    isHost: roomPlayer.isHost,
    isReady: roomPlayer.isReady,
  };
};

// Hook para configuración de sonidos
export const useSoundConfig = () => {
  const sounds = useAppStore((state) => state.sounds);
  const setSoundConfig = useAppStore((state) => state.setSoundConfig);

  return {
    ...sounds,
    setSoundConfig,
    isMusicEnabled: sounds.musicEnabled,
    areEffectsEnabled: sounds.effectsEnabled,
    toggleMusic: () => setSoundConfig({ musicEnabled: !sounds.musicEnabled }),
    toggleEffects: () =>
      setSoundConfig({ effectsEnabled: !sounds.effectsEnabled }),
    setMusicVolume: (volume) => setSoundConfig({ musicVolume: volume }),
    setEffectsVolume: (volume) => setSoundConfig({ effectsVolume: volume }),
  };
};

// Hook para información de conectividad
export const useConnectionInfo = () => {
  const connectionStatus = useAppStore((state) => state.connectionStatus);
  const serverUrl = useAppStore((state) => state.serverUrl);
  const roomConnectionStatus = useRoomStore(
    (state) => state.roomConnectionStatus
  );

  return {
    connectionStatus,
    serverUrl,
    roomConnectionStatus,
    isConnected: connectionStatus === "connected",
    isInRoom: roomConnectionStatus === "joined",
    isConnecting:
      connectionStatus === "connecting" || roomConnectionStatus === "joining",
  };
};

// Hook para información del juego actual
export const useCurrentGame = () => {
  const gameKey = useGameStore((state) => state.gameKey);
  const gameState = useGameStore((state) => state.gameState);
  const selectedGame = useRoomStore((state) => state.selectedGame);
  const currentRoom = useRoomStore((state) => state.currentRoom);

  return {
    gameKey: gameKey || selectedGame || currentRoom.gameKey,
    gameState,
    isInGame: gameState !== "idle",
    isGamePlaying: gameState === "playing",
    isGameFinished: gameState === "finished",
    roomGameKey: currentRoom.gameKey,
  };
};

// === TIPOS Y CONSTANTES ===

// Estados posibles de la aplicación
export const APP_STATES = {
  CONNECTION: {
    DISCONNECTED: "disconnected",
    CONNECTING: "connecting",
    CONNECTED: "connected",
    ERROR: "error",
  },
  ROOM: {
    IDLE: "idle",
    JOINING: "joining",
    JOINED: "joined",
    LEAVING: "leaving",
    ERROR: "error",
  },
  GAME: {
    IDLE: "idle",
    WAITING: "waiting",
    STARTING: "starting",
    PLAYING: "playing",
    PAUSED: "paused",
    FINISHED: "finished",
  },
};

// Configuración por defecto
export const DEFAULT_CONFIG = {
  SOUNDS: {
    musicEnabled: true,
    effectsEnabled: true,
    musicVolume: 0.7,
    effectsVolume: 0.8,
  },
  GAME: {
    speed: 1,
    autoPlay: false,
    showHints: true,
  },
  USER: {
    language: "es",
    notifications: true,
  },
};
