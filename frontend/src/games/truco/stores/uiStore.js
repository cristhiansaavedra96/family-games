// 🎮 STORE DE UI PARA TRUCO
// Estado de la interfaz de usuario del Truco

import { create } from "zustand";

export const useTrucoUiStore = create((set, get) => ({
  // Estados de modales
  showExitModal: false,
  showScoreModal: false,
  showTrucoModal: false,
  showEnvidoModal: false,
  showFlorModal: false,

  // Estados de animación
  animatingCard: null,
  showCardAnimation: false,

  // Estados de chat
  showChat: false,
  chatMessages: [],

  // Banners de mesa (cantos y avisos)
  tableBanners: [], // { id, playerId, message, type }

  // Abrir panel de acciones automáticamente ante cantos
  openActions: false,

  // Estados de información
  showHelpModal: false,
  showRulesModal: false,

  // Selección de cartas
  selectedCard: null,
  highlightedCards: [],

  // Configuración visual
  soundEnabled: true,
  animationsEnabled: true,

  // Acciones para modales
  setShowExitModal: (show) => set({ showExitModal: show }),
  setShowScoreModal: (show) => set({ showScoreModal: show }),
  setShowTrucoModal: (show) => set({ showTrucoModal: show }),
  setShowEnvidoModal: (show) => set({ showEnvidoModal: show }),
  setShowFlorModal: (show) => set({ showFlorModal: show }),
  setShowHelpModal: (show) => set({ showHelpModal: show }),
  setShowRulesModal: (show) => set({ showRulesModal: show }),

  // Acciones para animaciones
  setAnimatingCard: (card) => set({ animatingCard: card }),
  setShowCardAnimation: (show) => set({ showCardAnimation: show }),

  // Acciones para chat
  setShowChat: (show) => set({ showChat: show }),
  addChatMessage: (message) =>
    set((state) => ({
      chatMessages: [...state.chatMessages, message],
    })),
  clearChatMessages: () => set({ chatMessages: [] }),

  // Acciones banners
  addBanner: (banner) =>
    set((state) => ({ tableBanners: [...state.tableBanners, banner] })),
  removeBanner: (id) =>
    set((state) => ({
      tableBanners: state.tableBanners.filter((b) => b.id !== id),
    })),
  clearBanners: () => set({ tableBanners: [] }),

  // Abrir/cerrar panel acciones
  setOpenActions: (open) => set({ openActions: open }),

  // Acciones para selección
  setSelectedCard: (card) => set({ selectedCard: card }),
  setHighlightedCards: (cards) => set({ highlightedCards: cards }),
  clearSelection: () => set({ selectedCard: null, highlightedCards: [] }),

  // Acciones para configuración
  setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
  setAnimationsEnabled: (enabled) => set({ animationsEnabled: enabled }),

  // Limpiar todo el estado
  resetUiState: () =>
    set({
      showExitModal: false,
      showScoreModal: false,
      showTrucoModal: false,
      showEnvidoModal: false,
      showFlorModal: false,
      animatingCard: null,
      showCardAnimation: false,
      showChat: false,
      tableBanners: [],
      openActions: false,
      selectedCard: null,
      highlightedCards: [],
      showHelpModal: false,
      showRulesModal: false,
    }),
}));
