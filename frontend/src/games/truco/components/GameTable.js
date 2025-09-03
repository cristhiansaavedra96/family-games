// 🎯 MESA DE JUEGO DEL TRUCO
// Muestra las cartas jugadas en la mesa y la carta de muestra

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import TrucoCard from "./TrucoCard";

const GameTable = ({
  playedCards = [],
  muestra,
  players = [],
  currentRound = 1,
  style = {},
  banners = [], // [{ id, playerId, message, type }]
}) => {
  // Organizar las cartas jugadas por posición del jugador
  const getCardPosition = (playerIndex) => {
    // Posiciones en la mesa para hasta 4 jugadores
    const positions = {
      0: styles.bottomPosition,
      1: styles.rightPosition,
      2: styles.topPosition,
      3: styles.leftPosition,
    };
    return positions[playerIndex] || styles.bottomPosition;
  };

  return (
    <View style={[styles.container, style]}>
      {/* Carta de muestra */}
      {muestra && (
        <View style={styles.muestraContainer}>
          <Text style={styles.muestraLabel}>Muestra</Text>
          <TrucoCard card={muestra} size="small" playable={false} />
        </View>
      )}

      {/* Mesa central donde se juegan las cartas */}
      <View style={styles.table}>
        <Text style={styles.roundLabel}>Ronda {currentRound}</Text>

        <View style={styles.playArea}>
          {playedCards.map((playedCard, index) => {
            const player = players.find((p) => p.id === playedCard.playerId);
            const playerName = player
              ? player.name
              : `Jugador ${playedCard.playerId + 1}`;

            return (
              <View
                key={`played-${playedCard.playerId}-${index}`}
                style={[
                  styles.playedCardContainer,
                  getCardPosition(playedCard.playerId),
                ]}
              >
                <Text style={styles.playerLabel}>{playerName}</Text>
                <TrucoCard
                  card={playedCard.card}
                  size="normal"
                  playable={false}
                />
              </View>
            );
          })}

          {/* Mensaje cuando no hay cartas en la mesa */}
          {playedCards.length === 0 && (
            <View style={styles.emptyTable}>
              <Text style={styles.emptyTableText}>Esperando cartas...</Text>
            </View>
          )}

          {/* Burbujas de canto */}
          {Array.isArray(banners) &&
            banners.map((b) => (
              <View
                key={b.id}
                style={[
                  styles.bannerBubble,
                  getCardPosition(b.playerId),
                  styles.bannerOffset,
                  b.type === "warning" && { backgroundColor: "#e67e22" },
                ]}
              >
                <Text style={styles.bannerText}>{b.message}</Text>
              </View>
            ))}
        </View>
      </View>

      {/* Información adicional */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          Cartas jugadas: {playedCards.length}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },

  muestraContainer: {
    position: "absolute",
    top: 16,
    right: 16,
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#dee2e6",
  },

  muestraLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#6c757d",
    marginBottom: 4,
  },

  table: {
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "#2d5a27",
    borderWidth: 3,
    borderColor: "#8b4513",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },

  roundLabel: {
    position: "absolute",
    top: 20,
    fontSize: 16,
    fontWeight: "bold",
    color: "#ffffff",
  },

  playArea: {
    width: 250,
    height: 250,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },

  bannerBubble: {
    position: "absolute",
    backgroundColor: "#2c3e50",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ecf0f1",
  },

  bannerOffset: {
    transform: [{ translateY: -30 }],
  },

  bannerText: {
    color: "#ecf0f1",
    fontSize: 11,
    fontWeight: "bold",
  },

  playedCardContainer: {
    position: "absolute",
    alignItems: "center",
  },

  // Posiciones de las cartas jugadas
  bottomPosition: {
    bottom: 10,
  },

  topPosition: {
    top: 10,
  },

  leftPosition: {
    left: 10,
    top: "50%",
    transform: [{ translateY: -50 }],
  },

  rightPosition: {
    right: 10,
    top: "50%",
    transform: [{ translateY: -50 }],
  },

  playerLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 4,
    textAlign: "center",
  },

  emptyTable: {
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  emptyTableText: {
    color: "#ffffff",
    fontSize: 14,
    opacity: 0.7,
    textAlign: "center",
  },

  infoContainer: {
    position: "absolute",
    bottom: 16,
    left: 16,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    padding: 8,
    borderRadius: 8,
  },

  infoText: {
    color: "#ffffff",
    fontSize: 12,
  },
});

export default GameTable;
