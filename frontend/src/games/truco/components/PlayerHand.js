// ✋ COMPONENTE DE MANO DE CARTAS
// Muestra las cartas en la mano del jugador

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import TrucoCard from "./TrucoCard";

const PlayerHand = ({
  cards = [],
  onCardPress,
  selectedCard,
  playableCards = [],
  title = "Tu mano",
  style = {},
  cardSize = "normal",
}) => {
  const safeCards = Array.isArray(cards) ? cards : [];
  const safePlayable = Array.isArray(playableCards) ? playableCards : [];
  if (!safeCards.length) {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.emptyHand}>
          <Text style={styles.emptyText}>Sin cartas</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.cardsContainer}>
        {safeCards.map((card, index) => {
          const isSelected =
            selectedCard &&
            selectedCard.value === card.value &&
            selectedCard.suit === card.suit;

          const isPlayable =
            safePlayable.length === 0 ||
            safePlayable.some(
              (playableCard) =>
                playableCard.value === card.value &&
                playableCard.suit === card.suit
            );

          return (
            <TrucoCard
              key={`${card.value}-${card.suit}-${index}`}
              card={card}
              onPress={onCardPress}
              selected={isSelected}
              playable={isPlayable}
              size={cardSize}
              style={{ marginHorizontal: -5 }} // Overlap cards slightly
            />
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginVertical: 8,
  },

  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },

  cardsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  emptyHand: {
    padding: 20,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    borderStyle: "dashed",
  },

  emptyText: {
    color: "#999",
    fontSize: 14,
    textAlign: "center",
  },
});

export default PlayerHand;
