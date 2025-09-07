import Constants from "expo-constants";

// Configuración de la aplicación
export const APP_CONFIG = {
  // URL del servidor - prioriza la configuración local para desarrollo
  SERVER_URL:
    //"192.168.0.10:4000" ||
    "https://familygames.duckdns.org" ||
    Constants.expoConfig?.extra?.EXPO_PUBLIC_API_URL ||
    "https://family-games-backend-production.up.railway.app",

  // Configuración de Socket.IO
  SOCKET_CONFIG: {
    transports: ["websocket"],
    timeout: 10000,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    maxReconnectionAttempts: 5,
    forceNew: true,
  },

  // Configuración de cache y storage
  CACHE_CONFIG: {
    AVATAR_CACHE_SIZE: 50, // Número máximo de avatares en cache
    CACHE_EXPIRY_DAYS: 7, // Días antes de que expire el cache
  },

  // Configuración de audio
  AUDIO_CONFIG: {
    BACKGROUND_VOLUME: 0.3,
    EFFECTS_VOLUME: 0.7,
  },
};

// Claves de AsyncStorage
export const STORAGE_KEYS = {
  PROFILE_NAME: "profile:name",
  PROFILE_AVATAR: "profile:avatar",
  USERNAME: "username",
  MUSIC_MUTED: "settings:musicMuted",
  EFFECTS_MUTED: "settings:effectsMuted",
  AVATAR_CACHE: "avatarCache:",
};

// Configuraciones de juegos
export const GAMES_CONFIG = {
  BINGO: {
    MAX_CARDS: 6,
    ANNOUNCEMENT_DURATION: 2500, // ms
    CLAIM_COOLDOWN: 2000, // ms
  },
};
