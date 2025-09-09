import { useEffect, useRef } from "react";
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
} from "react-native-reanimated";

/**
 * Hook para animaciones de transición del juego UNO
 * Maneja animaciones de estado general del juego, turnos, etc.
 */
export function useGameTransitions() {
  const turnIndicatorScale = useSharedValue(1);
  const turnIndicatorOpacity = useSharedValue(1);
  const backgroundPulse = useSharedValue(0);

  const prevCurrentPlayer = useRef(null);

  // Animación para cambio de turno
  const animateTurnChange = (isMyTurn) => {
    "worklet";

    if (isMyTurn) {
      // Mi turno - efecto de resaltado
      turnIndicatorScale.value = withSequence(
        withTiming(1.2, { duration: 200 }),
        withSpring(1.1, { damping: 15, stiffness: 300 })
      );
      turnIndicatorOpacity.value = withTiming(1, { duration: 200 });
      backgroundPulse.value = withTiming(1, { duration: 300 });
    } else {
      // No es mi turno - efecto sutil
      turnIndicatorScale.value = withSpring(1, { damping: 15, stiffness: 300 });
      turnIndicatorOpacity.value = withTiming(0.7, { duration: 200 });
      backgroundPulse.value = withTiming(0, { duration: 300 });
    }
  };

  // Animación para nuevo juego
  const animateNewGame = () => {
    "worklet";

    // Reset y fade in
    turnIndicatorScale.value = 0;
    turnIndicatorOpacity.value = 0;
    backgroundPulse.value = 0;

    turnIndicatorScale.value = withDelay(
      500,
      withSpring(1, { damping: 12, stiffness: 200 })
    );
    turnIndicatorOpacity.value = withDelay(
      500,
      withTiming(1, { duration: 400 })
    );
  };

  // Estilos animados
  const animatedTurnIndicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: turnIndicatorScale.value }],
      opacity: turnIndicatorOpacity.value,
    };
  });

  const animatedBackgroundStyle = useAnimatedStyle(() => {
    const pulseOpacity = backgroundPulse.value * 0.1;
    return {
      backgroundColor: `rgba(255, 215, 0, ${pulseOpacity})`, // Sutil glow dorado
    };
  });

  return {
    animatedTurnIndicatorStyle,
    animatedBackgroundStyle,
    animateTurnChange,
    animateNewGame,
  };
}

/**
 * Hook para detectar y animar cambios de estado del juego
 */
export function useGameStateAnimations(publicState, isMyTurn) {
  const { animateTurnChange, animateNewGame } = useGameTransitions();
  const prevTurn = useRef(null);
  const prevGameStarted = useRef(false);

  // Detectar cambios de turno
  useEffect(() => {
    if (publicState.currentPlayer !== prevTurn.current) {
      animateTurnChange(isMyTurn);
      prevTurn.current = publicState.currentPlayer;
    }
  }, [publicState.currentPlayer, isMyTurn, animateTurnChange]);

  // Detectar inicio de nuevo juego
  useEffect(() => {
    if (publicState.started && !prevGameStarted.current) {
      animateNewGame();
      prevGameStarted.current = true;
    } else if (!publicState.started) {
      prevGameStarted.current = false;
    }
  }, [publicState.started, animateNewGame]);

  return useGameTransitions();
}
