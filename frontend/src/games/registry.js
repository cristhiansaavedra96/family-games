// 🎮 GAMES REGISTRY
// Sistema centralizado de registro y gestión de juegos

import { Ionicons } from "@expo/vector-icons";

// Definición de los juegos disponibles
export const AVAILABLE_GAMES = {
  bingo: {
    id: "bingo",
    name: "BINGO",
    description: "El clásico juego de cartones y números",
    icon: "grid",
    color: "#e74c3c",
    available: true,
    minPlayers: 1,
    maxPlayers: 8,
    // Rutas
    routes: {
      rooms: "/rooms", // Para seleccionar sala
      game: "/games/bingo/[roomId]", // Pantalla del juego con roomId dinámico
    },
    // Configuración específica
    config: {
      maxCards: 6,
      figuresAvailable: [
        "corners",
        "row",
        "column",
        "diagonal",
        "border",
        "full",
      ],
      speedOptions: [0.5, 1, 1.5, 2, 3],
      defaultSpeed: 1,
    },
  },
  // Futuras expansiones:
  // poker: {
  //   id: 'poker',
  //   name: 'POKER',
  //   description: 'Texas Hold\'em para toda la familia',
  //   icon: 'diamond',
  //   color: '#27ae60',
  //   available: false,
  //   minPlayers: 2,
  //   maxPlayers: 6,
  // },
  // domino: {
  //   id: 'domino',
  //   name: 'DOMINÓ',
  //   description: 'El clásico juego de fichas',
  //   icon: 'square',
  //   color: '#8e44ad',
  //   available: false,
  // }
};

// Obtener lista de juegos disponibles
export const getAvailableGames = () => {
  return Object.values(AVAILABLE_GAMES).filter((game) => game.available);
};

// Obtener información de un juego específico
export const getGameInfo = (gameId) => {
  return AVAILABLE_GAMES[gameId] || null;
};

// Verificar si un juego está disponible
export const isGameAvailable = (gameId) => {
  const game = AVAILABLE_GAMES[gameId];
  return game ? game.available : false;
};

// Obtener la configuración de un juego
export const getGameConfig = (gameId) => {
  const game = AVAILABLE_GAMES[gameId];
  return game ? game.config : {};
};

// Helper para validar número de jugadores
export const isValidPlayerCount = (gameId, playerCount) => {
  const game = AVAILABLE_GAMES[gameId];
  if (!game) return false;

  return playerCount >= game.minPlayers && playerCount <= game.maxPlayers;
};

// Exportar por defecto la lista de juegos disponibles
export default getAvailableGames;
