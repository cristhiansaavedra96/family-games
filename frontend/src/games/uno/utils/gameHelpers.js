// Función para acortar IDs de jugadores
export function shortId(id) {
  return id ? id.slice(0, 4) : "";
}

// Función para obtener el color de fondo de la mesa basado en currentColor
export function getTableBackgroundColor(currentColor) {
  const colorMap = {
    red: "#4a1c1c", // Rojo oscuro
    blue: "#1c2c4a", // Azul oscuro
    green: "#1c4a2c", // Verde oscuro
    yellow: "#4a4a1c", // Amarillo oscuro
    wild: "#3c2a4a", // Púrpura oscuro para wild
  };
  return colorMap[currentColor?.toLowerCase()] || "#0d3b24"; // Verde por defecto
}

// Función para obtener el color del borde de la mesa basado en currentColor
export function getTableBorderColor(currentColor) {
  const colorMap = {
    red: "#6b2d2d", // Rojo borde
    blue: "#2d3a6b", // Azul borde
    green: "#2d6b3a", // Verde borde
    yellow: "#6b6b2d", // Amarillo borde
    wild: "#54396b", // Púrpura borde para wild
  };
  return colorMap[currentColor?.toLowerCase()] || "#145c36"; // Verde por defecto
}

// Función para obtener las posiciones según el número total de jugadores
export function getPlayerPositions(totalPlayers, debugMode = false) {
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

  // Modo debug: en 1 vs 1, llenar todas las posiciones para validar espacio
  if (debugMode && totalPlayers === 2) {
    return ["1x1", "1x2", "1x3", "2x1", "2x3", "5x1", "5x3"];
  }

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
}

// Calcular escala basada en altura de pantalla
export function getResponsiveScale(screenHeight) {
  const baseHeight = 680; // Altura de referencia (iPhone 11/12 estándar)
  const scale = Math.min(Math.max(screenHeight / baseHeight, 0.8), 1.5);
  return scale;
}

// Función para extraer el estado UNO del estado general
export function extractUnoState(s) {
  const unoState = {
    started: s.started,
    gameEnded: s.gameEnded,
    currentPlayer: s.currentPlayer,
    direction: s.direction,
    topCard: s.topCard,
    currentColor: s.currentColor,
    discardCount: s.discardCount,
    drawCount: s.drawCount,
    pendingDrawCount: s.pendingDrawCount,
    pendingDrawType: s.pendingDrawType,
    winner: s.winner,
    uno: s.uno || [],
    wild4Challenge: s.wild4Challenge || null,
    scores: s.scores || {},
    eliminatedPlayers: s.eliminatedPlayers || [],
    roundWinner: s.roundWinner || null,
  };

  // Solo incluir players si hay datos válidos y completos
  if (s.players && Array.isArray(s.players) && s.players.length > 0) {
    // Verificar que los jugadores tengan datos básicos (nombre o username)
    const validPlayers = s.players.filter((p) => p && (p.name || p.username));
    if (validPlayers.length > 0) {
      unoState.players = s.players;
    }
  }

  return unoState;
}
