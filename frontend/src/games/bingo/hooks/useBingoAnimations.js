import { useCallback, useEffect } from 'react';
import { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring, 
  withSequence,
  runOnUI,
  cancelAnimation
} from 'react-native-reanimated';

export function useBingoAnimations() {
  // Valores compartidos de Reanimated - corren en el hilo UI
  const ballScale = useSharedValue(1);
  const ballRotation = useSharedValue(0);
  const ballTranslateY = useSharedValue(0);
  const historyOpacity = useSharedValue(1);

  // Función worklet que maneja las animaciones en el hilo UI
  const animateBallWorklet = useCallback(() => {
    'worklet';
    
    // Cancelar animaciones anteriores
    cancelAnimation(ballScale);
    cancelAnimation(ballRotation);
    cancelAnimation(ballTranslateY);
    cancelAnimation(historyOpacity);
    
    // Reiniciar posiciones
    ballTranslateY.value = -200;
    ballScale.value = 0.8;
    ballRotation.value = 0;
    
    // Animación de caída con timing suave
    ballTranslateY.value = withTiming(0, { 
      duration: 600 
    });
    
    // Animación de escala con rebote
    ballScale.value = withSequence(
      withTiming(1.3, { duration: 400 }),
      withSpring(1, { 
        damping: 15,
        stiffness: 150
      })
    );
    
    // Rotación suave
    ballRotation.value = withTiming(360, { 
      duration: 600 
    }, (finished) => {
      if (finished) {
        ballRotation.value = 0; // Reset
      }
    });

    // Animación del historial - independiente
    historyOpacity.value = withSequence(
      withTiming(0.3, { duration: 200 }),
      withTiming(1, { duration: 300 })
    );
  }, [ballScale, ballRotation, ballTranslateY, historyOpacity]);

  const animateNewBall = useCallback((shouldSkip = false) => {
    if (shouldSkip) return;
    
    // Ejecutar animaciones en el hilo UI
    runOnUI(animateBallWorklet)();
  }, [animateBallWorklet]);

  const stopAnimations = useCallback(() => {
    // Ejecutar cancelaciones en el hilo UI
    runOnUI(() => {
      'worklet';
      cancelAnimation(ballScale);
      cancelAnimation(ballRotation);
      cancelAnimation(ballTranslateY);
      cancelAnimation(historyOpacity);
    })();
  }, [ballScale, ballRotation, ballTranslateY, historyOpacity]);

  // Estilos animados - se calculan en el hilo UI
  const ballAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: ballTranslateY.value },
        { scale: ballScale.value },
        { rotate: `${ballRotation.value}deg` }
      ]
    };
  });

  const historyAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: historyOpacity.value
    };
  });

  // Efecto de limpieza al desmontar
  useEffect(() => {
    return () => {
      stopAnimations();
    };
  }, [stopAnimations]);

  return {
    ballAnimatedStyle,
    historyAnimatedStyle,
    animateNewBall,
    stopAnimations
  };
}
