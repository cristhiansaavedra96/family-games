import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getBingoColorByIndexOrNumber } from "./BingoCard";

const NumbersModal = ({ visible, drawnNumbers = [], onClose }) => {
  if (!visible) {
    return null;
  }

  // Usar View absoluto en lugar de Modal (igual que ExitModal)
  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
        padding: 16,
        zIndex: 999999,
      }}
    >
      <View
        style={{
          width: "96%",
          maxWidth: 420,
          maxHeight: "88%",
          backgroundColor: "#fff",
          borderRadius: 20,
          padding: 20,
          shadowColor: "#000",
          shadowOpacity: 0.25,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 6 },
          elevation: 15,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
          }}
        >
          <Text
            style={{
              fontWeight: "800",
              fontSize: 24,
              color: "#2c3e50",
              fontFamily: "Montserrat_700Bold",
              marginBottom: 8,
            }}
          >
            Números Cantados
          </Text>

          <TouchableOpacity
            onPress={() => {
              onClose && onClose();
            }}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: "#ecf0f1",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="close" size={20} color="#2c3e50" />
          </TouchableOpacity>
        </View>

        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "flex-start",
            paddingHorizontal: 2,
            marginBottom: 20,
          }}
        >
          {Array.from({ length: 75 }, (_, i) => i + 1).map((n) => {
            const isDrawn = drawnNumbers.includes(n);
            // Calcular ancho dinámico para que entren ~8-9 por fila
            const itemWidth = "11%";

            // Para centrar la última fila si no está completa
            const isLastRow = n > 72; // números 73, 74, 75
            const lastRowStyle = isLastRow ? { alignSelf: "center" } : {};

            return (
              <View
                key={n}
                style={[
                  {
                    width: itemWidth,
                    aspectRatio: 1, // Volver a aspectRatio para mantener círculos perfectos
                    borderRadius: 16,
                    backgroundColor: isDrawn
                      ? getBingoColorByIndexOrNumber(n)
                      : "#f8f9fa",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0.5%",
                    marginVertical: 4, // Margen vertical fijo pequeño
                    borderWidth: 1.5,
                    borderColor: isDrawn ? "#fff" : "#dee2e6",
                    shadowColor: isDrawn ? "#000" : "transparent",
                    shadowOpacity: isDrawn ? 0.25 : 0,
                    shadowRadius: 3,
                    shadowOffset: { width: 0, height: 2 },
                    elevation: isDrawn ? 4 : 0,
                  },
                  lastRowStyle,
                ]}
              >
                <Text
                  style={{
                    color: isDrawn ? "#fff" : "#6c757d",
                    fontSize: 17,
                    fontFamily: "Montserrat_700Bold",
                    fontWeight: "700",
                    textAlign: "center",
                  }}
                >
                  {n}
                </Text>
              </View>
            );
          })}
        </View>

        <View
          style={{
            paddingTop: 20,
            borderTopWidth: 1,
            borderTopColor: "#dee2e6",
          }}
        >
          <Text
            style={{
              textAlign: "center",
              color: "#6c757d",
              fontSize: 14,
              fontFamily: "Montserrat_400Regular",
            }}
          >
            {drawnNumbers.length} de 75 números cantados
          </Text>
        </View>
      </View>
    </View>
  );
};

export default NumbersModal;
