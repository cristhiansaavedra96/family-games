import React from "react";
import { View, TouchableOpacity, ScrollView, Dimensions } from "react-native";
import Modal from "../../../shared/components/ui/Modal";
import Typography from "../../../shared/components/ui/Typography";
import { getBingoColorByIndexOrNumber } from "./BingoCard";

const { width: screenWidth } = Dimensions.get("window");

const NumbersModal = ({
  visible,
  onClose,
  title = "Números cantados",
  drawnNumbers = [], // Array de números que han sido cantados
}) => {
  // Generar números del 1 al 75
  const numbers = Array.from({ length: 75 }, (_, i) => i + 1);

  // Organizar números en filas de 10 para mejor visualización (más bolas por fila)
  const rows = [];
  for (let i = 0; i < numbers.length; i += 10) {
    rows.push(numbers.slice(i, i + 10));
  }

  // Calcular tamaños dinámicos basados en el ancho de pantalla
  const modalWidth = screenWidth * 0.95; // 95% del ancho de pantalla
  const contentPadding = 50; // padding total del contenido del modal (aumentado para gap menor)
  const gapBetweenBalls = 3; // gap entre bolitas
  const totalGaps = 9 * gapBetweenBalls; // 9 gaps para 10 bolitas
  const availableWidth = modalWidth - contentPadding - totalGaps;
  const ballSize = Math.floor(availableWidth / 10); // Tamaño dinámico de bolitas
  const fontSize = Math.max(12, Math.floor(ballSize * 0.6)); // Fuente proporcional más grande

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      variant="centered"
      title={title}
      showCloseButton={true}
      closeOnBackdropPress={true}
      backgroundColor="rgba(0,0,0,0.4)"
      contentStyle={{
        width: modalWidth,
      }}
    >
      <ScrollView
        style={{ width: "100%" }}
        contentContainerStyle={{
          paddingBottom: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Grid de números */}
        <View style={{ gap: 6 }}>
          {rows.map((row, rowIndex) => (
            <View
              key={rowIndex}
              style={{
                flexDirection: "row",
                justifyContent: "center",
                gap: 4,
                flexWrap: "wrap",
              }}
            >
              {row.map((number) => {
                const isCalled = drawnNumbers.includes(number);
                return (
                  <TouchableOpacity
                    key={number}
                    activeOpacity={0.7}
                    style={{
                      width: ballSize,
                      height: ballSize,
                      borderRadius: ballSize / 2,
                      backgroundColor: isCalled
                        ? getBingoColorByIndexOrNumber(number)
                        : "#f8f9fa",
                      borderWidth: 1.5,
                      borderColor: isCalled ? "#ffffff" : "#95a5a6",
                      alignItems: "center",
                      justifyContent: "center",
                      shadowColor: "#000",
                      shadowOpacity: 0.2,
                      shadowRadius: 3,
                      shadowOffset: { width: 0, height: 2 },
                      elevation: 4,
                    }}
                  >
                    <Typography
                      variant="body"
                      style={{
                        color: isCalled ? "#fff" : "#6c757d",
                        fontWeight: "700",
                        fontSize: fontSize,
                        textAlign: "center",
                        textAlignVertical: "center",
                        includeFontPadding: false,
                        lineHeight: fontSize,
                      }}
                    >
                      {number}
                    </Typography>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Divider */}
      <View
        style={{
          height: 1,
          backgroundColor: "#e9ecef",
          marginVertical: 16,
          marginHorizontal: -20, // Para que llegue hasta los bordes del modal
        }}
      />

      {/* Contador de números cantados */}
      <View style={{ alignItems: "center" }}>
        <Typography
          variant="body"
          style={{
            color: "#6c757d",
            fontSize: 14,
            fontWeight: "600",
          }}
        >
          {drawnNumbers.length} de 75 números cantados
        </Typography>
      </View>
    </Modal>
  );
};

export default NumbersModal;
