import { useEffect, useRef, useState, useCallback } from "react";
import { Audio } from "expo-av";

/**
 * Hook genérico para manejar música de fondo
 * Permite especificar el archivo de música y configuraciones
 * Persiste las configuraciones de volumen del usuario
 */
export function useBackgroundMusic({
  musicSource,
  volumeMultiplier = 1.0,
  storageKey = "audio:music",
  shouldLoop = true,
  autoStart = false,
  logPrefix = "[Audio]",
}) {
  const soundRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.3); // Volumen inicial moderado
  const [isMuted, setIsMuted] = useState(false); // Control de mute
  const [showAudioPanel, setShowAudioPanel] = useState(false); // Panel de control de audio

  // Cargar configuraciones guardadas al inicializar
  useEffect(() => {
    const loadSavedSettings = async () => {
      try {
        const { loadItem } = await import("../../../core/storage");

        // Cargar volumen guardado
        const savedVolume = await loadItem(`${storageKey}Volume`);
        if (savedVolume !== null) {
          const parsedVolume = parseFloat(savedVolume);
          if (!isNaN(parsedVolume) && parsedVolume >= 0 && parsedVolume <= 1) {
            setVolume(parsedVolume);
            console.log(`${logPrefix} Loaded saved volume:`, parsedVolume);
          }
        }

        // Cargar estado de mute guardado
        const savedMuted = await loadItem(`${storageKey}Muted`);
        if (savedMuted !== null) {
          const isMuted = savedMuted === "true";
          setIsMuted(isMuted);
          console.log(`${logPrefix} Loaded saved mute state:`, isMuted);
        }
      } catch (error) {
        console.warn(`${logPrefix} Error loading saved settings:`, error);
      }
    };

    loadSavedSettings();
  }, [storageKey, logPrefix]);

  // Función para guardar configuraciones
  const saveSettings = useCallback(
    async (volumeToSave, muteToSave) => {
      try {
        const { saveItem } = await import("../../../core/storage");
        await saveItem(`${storageKey}Volume`, volumeToSave.toString());
        await saveItem(`${storageKey}Muted`, muteToSave.toString());
        console.log(
          `${logPrefix} Settings saved - Volume:`,
          volumeToSave,
          "Muted:",
          muteToSave
        );
      } catch (error) {
        console.warn(`${logPrefix} Error saving settings:`, error);
      }
    },
    [storageKey, logPrefix]
  );

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
        console.log(`${logPrefix} Audio mode configured successfully`);
      } catch (error) {
        console.warn(`${logPrefix} Error setting up audio mode:`, error);
      }
    };

    setupAudio();
  }, [logPrefix]);

  // Función para iniciar la música
  const startMusic = useCallback(async () => {
    try {
      if (!musicSource) {
        console.warn(`${logPrefix} No music source provided`);
        return;
      }

      console.log(`${logPrefix} Attempting to start music...`);

      // Si ya hay una instancia, no crear otra
      if (soundRef.current) {
        console.log(`${logPrefix} Sound instance exists, checking status...`);
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded && !status.isPlaying) {
          console.log(`${logPrefix} Resuming existing sound...`);
          await soundRef.current.setVolumeAsync(volume * volumeMultiplier);
          await soundRef.current.playAsync();
          setIsPlaying(true);
        }
        return;
      }

      console.log(`${logPrefix} Creating new sound instance...`);

      // Cargar y reproducir la música
      const { sound } = await Audio.Sound.createAsync(musicSource, {
        shouldPlay: true,
        isLooping: shouldLoop,
        volume: volume * volumeMultiplier,
      });

      console.log(`${logPrefix} Sound created successfully!`);
      soundRef.current = sound;
      setIsPlaying(true);

      // Configurar callback para cuando termine
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish && !status.isLooping) {
          setIsPlaying(false);
        }
      });
    } catch (error) {
      console.error(`${logPrefix} Error starting music:`, error);
    }
  }, [musicSource, volume, volumeMultiplier, shouldLoop, logPrefix]);

  // Función para parar completamente la música
  const stopMusic = useCallback(async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        setIsPlaying(false);
      }
    } catch (error) {
      console.warn(`${logPrefix} Error stopping music:`, error);
    }
  }, [logPrefix]);

  // Función para cambiar el volumen
  const changeVolume = useCallback(
    async (newVolume) => {
      try {
        const clampedVolume = Math.max(0, Math.min(1, newVolume));
        setVolume(clampedVolume);

        if (soundRef.current) {
          await soundRef.current.setVolumeAsync(
            clampedVolume * volumeMultiplier
          );
        }

        // Guardar configuración automáticamente
        await saveSettings(clampedVolume, isMuted);
      } catch (error) {
        console.warn(`${logPrefix} Error changing volume:`, error);
      }
    },
    [isMuted, saveSettings, volumeMultiplier, logPrefix]
  );

  // Función para mostrar/ocultar el panel de audio
  const toggleAudioPanel = useCallback(() => {
    setShowAudioPanel((prev) => !prev);
  }, []);

  // Función para cerrar el panel de audio
  const closeAudioPanel = useCallback(() => {
    setShowAudioPanel(false);
  }, []);

  // Función para toggle del mute
  const toggleMute = useCallback(async () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);

    if (soundRef.current) {
      // Cuando se mutea, pausar la música
      if (newMuted && isPlaying) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
      }
      // Cuando se desmutea, reanudar la música
      else if (!newMuted) {
        await startMusic();
      }
    }

    // Guardar configuración automáticamente
    await saveSettings(volume, newMuted);
    console.log(`${logPrefix} Mute toggled to:`, newMuted);
  }, [isMuted, isPlaying, startMusic, volume, saveSettings, logPrefix]);

  // Auto-start si está configurado
  useEffect(() => {
    if (autoStart && musicSource && !isPlaying && !isMuted) {
      startMusic();
    }
  }, [autoStart, musicSource, isPlaying, isMuted, startMusic]);

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
    isMuted,
    showAudioPanel,
    startMusic,
    stopMusic,
    changeVolume,
    toggleAudioPanel,
    closeAudioPanel,
    toggleMute,
  };
}
