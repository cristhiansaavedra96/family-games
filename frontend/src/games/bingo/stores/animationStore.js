import { create } from "zustand";

// 🎬 BINGO ANIMATION STORE
// Maneja todas las animaciones específicas del juego Bingo
// Evita animaciones duplicadas y gestiona timings

const useBingoAnimationStore = create((set, get) => ({
  // === ESTADO DE ANIMACIONES ===

  // Control de animación de bolas
  lastAnimatedBall: null,
  lastAnimationTime: 0,
  animationWindow: 600, // ms para evitar duplicados

  // Estado de animaciones activas
  isAnimating: false,
  activeAnimations: new Set(),

  // Configuración de animaciones
  animationConfig: {
    ballAnimation: {
      duration: 1200,
      bounce: true,
      scale: 1.2,
    },
    cardAnimation: {
      duration: 300,
      highlight: true,
    },
    figureAnimation: {
      duration: 800,
      glow: true,
    },
  },

  // === ACCIONES ===

  // Control de animación de bolas
  shouldAnimate: (ball) => {
    if (ball == null) return false;

    const { lastAnimatedBall, lastAnimationTime, animationWindow } = get();
    const now = Date.now();
    const isDuplicate =
      lastAnimatedBall === ball && now - lastAnimationTime < animationWindow;

    if (isDuplicate) {
      console.log(`🎬 Animación duplicada evitada para bola: ${ball}`);
      return false;
    }

    set({
      lastAnimatedBall: ball,
      lastAnimationTime: now,
    });

    return true;
  },

  // Gestión de animaciones activas
  startAnimation: (animationId) =>
    set((state) => ({
      isAnimating: true,
      activeAnimations: new Set([...state.activeAnimations, animationId]),
    })),

  endAnimation: (animationId) =>
    set((state) => {
      const newActiveAnimations = new Set(state.activeAnimations);
      newActiveAnimations.delete(animationId);

      return {
        activeAnimations: newActiveAnimations,
        isAnimating: newActiveAnimations.size > 0,
      };
    }),

  // Configuración de animaciones
  updateAnimationConfig: (updates) =>
    set((state) => ({
      animationConfig: {
        ...state.animationConfig,
        ...updates,
      },
    })),

  setBallAnimationDuration: (duration) =>
    set((state) => ({
      animationConfig: {
        ...state.animationConfig,
        ballAnimation: {
          ...state.animationConfig.ballAnimation,
          duration,
        },
      },
    })),

  setAnimationWindow: (window) => set({ animationWindow: window }),

  // Control de animaciones específicas
  triggerBallAnimation: (ball) => {
    if (!get().shouldAnimate(ball)) return false;

    const animationId = `ball-${ball}-${Date.now()}`;
    get().startAnimation(animationId);

    // Auto-terminar la animación después de su duración
    setTimeout(() => {
      get().endAnimation(animationId);
    }, get().animationConfig.ballAnimation.duration);

    return true;
  },

  triggerCardHighlight: (cardIndex, duration = null) => {
    const animationId = `card-${cardIndex}-${Date.now()}`;
    const animDuration =
      duration || get().animationConfig.cardAnimation.duration;

    get().startAnimation(animationId);

    setTimeout(() => {
      get().endAnimation(animationId);
    }, animDuration);

    return animationId;
  },

  triggerFigureAnimation: (figure, duration = null) => {
    const animationId = `figure-${figure}-${Date.now()}`;
    const animDuration =
      duration || get().animationConfig.figureAnimation.duration;

    get().startAnimation(animationId);

    setTimeout(() => {
      get().endAnimation(animationId);
    }, animDuration);

    return animationId;
  },

  // Reset y limpieza
  reset: () =>
    set({
      lastAnimatedBall: null,
      lastAnimationTime: 0,
      isAnimating: false,
      activeAnimations: new Set(),
    }),

  stopAllAnimations: () =>
    set({
      isAnimating: false,
      activeAnimations: new Set(),
    }),

  // === SELECTORES ===

  // Verificar si una animación específica está activa
  isAnimationActive: (animationId) => {
    return get().activeAnimations.has(animationId);
  },

  // Obtener número de animaciones activas
  getActiveAnimationsCount: () => {
    return get().activeAnimations.size;
  },

  // Verificar si se puede animar una bola
  canAnimateBall: (ball) => {
    return get().shouldAnimate(ball);
  },
}));

// Renombrar para mayor claridad
export default useBingoAnimationStore;
