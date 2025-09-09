import React from "react";
import { View, TouchableOpacity, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

const ColorSelectorModal = ({
  visible = false,
  onClose,
  onColorSelect,
  backgroundColor = "rgba(0,0,0,0.8)",
}) => {
  // Si no es visible, no renderizar nada
  if (!visible) return null;

  const colors = [
    { key: "red", color: "#ec321dff", name: "Rojo" },
    { key: "yellow", color: "#f1c40f", name: "Amarillo" },
    { key: "green", color: "#289455ff", name: "Verde" },
    { key: "blue", color: "#2893dbff", name: "Azul" },
  ];

  const handleBackdropPress = () => {
    // Deshabilitado para evitar que la carta se pierda accidentalmente
    // Solo se puede cerrar con el botón X del centro
    // if (onClose) {
    //   onClose();
    // }
  };

  const handleColorPress = (colorKey) => {
    if (onColorSelect) {
      onColorSelect(colorKey);
    }
  };

  // Tamaño del modal circular
  const modalSize = 280;
  const colorButtonSize = 70;
  const radius = 85; // Radio para posicionar los colores

  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999999,
        backgroundColor,
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Backdrop TouchableOpacity que cubre toda la pantalla */}
      <TouchableOpacity
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
        activeOpacity={1}
        onPress={handleBackdropPress}
      />

      {/* Modal circular */}
      <View
        style={{
          width: modalSize,
          height: modalSize,
          borderRadius: modalSize / 2,
          backgroundColor: "rgba(30,30,30,0.95)",
          borderWidth: 3,
          borderColor: "#444",
          justifyContent: "center",
          alignItems: "center",
          position: "relative",
          shadowColor: "#000",
          shadowOpacity: 0.5,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
          elevation: 15,
        }}
        pointerEvents="auto"
      >
        {/* Botones de colores posicionados en círculo */}
        {colors.map((colorItem, index) => {
          // Calcular posición en círculo (0°, 90°, 180°, 270°)
          const angle = index * 90 * (Math.PI / 180) - Math.PI / 2; // Empezar desde arriba
          const x = radius * Math.cos(angle);
          const y = radius * Math.sin(angle);

          return (
            <TouchableOpacity
              key={colorItem.key}
              style={{
                position: "absolute",
                width: colorButtonSize,
                height: colorButtonSize,
                borderRadius: colorButtonSize / 2,
                backgroundColor: colorItem.color,
                left: modalSize / 2 + x - colorButtonSize / 2,
                top: modalSize / 2 + y - colorButtonSize / 2,
                borderWidth: 4,
                borderColor: "#fff",
                shadowColor: "#000",
                shadowOpacity: 0.3,
                shadowRadius: 5,
                shadowOffset: { width: 0, height: 2 },
                elevation: 8,
              }}
              onPress={() => handleColorPress(colorItem.key)}
              activeOpacity={0.8}
            />
          );
        })}

        {/* Botón de cerrar en el centro - CRUZ */}
        <TouchableOpacity
          style={{
            width: 50,
            height: 50,
            borderRadius: 25,
            backgroundColor: "rgba(200,50,50,0.9)",
            borderWidth: 3,
            borderColor: "#fff",
            justifyContent: "center",
            alignItems: "center",
            shadowColor: "#000",
            shadowOpacity: 0.4,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 2 },
            elevation: 10,
          }}
          onPress={onClose}
          activeOpacity={0.8}
        >
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ColorSelectorModal;
