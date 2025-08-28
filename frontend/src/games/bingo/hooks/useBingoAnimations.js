import { useCallback, useEffect, useRef } from 'react';
import { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring,
  runOnUI,
  cancelAnimation,
  Easing
} from 'react-native-reanimated';

export function useBingoAnimations() {
  // Valores compartidos para transiciones fluidas
  const ballScale = useSharedValue(1);
  const ballOpacity = useSharedValue(1);
  const ballTranslateY = useSharedValue(0);
  const ballRotation = useSharedValue(0);
  const historyOpacity = useSharedValue(1);
  
  // Ref para evitar múltiples animaciones simultáneas
  const isAnimatingRef = useRef(false);
  const animationTimeoutRef = useRef(null);

  // Worklet para animación fluida: salida de la anterior + entrada de la nueva
  const animateBallWorklet = useCallback(() => {
    'worklet';
    
    // Cancelar animaciones previas
    cancelAnimation(ballScale);
    cancelAnimation(ballOpacity);
    cancelAnimation(ballTranslateY);
    cancelAnimation(ballRotation);
    cancelAnimation(historyOpacity);
    
    // FASE 1: Animación de salida de la bola anterior (rápida y sutil)
    ballScale.value = withTiming(0.85, { 
      duration: 150,
      easing: Easing.in(Easing.ease)
    });
    
    ballOpacity.value = withTiming(0.3, { 
      duration: 150,
      easing: Easing.in(Easing.ease)
    });
    
    ballTranslateY.value = withTiming(15, { 
      duration: 150,
      easing: Easing.in(Easing.ease)
    }, (finished) => {
      if (finished) {
        // FASE 2: Preparar entrada de la nueva bola (desde arriba)
        ballTranslateY.value = -25;
        ballScale.value = 0.7;
        ballOpacity.value = 0.2;
        ballRotation.value = -10;
        
        // FASE 3: Animación de entrada de la nueva bola (fluida y con bounce)
        ballTranslateY.value = withSpring(0, {
          damping: 18,
          stiffness: 280,
          mass: 1
        });
        
        ballScale.value = withSpring(1.12, {
          damping: 15,
          stiffness: 250
        }, (finished) => {
          if (finished) {
            // FASE 4: Asentamiento final suave
            ballScale.value = withSpring(1, {
              damping: 25,
              stiffness: 400
            });
          }
        });
        
        ballOpacity.value = withTiming(1, {
          duration: 300,
          easing: Easing.out(Easing.ease)
        });
        
        ballRotation.value = withSpring(0, {
          damping: 20,
          stiffness: 300
        });
      }
    });
    
    // Efecto sutil en historial sincronizado
    historyOpacity.value = withTiming(0.7, { 
      duration: 100 
    }, () => {
      historyOpacity.value = withTiming(1, { 
        duration: 200 
      });
    });
  }, [ballScale, ballOpacity, ballTranslateY, ballRotation, historyOpacity]);

  // Función principal con debounce para evitar múltiples llamadas
  const animateBall = useCallback(() => {
    // Evitar múltiples animaciones simultáneas
    if (isAnimatingRef.current) return;
    
    // Limpiar timeout anterior si existe
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }
    
    isAnimatingRef.current = true;
    
    // Ejecutar animación
    runOnUI(animateBallWorklet)();
    
    // Reset del flag después de la animación completa
    animationTimeoutRef.current = setTimeout(() => {
      isAnimatingRef.current = false;
    }, 800); // Tiempo total de la animación (salida + entrada)
  }, [animateBallWorklet]);

  // Estilos animados con todas las transformaciones para transición fluida
  const ballAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: ballTranslateY.value },
        { scale: ballScale.value },
        { rotate: `${ballRotation.value}deg` }
      ],
      opacity: ballOpacity.value
    };
  }, [ballScale, ballOpacity, ballTranslateY, ballRotation]);

  const historyAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: historyOpacity.value
    };
  }, [historyOpacity]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      // Limpiar timeout
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
      
      // Cancelar animaciones
      cancelAnimation(ballScale);
      cancelAnimation(ballOpacity);
      cancelAnimation(ballTranslateY);
      cancelAnimation(ballRotation);
      cancelAnimation(historyOpacity);
      
      // Reset del flag
      isAnimatingRef.current = false;
    };
  }, [ballScale, ballOpacity, historyOpacity]);

  return {
    animateBall,
    ballAnimatedStyle,
    historyAnimatedStyle
  };
}
