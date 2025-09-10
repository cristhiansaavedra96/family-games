import React from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  PanResponder,
  Animated,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const AudioControlPanel = ({
  visible,
  isPlaying,
  musicVolume,
  effectsVolume,
  isMusicMuted,
  isEffectsMuted,
  onMusicVolumeChange,
  onEffectsVolumeChange,
  onToggleMusicMute,
  onToggleEffectsMute,
  onClose,
}) => {
  const [isDraggingMusic, setIsDraggingMusic] = React.useState(false);
  const [isDraggingEffects, setIsDraggingEffects] = React.useState(false);
  const [tempMusicVolume, setTempMusicVolume] = React.useState(musicVolume);
  const [tempEffectsVolume, setTempEffectsVolume] =
    React.useState(effectsVolume);
  const sliderWidth = 100; // Ancho del slider en píxeles (reducido para dos sliders)
  const musicSliderRef = React.useRef(null);
  const effectsSliderRef = React.useRef(null);
  const musicStartRef = React.useRef({ x: 0, volume: 0 });
  const effectsStartRef = React.useRef({ x: 0, volume: 0 });

  // Actualizar tempVolumes cuando cambien los volúmenes externos
  React.useEffect(() => {
    if (!isDraggingMusic) {
      setTempMusicVolume(musicVolume);
    }
  }, [musicVolume, isDraggingMusic]);

  React.useEffect(() => {
    if (!isDraggingEffects) {
      setTempEffectsVolume(effectsVolume);
    }
  }, [effectsVolume, isDraggingEffects]);

  // PanResponder para el slider de música
  const musicPanResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,

    onPanResponderGrant: (evt) => {
      setIsDraggingMusic(true);
      musicStartRef.current = {
        x: evt.nativeEvent.pageX,
        volume: tempMusicVolume,
      };
    },

    onPanResponderMove: (evt) => {
      if (isDraggingMusic) {
        const deltaX = evt.nativeEvent.pageX - musicStartRef.current.x;
        const deltaVolume = deltaX / sliderWidth;
        const newVolume = Math.max(
          0,
          Math.min(1, musicStartRef.current.volume + deltaVolume)
        );
        setTempMusicVolume(newVolume);
      }
    },

    onPanResponderRelease: () => {
      setIsDraggingMusic(false);
      onMusicVolumeChange(tempMusicVolume);
    },

    onPanResponderTerminate: () => {
      setIsDraggingMusic(false);
      onMusicVolumeChange(tempMusicVolume);
    },
  });

  // PanResponder para el slider de efectos
  const effectsPanResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,

    onPanResponderGrant: (evt) => {
      setIsDraggingEffects(true);
      effectsStartRef.current = {
        x: evt.nativeEvent.pageX,
        volume: tempEffectsVolume,
      };
    },

    onPanResponderMove: (evt) => {
      if (isDraggingEffects) {
        const deltaX = evt.nativeEvent.pageX - effectsStartRef.current.x;
        const deltaVolume = deltaX / sliderWidth;
        const newVolume = Math.max(
          0,
          Math.min(1, effectsStartRef.current.volume + deltaVolume)
        );
        setTempEffectsVolume(newVolume);
      }
    },

    onPanResponderRelease: () => {
      setIsDraggingEffects(false);
      onEffectsVolumeChange(tempEffectsVolume);
    },

    onPanResponderTerminate: () => {
      setIsDraggingEffects(false);
      onEffectsVolumeChange(tempEffectsVolume);
    },
  });

  // Usar volúmenes temporales durante el arrastre
  const displayMusicVolume = isDraggingMusic ? tempMusicVolume : musicVolume;
  const displayEffectsVolume = isDraggingEffects
    ? tempEffectsVolume
    : effectsVolume;

  if (!visible) return null;

  return (
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={styles.container}>
        <TouchableWithoutFeedback onPress={() => {}}>
          <View style={styles.panel}>
            {/* Header con título y botón cerrar */}
            <View style={styles.header}>
              <Text style={styles.title}>Audio</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Control de volumen de música */}
            <View style={styles.volumeControl}>
              <View style={styles.volumeHeader}>
                <TouchableOpacity
                  onPress={onToggleMusicMute}
                  style={styles.muteButton}
                >
                  <Ionicons
                    name={isMusicMuted ? "volume-mute" : "musical-notes"}
                    size={16}
                    color={isMusicMuted ? "#e74c3c" : "#fff"}
                  />
                </TouchableOpacity>
                <Text style={styles.volumeText}>
                  Música: {Math.round(displayMusicVolume * 100)}%
                </Text>
              </View>

              <View style={styles.volumeSlider}>
                <View
                  ref={musicSliderRef}
                  style={styles.volumeBarContainer}
                  {...musicPanResponder.panHandlers}
                >
                  <View style={[styles.volumeBar, { width: sliderWidth }]}>
                    <View
                      style={[
                        styles.volumeFill,
                        {
                          width: `${displayMusicVolume * 100}%`,
                          backgroundColor: isDraggingMusic
                            ? "#2980b9"
                            : "#3498db",
                          opacity: isMusicMuted ? 0.3 : 1,
                        },
                      ]}
                    />
                    <View
                      style={[
                        styles.volumeThumb,
                        {
                          left: Math.max(
                            0,
                            Math.min(
                              sliderWidth - 12,
                              displayMusicVolume * sliderWidth - 6
                            )
                          ),
                          backgroundColor: isDraggingMusic
                            ? "#2980b9"
                            : "#3498db",
                          opacity: isMusicMuted ? 0.3 : 1,
                        },
                      ]}
                    />
                  </View>
                </View>
              </View>
            </View>

            {/* Control de volumen de efectos */}
            <View style={styles.volumeControl}>
              <View style={styles.volumeHeader}>
                <TouchableOpacity
                  onPress={onToggleEffectsMute}
                  style={styles.muteButton}
                >
                  <Ionicons
                    name={isEffectsMuted ? "volume-mute" : "flash"}
                    size={16}
                    color={isEffectsMuted ? "#e74c3c" : "#fff"}
                  />
                </TouchableOpacity>
                <Text style={styles.volumeText}>
                  Efectos: {Math.round(displayEffectsVolume * 100)}%
                </Text>
              </View>

              <View style={styles.volumeSlider}>
                <View
                  ref={effectsSliderRef}
                  style={styles.volumeBarContainer}
                  {...effectsPanResponder.panHandlers}
                >
                  <View style={[styles.volumeBar, { width: sliderWidth }]}>
                    <View
                      style={[
                        styles.volumeFill,
                        {
                          width: `${displayEffectsVolume * 100}%`,
                          backgroundColor: isDraggingEffects
                            ? "#27ae60"
                            : "#2ecc71",
                          opacity: isEffectsMuted ? 0.3 : 1,
                        },
                      ]}
                    />
                    <View
                      style={[
                        styles.volumeThumb,
                        {
                          left: Math.max(
                            0,
                            Math.min(
                              sliderWidth - 12,
                              displayEffectsVolume * sliderWidth - 6
                            )
                          ),
                          backgroundColor: isDraggingEffects
                            ? "#27ae60"
                            : "#2ecc71",
                          opacity: isEffectsMuted ? 0.3 : 1,
                        },
                      ]}
                    />
                  </View>
                </View>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingTop: 60,
    paddingRight: 12,
  },
  panel: {
    backgroundColor: "rgba(30, 30, 30, 0.95)",
    borderRadius: 12,
    padding: 16,
    width: 220, // Aumentado para acomodar dos sliders
    borderWidth: 1,
    borderColor: "#444",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  closeButton: {
    padding: 4,
  },
  volumeControl: {
    width: "100%",
  },
  volumeHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6, // Reducido de 12 a 6
    justifyContent: "space-between",
  },
  muteButton: {
    padding: 4,
    marginRight: 8,
  },
  volumeText: {
    color: "#fff",
    fontSize: 11,
    flex: 1,
  },
  volumeControl: {
    width: "100%",
    marginBottom: 12, // Espacio entre controles
  },
  volumeControl: {
    width: "100%",
    marginBottom: 12, // Espacio entre controles
  },
  volumeSlider: {
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4, // Reducido de 8 a 4
  },
  volumeBarContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12, // Reducido de 15 a 12
    width: "100%",
  },
  volumeBar: {
    height: 6,
    backgroundColor: "#333",
    borderRadius: 3,
    overflow: "visible", // Permitir que el thumb sobresalga
    position: "relative",
  },
  volumeFill: {
    height: "100%",
    borderRadius: 3,
    position: "absolute",
    left: 0,
    top: 0,
  },
  volumeThumb: {
    position: "absolute",
    top: -3, // Centrar verticalmente respecto a la barra
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#3498db",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
});

export default AudioControlPanel;
