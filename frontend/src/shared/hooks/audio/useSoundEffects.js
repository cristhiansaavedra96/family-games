import { useRef, useCallback, useState, useEffect } from "react";
import { Audio } from "expo-av";

/**
 * Hook genérico para manejar efectos de sonido
 * Permite reproducir múltiples tipos de sonidos con configuraciones personalizables
 * Persiste las configuraciones de volumen y mute del usuario
 */
export function useSoundEffects({
  storageKey = "audio:effects",
  volumeMultiplier = 1.0,
  logPrefix = "[SFX]",
} = {}) {
  const [effectsVolume, setEffectsVolume] = useState(0.5); // Volumen inicial moderado
  const [isEffectsMuted, setIsEffectsMuted] = useState(false); // Control de mute de efectos

  // Cargar configuraciones guardadas al inicializar
  useEffect(() => {
    const loadSavedSettings = async () => {
      try {
        const { loadItem } = await import("../../../core/storage");

        // Cargar volumen de efectos guardado
        const savedEffectsVolume = await loadItem(`${storageKey}Volume`);
        if (savedEffectsVolume !== null) {
          const parsedVolume = parseFloat(savedEffectsVolume);
          if (!isNaN(parsedVolume) && parsedVolume >= 0 && parsedVolume <= 1) {
            setEffectsVolume(parsedVolume);
            console.log(
              `${logPrefix} Loaded saved effects volume:`,
              parsedVolume
            );
          }
        }

        // Cargar estado de mute de efectos guardado
        const savedEffectsMuted = await loadItem(`${storageKey}Muted`);
        if (savedEffectsMuted !== null) {
          const isMuted = savedEffectsMuted === "true";
          setIsEffectsMuted(isMuted);
          console.log(`${logPrefix} Loaded saved effects mute state:`, isMuted);
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

  // Función genérica para reproducir cualquier sonido
  const playSound = useCallback(
    async (soundSource, options = {}) => {
      try {
        // No reproducir si está muteado
        if (isEffectsMuted) {
          console.log(`${logPrefix} Sound muted:`, soundSource);
          return;
        }

        const {
          volume: customVolume = effectsVolume,
          shouldLoop = false,
          onComplete = null,
          identifier = "generic",
        } = options;

        // Crear una nueva instancia cada vez para permitir múltiples reproducciones
        const { sound } = await Audio.Sound.createAsync(soundSource, {
          shouldPlay: true,
          isLooping: shouldLoop,
          volume: customVolume * volumeMultiplier,
        });

        // Configurar callback para limpiar después de reproducir
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.didJustFinish) {
            sound.unloadAsync();
            if (onComplete) onComplete();
          }
        });

        console.log(
          `${logPrefix} ${identifier} sound played at volume:`,
          customVolume * volumeMultiplier
        );
        return sound; // Retornar por si se necesita control adicional
      } catch (error) {
        console.warn(`${logPrefix} Error playing sound:`, error);
        return null;
      }
    },
    [effectsVolume, isEffectsMuted, volumeMultiplier, logPrefix]
  );

  // Función específica para sonido de carta (compatibilidad con UNO)
  const playCardSound = useCallback(async () => {
    return await playSound(
      require("../../../../assets/sound/shared/card.mp3"),
      { identifier: "card" }
    );
  }, [playSound]);

  // Función específica para sonido de barajado (compatibilidad con UNO)
  const playShuffleSound = useCallback(async () => {
    return await playSound(
      require("../../../../assets/sound/shared/shuffle.mp3"),
      { identifier: "shuffle" }
    );
  }, [playSound]);

  // Función específica para sonidos de botón (para menús)
  const playButtonSound = useCallback(
    async (buttonType = "default") => {
      // Por ahora usar el sonido de carta para botones, después se puede agregar sonido específico
      return await playSound(
        require("../../../../assets/sound/shared/card.mp3"),
        {
          identifier: `button-${buttonType}`,
          volume: effectsVolume * 0.7, // Botones más suaves
        }
      );
    },
    [playSound, effectsVolume]
  );

  // Función para cambiar el volumen de efectos
  const changeEffectsVolume = useCallback(
    async (newVolume) => {
      const clampedVolume = Math.max(0, Math.min(1, newVolume));
      setEffectsVolume(clampedVolume);

      // Guardar configuración automáticamente
      await saveSettings(clampedVolume, isEffectsMuted);
      console.log(`${logPrefix} Effects volume changed to:`, clampedVolume);
    },
    [isEffectsMuted, saveSettings, logPrefix]
  );

  // Función para toggle del mute de efectos
  const toggleEffectsMute = useCallback(async () => {
    const newMuted = !isEffectsMuted;
    setIsEffectsMuted(newMuted);

    // Guardar configuración automáticamente
    await saveSettings(effectsVolume, newMuted);
    console.log(`${logPrefix} Effects mute toggled to:`, newMuted);
  }, [isEffectsMuted, effectsVolume, saveSettings, logPrefix]);

  return {
    // Función genérica principal
    playSound,

    // Funciones específicas para compatibilidad
    playCardSound,
    playShuffleSound,
    playButtonSound,

    // Control de volumen y configuración
    effectsVolume,
    isEffectsMuted,
    changeEffectsVolume,
    toggleEffectsMute,
  };
}
