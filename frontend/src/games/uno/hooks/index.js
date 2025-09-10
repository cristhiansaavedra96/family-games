// 🎮 UNO GAME HOOKS
// Hooks específicos para el juego UNO

// Hooks de audio - versiones originales (mantener compatibilidad)
export { useBackgroundMusic } from "./useBackgroundMusic";
export { useSoundEffects } from "./useSoundEffects";

// Hooks de audio - nuevas versiones que usan los hooks genéricos
export { useUnoBackgroundMusic } from "./useUnoBackgroundMusic";
export { useUnoSoundEffects } from "./useUnoSoundEffects";

// Hooks de animaciones y feedback
export { useCardAnimations } from "./useCardAnimations";
export { useCardFeedback } from "./useCardFeedback";
export { useGameTransitions } from "./useGameTransitions";
