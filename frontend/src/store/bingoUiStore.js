import { create } from 'zustand';

// Store minimal para la animación de la bola del bingo
// Solo guarda la bola actual y la anterior.
const useBingoUiStore = create((set) => ({
  currentBall: '?',
  prevBall: '',
  // Establece una nueva bola moviendo la actual a previa
  setBall: (n) => set((state) => {
    if (state.currentBall === n) return {};
    return { prevBall: state.currentBall, currentBall: n };
  }),
  // Limpia ambas (opcional; útil al salir o resetear juego)
  clearBalls: () => set({ currentBall: '?', prevBall: '' }),
}));

export default useBingoUiStore;
