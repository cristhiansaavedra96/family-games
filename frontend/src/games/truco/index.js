// 🎮 TRUCO GAME SYSTEM
// Sistema completo del juego Truco Uruguayo - Todos los exports centralizados

// Componentes del Truco
export * from "./components";

// Hooks del Truco
export * from "./hooks";

// Stores del Truco - Exportaciones específicas para evitar conflictos
export { useTrucoUiStore, useTrucoGameStore } from "./stores";

// Pantallas
export { default as GameScreen } from "./screens/GameScreen";

// Utilidades del Truco
export {
  getCardSuitSymbol,
  getCardColor,
  formatCardName,
  getCardStrength,
  calculateEnvido,
  hasFlor,
} from "./utils/cardHelpers";

// Servicios del Truco
export { TrucoSoundService } from "./utils/sound";
