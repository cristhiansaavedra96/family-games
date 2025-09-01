import { create } from "zustand";

// 🎯 BINGO UI STORE
// Store específico para el estado de la interfaz del juego Bingo
// Se enfoca únicamente en datos específicos del Bingo que no están en el store compartido

const useBingoUiStore = create((set, get) => ({
  // === ESTADO DE LA BOLA ACTUAL ===
  currentBall: "?",
  prevBall: "",

  // === ESTADO DE LAS CARTAS ===
  selectedCardIndex: 0,
  cardStates: [], // Estados de las cartas del jugador

  // === CONFIGURACIÓN ESPECÍFICA DEL BINGO ===
  showNumbers: true,
  autoMarkMode: false,
  cardLayout: "grid", // 'grid' | 'stack' | 'carousel'

  // === ESTADO DE FIGURAS ===
  availableFigures: ["corners", "row", "column", "diagonal", "border", "full"],
  completedFigures: {},

  // === ACCIONES ===

  // Gestión de bolas
  setBall: (n) =>
    set((state) => {
      if (state.currentBall === n) return {};
      return {
        prevBall: state.currentBall,
        currentBall: n,
      };
    }),

  clearBalls: () =>
    set({
      currentBall: "?",
      prevBall: "",
    }),

  // Gestión de cartas
  setSelectedCard: (index) =>
    set({
      selectedCardIndex: index,
    }),

  updateCardState: (cardIndex, state) =>
    set((current) => ({
      cardStates: current.cardStates.map((cardState, index) =>
        index === cardIndex ? { ...cardState, ...state } : cardState
      ),
    })),

  initializeCards: (numCards) =>
    set({
      cardStates: Array.from({ length: numCards }, () => ({
        marked: Array(5)
          .fill()
          .map(() => Array(5).fill(false)),
        isActive: true,
        hasWinningPattern: false,
      })),
    }),

  // Configuración
  setShowNumbers: (show) =>
    set({
      showNumbers: show,
    }),

  setAutoMarkMode: (auto) =>
    set({
      autoMarkMode: auto,
    }),

  setCardLayout: (layout) =>
    set({
      cardLayout: layout,
    }),

  // Figuras
  setCompletedFigure: (figure, playerId) =>
    set((state) => ({
      completedFigures: {
        ...state.completedFigures,
        [figure]: playerId,
      },
    })),

  clearCompletedFigures: () =>
    set({
      completedFigures: {},
    }),

  // Reset específico del Bingo
  resetBingo: () =>
    set({
      currentBall: "?",
      prevBall: "",
      selectedCardIndex: 0,
      cardStates: [],
      completedFigures: {},
      showNumbers: true,
      autoMarkMode: false,
      cardLayout: "grid",
    }),

  // === SELECTORES ===

  // Obtener estado de una carta específica
  getCardState: (cardIndex) => {
    const { cardStates } = get();
    return cardStates[cardIndex] || null;
  },

  // Verificar si hay alguna figura completada
  hasAnyCompletedFigure: () => {
    const { completedFigures } = get();
    return Object.keys(completedFigures).length > 0;
  },

  // Obtener figuras disponibles para reclamar
  getAvailableFigures: () => {
    const { availableFigures, completedFigures } = get();
    return availableFigures.filter((figure) => !completedFigures[figure]);
  },
}));

export default useBingoUiStore;
