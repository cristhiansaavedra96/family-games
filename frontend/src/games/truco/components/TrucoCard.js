// 🃏 COMPONENTE DE CARTA DEL TRUCO
// Renderiza una carta individual del Truco Uruguayo

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import {
  getCardSuitSymbol,
  getCardColor,
  formatCardName,
} from "../utils/cardHelpers";

const TrucoCard = ({
  card,
  onPress,
  selected = false,
  playable = true,
  size = "normal", // normal, small, large
  style = {},
  showBack = false, // Mostrar dorso de la carta
}) => {
  if (!card) return null;

  const cardSizes = {
    small: { width: 50, height: 75 },
    normal: { width: 70, height: 105 },
    large: { width: 90, height: 135 },
  };

  const currentSize = cardSizes[size] || cardSizes.normal;
  const suitSymbol = getCardSuitSymbol(card.suit);
  const suitColor = getCardColor(card.suit);

  // Nombres especiales para cartas
  const getCardDisplayValue = (value) => {
    const specialNames = {
      1: "A",
      11: "J",
      12: "Q",
    };
    return specialNames[value] || value.toString();
  };

  const displayValue = getCardDisplayValue(card.value);

  const cardStyle = [
    styles.card,
    {
      width: currentSize.width,
      height: currentSize.height,
      backgroundColor: showBack ? "#2c5aa0" : "#ffffff",
      borderColor: selected ? "#4a90e2" : "#d0d0d0",
      borderWidth: selected ? 3 : 1,
      opacity: playable ? 1 : 0.6,
    },
    style,
  ];

  const handlePress = () => {
    if (playable && onPress) {
      onPress(card);
    }
  };

  // Cargar imagen estática de carta según valor-palo
  const getCardImageSource = () => {
    // Mapear nombres de palo de la app a archivos: basto, copa, espada, oro
    const suitMap = {
      basto: "basto",
      copa: "copa",
      espada: "espada",
      oro: "oro",
      // fallback posibles
      bastos: "basto",
      copas: "copa",
      espadas: "espada",
      oros: "oro",
    };
    const suit = suitMap[card.suit] || card.suit;
    const value = card.value;
    const name = `${value}-${suit}`;
    try {
      // require estático para bundler de React Native (Metro) - enumerar posibles casos
      // Usamos un switch doble para mantener referencias estáticas que Metro pueda resolver
      // Nota: valores válidos 1..12 (sin 8 ni 9 en algunos mazos; aquí existen en carpeta)
      const base = require("../../../images/naipes_spanish/empty.png");
      const map = {
        "1-basto": require("../../../images/naipes_spanish/1-basto.png"),
        "1-copa": require("../../../images/naipes_spanish/1-copa.png"),
        "1-espada": require("../../../images/naipes_spanish/1-espada.png"),
        "1-oro": require("../../../images/naipes_spanish/1-oro.png"),
        "2-basto": require("../../../images/naipes_spanish/2-basto.png"),
        "2-copa": require("../../../images/naipes_spanish/2-copa.png"),
        "2-espada": require("../../../images/naipes_spanish/2-espada.png"),
        "2-oro": require("../../../images/naipes_spanish/2-oro.png"),
        "3-basto": require("../../../images/naipes_spanish/3-basto.png"),
        "3-copa": require("../../../images/naipes_spanish/3-copa.png"),
        "3-espada": require("../../../images/naipes_spanish/3-espada.png"),
        "3-oro": require("../../../images/naipes_spanish/3-oro.png"),
        "4-basto": require("../../../images/naipes_spanish/4-basto.png"),
        "4-copa": require("../../../images/naipes_spanish/4-copa.png"),
        "4-espada": require("../../../images/naipes_spanish/4-espada.png"),
        "4-oro": require("../../../images/naipes_spanish/4-oro.png"),
        "5-basto": require("../../../images/naipes_spanish/5-basto.png"),
        "5-copa": require("../../../images/naipes_spanish/5-copa.png"),
        "5-espada": require("../../../images/naipes_spanish/5-espada.png"),
        "5-oro": require("../../../images/naipes_spanish/5-oro.png"),
        "6-basto": require("../../../images/naipes_spanish/6-basto.png"),
        "6-copa": require("../../../images/naipes_spanish/6-copa.png"),
        "6-espada": require("../../../images/naipes_spanish/6-espada.png"),
        "6-oro": require("../../../images/naipes_spanish/6-oro.png"),
        "7-basto": require("../../../images/naipes_spanish/7-basto.png"),
        "7-copa": require("../../../images/naipes_spanish/7-copa.png"),
        "7-espada": require("../../../images/naipes_spanish/7-espada.png"),
        "7-oro": require("../../../images/naipes_spanish/7-oro.png"),
        "8-basto": require("../../../images/naipes_spanish/8-basto.png"),
        "8-copa": require("../../../images/naipes_spanish/8-copa.png"),
        "8-espada": require("../../../images/naipes_spanish/8-espada.png"),
        "8-oro": require("../../../images/naipes_spanish/8-oro.png"),
        "9-basto": require("../../../images/naipes_spanish/9-basto.png"),
        "9-copa": require("../../../images/naipes_spanish/9-copa.png"),
        "9-espada": require("../../../images/naipes_spanish/9-espada.png"),
        "9-oro": require("../../../images/naipes_spanish/9-oro.png"),
        "10-basto": require("../../../images/naipes_spanish/10-basto.png"),
        "10-copa": require("../../../images/naipes_spanish/10-copa.png"),
        "10-espada": require("../../../images/naipes_spanish/10-espada.png"),
        "10-oro": require("../../../images/naipes_spanish/10-oro.png"),
        "11-basto": require("../../../images/naipes_spanish/11-basto.png"),
        "11-copa": require("../../../images/naipes_spanish/11-copa.png"),
        "11-espada": require("../../../images/naipes_spanish/11-espada.png"),
        "11-oro": require("../../../images/naipes_spanish/11-oro.png"),
        "12-basto": require("../../../images/naipes_spanish/12-basto.png"),
        "12-copa": require("../../../images/naipes_spanish/12-copa.png"),
        "12-espada": require("../../../images/naipes_spanish/12-espada.png"),
        "12-oro": require("../../../images/naipes_spanish/12-oro.png"),
        back: require("../../../images/naipes_spanish/back.png"),
      };
      return map[name] || base;
    } catch (e) {
      return require("../../../images/naipes_spanish/empty.png");
    }
  };

  if (showBack) {
    return (
      <TouchableOpacity
        style={cardStyle}
        onPress={handlePress}
        activeOpacity={0.8}
        disabled={!playable}
      >
        <Image
          source={require("../../../images/naipes_spanish/back.png")}
          style={[
            styles.image,
            { width: currentSize.width, height: currentSize.height },
          ]}
          resizeMode="contain"
        />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={cardStyle}
      onPress={handlePress}
      activeOpacity={0.8}
      disabled={!playable}
    >
      <Image
        source={getCardImageSource()}
        style={[
          styles.image,
          { width: currentSize.width, height: currentSize.height },
        ]}
        resizeMode="contain"
      />
      {selected && (
        <View style={styles.selectedIndicator}>
          <Text style={styles.selectedText}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    margin: 4,
    position: "relative",
  },

  cardBack: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#2c5aa0",
    borderRadius: 8,
  },

  cardBackText: {
    fontSize: 30,
    color: "#ffffff",
  },

  cornerTop: {
    position: "absolute",
    top: 4,
    left: 4,
    alignItems: "center",
  },

  cornerBottom: {
    position: "absolute",
    bottom: 4,
    right: 4,
    alignItems: "center",
  },

  cornerValue: {
    fontSize: 12,
    fontWeight: "bold",
  },

  cornerSuit: {
    fontSize: 10,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  centerSuit: {
    fontWeight: "bold",
  },

  centerValue: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 4,
  },

  rotated: {
    transform: [{ rotate: "180deg" }],
  },

  selectedIndicator: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#4a90e2",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },

  selectedText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
});

export default TrucoCard;
