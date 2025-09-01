// 🎮 BINGO GAME SYSTEM
// Sistema completo del juego Bingo - Todos los exports centralizados

// Componentes del Bingo
export * from "./components";

// Hooks del Bingo
export * from "./hooks";

// Stores del Bingo - Exportaciones específicas para evitar conflictos
export { useBingoUiStore, useBingoAnimationStore } from "./stores";

// Pantallas
export { default as GameScreen } from "./screens/GameScreen";

// Utilidades del Bingo
export {
  calculateCardLayout,
  getPlayerCompletedFigures,
  getCardSpecificFigures,
  getFigureLabel,
  getCardSize,
  checkFigures,
} from "./utils/layout";

// Funciones de voz
export { speakNumberBingo } from "./utils/voice";
