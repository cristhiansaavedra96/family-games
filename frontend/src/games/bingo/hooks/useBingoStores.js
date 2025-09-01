// 🔗 BINGO HOOKS COMBINADOS
// Hooks que combinan estados de diferentes stores para el juego Bingo
// Separados para evitar dependencias circulares

import { useBingoUiStore, useBingoAnimationStore } from "../stores";
import { useGameStore } from "../../../shared/store";

// Hook combinado para obtener toda la información del estado del Bingo
export const useBingoState = () => {
  // Estados compartidos
  const gameState = useGameStore((state) => state.gameState);
  const isGameStarted = useGameStore((state) => state.gameStarted);
  const config = useGameStore((state) => state.config);

  // Estados específicos del Bingo
  const currentBall = useBingoUiStore((state) => state.currentBall);
  const prevBall = useBingoUiStore((state) => state.prevBall);
  const completedFigures = useBingoUiStore((state) => state.completedFigures);
  const selectedCardIndex = useBingoUiStore((state) => state.selectedCardIndex);

  return {
    // Estado general
    gameState,
    isGameStarted,
    config,

    // Estado específico del Bingo
    currentBall,
    prevBall,
    completedFigures,
    selectedCardIndex,

    // Estados derivados
    isPlaying: gameState === "playing",
    hasBall: currentBall !== "?",
    hasCompletedFigures: Object.keys(completedFigures).length > 0,
  };
};

// Hook para animaciones del Bingo
export const useBingoAnimations = () => {
  const shouldAnimate = useBingoAnimationStore((state) => state.shouldAnimate);
  const triggerBallAnimation = useBingoAnimationStore(
    (state) => state.triggerBallAnimation
  );
  const triggerCardHighlight = useBingoAnimationStore(
    (state) => state.triggerCardHighlight
  );
  const triggerFigureAnimation = useBingoAnimationStore(
    (state) => state.triggerFigureAnimation
  );
  const isAnimating = useBingoAnimationStore((state) => state.isAnimating);

  return {
    shouldAnimate,
    triggerBallAnimation,
    triggerCardHighlight,
    triggerFigureAnimation,
    isAnimating,
  };
};

// Hook para las cartas del Bingo
export const useBingoCards = () => {
  const cardStates = useBingoUiStore((state) => state.cardStates);
  const selectedCardIndex = useBingoUiStore((state) => state.selectedCardIndex);
  const setSelectedCard = useBingoUiStore((state) => state.setSelectedCard);
  const updateCardState = useBingoUiStore((state) => state.updateCardState);
  const getCardState = useBingoUiStore((state) => state.getCardState);

  return {
    cardStates,
    selectedCardIndex,
    selectedCard: cardStates[selectedCardIndex] || null,
    setSelectedCard,
    updateCardState,
    getCardState,
    totalCards: cardStates.length,
  };
};
