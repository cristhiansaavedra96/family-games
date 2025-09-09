import { useEffect, useRef, useState, useCallback } from "react";
import { Audio } from "expo-av";

/**
 * Hook para manejar la música de fondo del juego UNO
 * Se reproduce en loop y se puede controlar el volumen
 */
export function useBackgroundMusic() {
  const soundRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.3); // Volumen inicial moderado
  const [isUserMuted, setIsUserMuted] = useState(false); // Control manual del usuario
  const [showAudioPanel, setShowAudioPanel] = useState(false); // Panel de control de audio

  // Configurar el modo de audio al inicializar
  useEffect(() => {
    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: false,
          interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_MIX_WITH_OTHERS,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DUCK_OTHERS,
          playThroughEarpieceAndroid: false,
        });
        console.log("[UNO Audio] Audio mode configured successfully");
      } catch (error) {
        console.warn("[UNO Audio] Error setting up audio mode:", error);
      }
    };

    setupAudio();
  }, []);

  // Función para iniciar la música (solo si no está pausada por el usuario)
  const startMusic = useCallback(
    async (forceStart = false) => {
      try {
        // Si el usuario pausó manualmente, no iniciar automáticamente (excepto si es forzado)
        if (isUserMuted && !forceStart) {
          console.log(
            "[UNO Audio] Music is muted by user, not starting automatically"
          );
          return;
        }

        console.log("[UNO Audio] Attempting to start music...");

        // Si ya hay una instancia, no crear otra
        if (soundRef.current) {
          console.log("[UNO Audio] Sound instance exists, checking status...");
          const status = await soundRef.current.getStatusAsync();
          if (status.isLoaded && !status.isPlaying) {
            console.log("[UNO Audio] Resuming existing sound...");
            await soundRef.current.playAsync();
            setIsPlaying(true);
            if (forceStart) setIsUserMuted(false); // Si es forzado, desactivar mute
          }
          return;
        }

        console.log("[UNO Audio] Creating new sound instance...");

        // Cargar y reproducir la música
        const { sound } = await Audio.Sound.createAsync(
          require("../assets/music/background.mp3"),
          {
            shouldPlay: true,
            isLooping: true,
            volume: volume,
          }
        );

        console.log("[UNO Audio] Sound created successfully!");
        soundRef.current = sound;
        setIsPlaying(true);
        if (forceStart) setIsUserMuted(false); // Si es forzado, desactivar mute

        // Configurar callback para cuando termine (aunque no debería con loop)
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.didJustFinish && !status.isLooping) {
            setIsPlaying(false);
          }
        });
      } catch (error) {
        console.error("[UNO Audio] Error starting background music:", error);
        console.error("[UNO Audio] Error details:", error.message);
      }
    },
    [volume, isUserMuted]
  );

  // Función para pausar la música (marcada como acción del usuario)
  const pauseMusic = useCallback(async (isUserAction = false) => {
    try {
      if (soundRef.current) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
        if (isUserAction) {
          setIsUserMuted(true);
          console.log("[UNO Audio] Music paused by user");
        }
      }
    } catch (error) {
      console.warn("[UNO Audio] Error pausing music:", error);
    }
  }, []);

  // Función para parar completamente la música
  const stopMusic = useCallback(async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        setIsPlaying(false);
      }
    } catch (error) {
      console.warn("[UNO Audio] Error stopping music:", error);
    }
  }, []);

  // Función para toggle manual del usuario (botón)
  const toggleMusic = useCallback(async () => {
    if (isPlaying) {
      await pauseMusic(true); // Marcar como acción del usuario
    } else {
      await startMusic(true); // Forzar inicio (ignorar mute del usuario)
    }
  }, [isPlaying, pauseMusic, startMusic]);

  // Función para cambiar el volumen
  const changeVolume = useCallback(async (newVolume) => {
    try {
      const clampedVolume = Math.max(0, Math.min(1, newVolume));
      setVolume(clampedVolume);

      if (soundRef.current) {
        await soundRef.current.setVolumeAsync(clampedVolume);
      }
    } catch (error) {
      console.warn("[UNO Audio] Error changing volume:", error);
    }
  }, []);

  // Función para mostrar/ocultar el panel de audio
  const toggleAudioPanel = useCallback(() => {
    setShowAudioPanel((prev) => !prev);
  }, []);

  // Función para cerrar el panel de audio
  const closeAudioPanel = useCallback(() => {
    setShowAudioPanel(false);
  }, []);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  return {
    isPlaying,
    volume,
    isUserMuted,
    showAudioPanel,
    startMusic,
    pauseMusic,
    stopMusic,
    toggleMusic,
    changeVolume,
    toggleAudioPanel,
    closeAudioPanel,
  };
}
