import { create } from 'zustand';

// Almacena el último número animado y su timestamp para deduplicar en ventanas cortas
const useAnimationStore = create((set, get) => ({
  lastBall: null,
  lastAt: 0,
  windowMs: 600, // ventana de 600ms para evitar dobles animaciones por StrictMode/remontes
  shouldAnimate: (ball) => {
    if (ball == null) return false;
    const { lastBall, lastAt, windowMs } = get();
    const now = Date.now();
    const duplicate = lastBall === ball && (now - lastAt) < windowMs;
    if (duplicate) return false;
    set({ lastBall: ball, lastAt: now });
    return true;
  },
  reset: () => set({ lastBall: null, lastAt: 0 })
}));

export default useAnimationStore;
