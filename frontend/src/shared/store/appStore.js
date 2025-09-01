// 🌐 APP STORE - Estado global de la aplicación
// Maneja el estado compartido entre todas las pantallas y juegos

import { create } from "zustand";
import { persist } from "zustand/middleware";

const useAppStore = create(
  persist(
    (set, get) => ({
      // === CONFIGURACIÓN GLOBAL ===
      isDevMode: __DEV__,
      appVersion: "1.0.0",

      // === CONFIGURACIÓN DE UI ===
      theme: "default",
      sounds: {
        musicEnabled: true,
        effectsEnabled: true,
        musicVolume: 0.7,
        effectsVolume: 0.8,
      },

      // === CONFIGURACIÓN DE CONEXIÓN ===
      connectionStatus: "disconnected", // "disconnected" | "connecting" | "connected" | "error"
      serverUrl: null,

      // === PERFIL DE USUARIO ===
      user: {
        isLoggedIn: false,
        name: null,
        username: null,
        avatarId: null,
        preferences: {
          language: "es",
          notifications: true,
        },
      },

      // === ACCIONES ===

      // Configuración de sonidos
      setSoundConfig: (config) =>
        set((state) => ({
          sounds: { ...state.sounds, ...config },
        })),

      // Estado de conexión
      setConnectionStatus: (status) => set({ connectionStatus: status }),

      setServerUrl: (url) => set({ serverUrl: url }),

      // Perfil de usuario
      setUser: (userData) =>
        set((state) => ({
          user: { ...state.user, ...userData },
        })),

      login: (userData) =>
        set((state) => ({
          user: {
            ...state.user,
            ...userData,
            isLoggedIn: true,
          },
        })),

      logout: () =>
        set((state) => ({
          user: {
            ...state.user,
            isLoggedIn: false,
            name: null,
            username: null,
            avatarId: null,
          },
        })),

      // Tema
      setTheme: (theme) => set({ theme }),

      // Reset completo (para debugging)
      resetApp: () =>
        set({
          connectionStatus: "disconnected",
          serverUrl: null,
          user: {
            isLoggedIn: false,
            name: null,
            username: null,
            avatarId: null,
            preferences: {
              language: "es",
              notifications: true,
            },
          },
        }),
    }),
    {
      name: "family-games-app", // Nombre para AsyncStorage
      partialize: (state) => ({
        // Solo persistir estos campos
        sounds: state.sounds,
        theme: state.theme,
        user: state.user,
      }),
    }
  )
);

export default useAppStore;
