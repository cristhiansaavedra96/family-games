import { useRef, useMemo } from "react";
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
  interpolate,
  Extrapolate,
} from "react-native-reanimated";

/**
 * Hook para manejar todas las animaciones de las cartas en UNO
 * Incluye: selección, jugar carta, entrada de cartas nuevas, bounce de error, etc.
 */
export function useCardAnimations() {
  // Valores compartidos para diferentes tipos de animación
  const cardScale = useSharedValue(1);
  const cardRotate = useSharedValue(0);
  const cardTranslateY = useSharedValue(0);
  const cardTranslateX = useSharedValue(0);
  const cardOpacity = useSharedValue(1);
  const cardFlipRotation = useSharedValue(0);

  // Para animaciones de entrada (cuando se roba una carta)
  const enterFromDeck = useSharedValue(0);

  // Para bounce effect (carta no jugable)
  const bounceX = useSharedValue(0);
  const bounceY = useSharedValue(0);

  // Para glow effect en selección
  const glowIntensity = useSharedValue(0);

  // Animación de selección de carta (sutil levantamiento + glow)
  const animateSelection = (isSelected) => {
    "worklet";
    if (isSelected) {
      cardScale.value = withSpring(1.05, {
        damping: 15,
        stiffness: 300,
      });
      cardTranslateY.value = withSpring(-8, {
        damping: 15,
        stiffness: 300,
      });
      glowIntensity.value = withTiming(1, { duration: 200 });
    } else {
      cardScale.value = withSpring(1, {
        damping: 15,
        stiffness: 300,
      });
      cardTranslateY.value = withSpring(0, {
        damping: 15,
        stiffness: 300,
      });
      glowIntensity.value = withTiming(0, { duration: 200 });
    }
  };

  // Animación espectacular para cuando se juega una carta
  const animatePlayCard = (onComplete) => {
    "worklet";

    // Secuencia de animaciones:
    // 1. Flip rápido + escalado + movimiento hacia el centro
    // 2. Fade out
    // 3. Reset y callback

    const flipDuration = 400;
    const moveDuration = 600;

    // Flip de 360 grados + escala
    cardFlipRotation.value = withTiming(360, { duration: flipDuration });
    cardScale.value = withSequence(
      withTiming(1.3, { duration: flipDuration / 2 }),
      withTiming(1.1, { duration: flipDuration / 2 })
    );

    // Movimiento hacia el centro de la mesa
    cardTranslateY.value = withTiming(-150, {
      duration: moveDuration,
    });
    cardTranslateX.value = withTiming(0, {
      duration: moveDuration,
    });

    // Fade out al final
    cardOpacity.value = withDelay(
      moveDuration - 200,
      withTiming(0, { duration: 200 }, (finished) => {
        if (finished && onComplete) {
          runOnJS(onComplete)();
        }
      })
    );
  };

  // Animación para carta que entra desde el mazo (robar carta)
  const animateCardEntry = (index = 0, onComplete) => {
    "worklet";

    // Las cartas empiezan desde la posición del mazo (arriba-izquierda)
    cardTranslateX.value = -200; // Desde la izquierda (mazo)
    cardTranslateY.value = -100; // Desde arriba
    cardOpacity.value = 0;
    cardScale.value = 0.3;
    cardRotate.value = -45; // Rotación inicial para efecto dinámico

    // Delay basado en el índice para efecto escalonado
    const delay = index * 100;

    // Animación de entrada con bounce
    cardTranslateX.value = withDelay(
      delay,
      withSpring(0, {
        damping: 12,
        stiffness: 200,
      })
    );

    cardTranslateY.value = withDelay(
      delay,
      withSpring(0, {
        damping: 12,
        stiffness: 200,
      })
    );

    cardOpacity.value = withDelay(delay, withTiming(1, { duration: 300 }));

    cardScale.value = withDelay(
      delay,
      withSpring(1, {
        damping: 10,
        stiffness: 300,
      })
    );

    cardRotate.value = withDelay(
      delay,
      withSpring(
        0,
        {
          damping: 15,
          stiffness: 200,
        },
        (finished) => {
          if (finished && onComplete) {
            runOnJS(onComplete)();
          }
        }
      )
    );
  };

  // Efecto bounce para cartas no jugables
  const animateBounce = () => {
    "worklet";

    bounceX.value = withSequence(
      withTiming(10, { duration: 100 }),
      withTiming(-10, { duration: 100 }),
      withTiming(5, { duration: 100 }),
      withTiming(0, { duration: 100 })
    );

    // Pequeño bounce vertical también
    bounceY.value = withSequence(
      withTiming(-5, { duration: 150 }),
      withTiming(0, { duration: 150 })
    );
  };

  // Reset todas las animaciones
  const resetAnimations = () => {
    "worklet";
    cardScale.value = withTiming(1, { duration: 200 });
    cardRotate.value = withTiming(0, { duration: 200 });
    cardTranslateY.value = withTiming(0, { duration: 200 });
    cardTranslateX.value = withTiming(0, { duration: 200 });
    cardOpacity.value = withTiming(1, { duration: 200 });
    cardFlipRotation.value = 0;
    bounceX.value = withTiming(0, { duration: 200 });
    bounceY.value = withTiming(0, { duration: 200 });
    glowIntensity.value = withTiming(0, { duration: 200 });
  };

  // Estilos animados calculados
  const animatedCardStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: cardScale.value },
        { translateY: cardTranslateY.value + bounceY.value },
        { translateX: cardTranslateX.value + bounceX.value },
        { rotateZ: `${cardRotate.value}deg` },
        { rotateY: `${cardFlipRotation.value}deg` },
      ],
      opacity: cardOpacity.value,
    };
  });

  // Estilo para el efecto glow
  const animatedGlowStyle = useAnimatedStyle(() => {
    const glowOpacity = interpolate(
      glowIntensity.value,
      [0, 1],
      [0, 0.6],
      Extrapolate.CLAMP
    );

    return {
      opacity: glowOpacity,
      transform: [
        {
          scale: interpolate(
            glowIntensity.value,
            [0, 1],
            [1, 1.15],
            Extrapolate.CLAMP
          ),
        },
      ],
    };
  });

  return {
    // Valores para uso directo
    animatedCardStyle,
    animatedGlowStyle,

    // Funciones de animación
    animateSelection,
    animatePlayCard,
    animateCardEntry,
    animateBounce,
    resetAnimations,

    // Valores compartidos para casos especiales
    cardScale,
    cardRotate,
    cardTranslateY,
    cardTranslateX,
    cardOpacity,
    cardFlipRotation,
    glowIntensity,
    bounceX,
    bounceY,
  };
}

