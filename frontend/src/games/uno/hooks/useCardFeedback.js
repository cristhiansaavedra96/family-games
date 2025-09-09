import { useCallback } from "react";
import { Vibration } from "react-native";

/**
 * Hook para manejar efectos de feedback (vibración, sonidos, etc.)
 * en respuesta a las animaciones de cartas
 */
export function useCardFeedback() {
  // Vibración sutil para selección
  const feedbackSelection = useCallback(() => {
    try {
      Vibration.vibrate(50); // Vibración muy corta
    } catch (error) {
      // Ignorar errores de vibración en simuladores
    }
  }, []);

  // Vibración para jugar carta
  const feedbackPlayCard = useCallback((cardType) => {
    try {
      if (cardType === "wild" || cardType === "wild_draw4") {
        // Patrón especial para cartas wild
        Vibration.vibrate([0, 100, 50, 100]);
      } else if (
        cardType === "draw2" ||
        cardType === "skip" ||
        cardType === "reverse"
      ) {
        // Vibración media para cartas especiales
        Vibration.vibrate(150);
      } else {
        // Vibración corta para cartas normales
        Vibration.vibrate(100);
      }
    } catch (error) {
      // Ignorar errores de vibración en simuladores
    }
  }, []);

  // Vibración para bounce (carta no válida)
  const feedbackBounce = useCallback(() => {
    try {
      Vibration.vibrate([0, 50, 30, 50]); // Patrón de "error"
    } catch (error) {
      // Ignorar errores de vibración en simuladores
    }
  }, []);

  // Vibración para entrada de cartas nuevas
  const feedbackCardEntry = useCallback(() => {
    try {
      Vibration.vibrate(30); // Muy sutil
    } catch (error) {
      // Ignorar errores de vibración en simuladores
    }
  }, []);

  return {
    feedbackSelection,
    feedbackPlayCard,
    feedbackBounce,
    feedbackCardEntry,
  };
}
