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
  volume,
  onToggleMusic,
  onVolumeChange,
  onClose,
}) => {
  const [isDragging, setIsDragging] = React.useState(false);
  const [tempVolume, setTempVolume] = React.useState(volume); // Volumen temporal durante arrastre
  const sliderWidth = 120; // Ancho del slider en píxeles
  const sliderRef = React.useRef(null); // Referencia para medir la posición del slider
  const startPositionRef = React.useRef({ x: 0, volume: 0 }); // Posición inicial del arrastre

  // Actualizar tempVolume cuando cambie el volumen externo (y no estemos arrastrando)
  React.useEffect(() => {
    if (!isDragging) {
      setTempVolume(volume);
    }
  }, [volume, isDragging]);

  // Crear el PanResponder para arrastrar en el slider
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,

    onPanResponderGrant: (evt) => {
      setIsDragging(true);

      // Guardar la posición inicial y el volumen inicial
      startPositionRef.current = {
        x: evt.nativeEvent.pageX,
        volume: tempVolume,
      };
    },

    onPanResponderMove: (evt) => {
      if (isDragging) {
        // Calcular el cambio basado en la diferencia desde el punto inicial
        const deltaX = evt.nativeEvent.pageX - startPositionRef.current.x;
        const deltaVolume = deltaX / sliderWidth; // Convertir pixels a porcentaje
        const newVolume = Math.max(
          0,
          Math.min(1, startPositionRef.current.volume + deltaVolume)
        );
        setTempVolume(newVolume);
      }
    },

    onPanResponderRelease: () => {
      setIsDragging(false);
      // AQUÍ es cuando aplicamos el cambio real
      onVolumeChange(tempVolume);
    },

    onPanResponderTerminate: () => {
      setIsDragging(false);
      // En caso de que se cancele el gesto, aplicar el cambio también
      onVolumeChange(tempVolume);
    },
  });

  // Usar tempVolume durante el arrastre, volume normal en otros casos
  const displayVolume = isDragging ? tempVolume : volume;

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

            {/* Control de play/pause */}
            <View style={styles.playControl}>
              <TouchableOpacity
                onPress={onToggleMusic}
                style={[
                  styles.playButton,
                  isPlaying && styles.playButtonActive,
                ]}
              >
                <Ionicons
                  name={isPlaying ? "pause" : "play"}
                  size={24}
                  color="#fff"
                />
              </TouchableOpacity>
              <Text style={styles.playText}>
                {isPlaying ? "Pausar música" : "Reproducir música"}
              </Text>
            </View>

            {/* Control de volumen */}
            <View style={styles.volumeControl}>
              <View style={styles.volumeHeader}>
                <Text style={styles.volumeText}>
                  Volumen: {Math.round(displayVolume * 100)}%
                </Text>
              </View>

              {/* Slider personalizado con arrastre */}
              <View style={styles.volumeSlider}>
                <View
                  ref={sliderRef}
                  style={styles.volumeBarContainer}
                  {...panResponder.panHandlers}
                >
                  <View style={[styles.volumeBar, { width: sliderWidth }]}>
                    <View
                      style={[
                        styles.volumeFill,
                        {
                          width: `${displayVolume * 100}%`,
                          backgroundColor: isDragging ? "#2980b9" : "#3498db",
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
                              displayVolume * sliderWidth - 6
                            )
                          ), // Limitar el thumb dentro del slider
                          backgroundColor: isDragging ? "#2980b9" : "#3498db",
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
    width: 200,
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
  playControl: {
    alignItems: "center",
    marginBottom: 16, // Reducido de 20 a 16
  },
  playButton: {
    backgroundColor: "#555",
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  playButtonActive: {
    backgroundColor: "#3498db",
  },
  playText: {
    color: "#fff",
    fontSize: 12,
    textAlign: "center",
  },
  volumeControl: {
    width: "100%",
  },
  volumeHeader: {
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6, // Reducido de 12 a 6
  },
  volumeText: {
    color: "#fff",
    fontSize: 12,
    textAlign: "center",
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