// Hook simplificado para animaciones del centro de mesa
export function useCenterTableAnimations() {
  const scaleCenter = useSharedValue(1);
  const rotateCenter = useSharedValue(0);
  const colorTransition = useSharedValue(0);
  const pulseEffect = useSharedValue(0);

  // Animación sutil cuando cambia la carta del centro
  const animateCardChange = (cardType = "normal") => {
    "worklet";

    if (cardType === "wild" || cardType === "wild_draw4") {
      // Animación especial para cartas wild - más sutil
      scaleCenter.value = withSequence(
        withTiming(1.15, { duration: 150 }),
        withTiming(0.95, { duration: 150 }),
        withTiming(1.05, { duration: 150 }),
        withTiming(1, { duration: 150 })
      );

      rotateCenter.value = withSequence(
        withTiming(8, { duration: 200 }),
        withTiming(-8, { duration: 200 }),
        withTiming(0, { duration: 200 })
      );

      pulseEffect.value = withSequence(
        withTiming(0.7, { duration: 300 }),
        withTiming(0, { duration: 300 })
      );
    } else if (
      cardType === "draw2" ||
      cardType === "skip" ||
      cardType === "reverse"
    ) {
      // Animación para cartas especiales - sutil
      scaleCenter.value = withSequence(
        withTiming(1.1, { duration: 200 }),
        withTiming(0.98, { duration: 150 }),
        withTiming(1, { duration: 150 })
      );

      rotateCenter.value = withSequence(
        withTiming(6, { duration: 150 }),
        withTiming(-6, { duration: 150 }),
        withTiming(0, { duration: 150 })
      );
    } else {
      // Animación normal para cartas numéricas - muy sutil
      scaleCenter.value = withSequence(
        withTiming(1.06, { duration: 200 }),
        withTiming(0.99, { duration: 150 }),
        withTiming(1, { duration: 150 })
      );

      rotateCenter.value = withSequence(
        withTiming(4, { duration: 150 }),
        withTiming(-4, { duration: 150 }),
        withTiming(0, { duration: 150 })
      );
    }
  };

  // Animación para cambio de color (color especial de fondo) - más sutil
  const animateColorChange = () => {
    "worklet";
    colorTransition.value = withSequence(
      withTiming(0.5, { duration: 400 }),
      withTiming(0, { duration: 400 })
    );
  };

  const animatedCenterStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scaleCenter.value },
        { rotateZ: `${rotateCenter.value}deg` },
      ],
    };
  });

  const animatedColorOverlayStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        colorTransition.value,
        [0, 1],
        [0, 0.3],
        Extrapolate.CLAMP
      ),
    };
  });

  const animatedPulseStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        pulseEffect.value,
        [0, 1],
        [0, 0.5],
        Extrapolate.CLAMP
      ),
      transform: [
        {
          scale: interpolate(
            pulseEffect.value,
            [0, 1],
            [1, 1.2],
            Extrapolate.CLAMP
          ),
        },
      ],
    };
  });

  return {
    animatedCenterStyle,
    animatedColorOverlayStyle,
    animatedPulseStyle,
    animateCardChange,
    animateColorChange,
  };
}
