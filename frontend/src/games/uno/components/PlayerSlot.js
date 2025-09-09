import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SHOW_DEBUG } from "../../../core/config/debug";
import Opponent from "./Opponent";

export default function PlayerSlot({
  position,
  player,
  unoPlayers,
  shrink,
  responsiveStyles,
  responsiveSize,
  scores,
  eliminatedPlayers,
  getAvatarUrl,
  playersWithOneCard,
  onClaimUno,
  me,
  currentPlayer,
}) {
  if (player) {
    // Si hay un jugador asignado, mostrar el componente Opponent normal
    return (
      <Opponent
        player={player}
        unoPlayers={unoPlayers}
        shrink={shrink}
        responsiveStyles={responsiveStyles}
        responsiveSize={responsiveSize}
        scores={scores}
        eliminatedPlayers={eliminatedPlayers}
        getAvatarUrl={getAvatarUrl}
        playersWithOneCard={playersWithOneCard}
        onClaimUno={onClaimUno}
        me={me}
        currentPlayer={currentPlayer}
      />
    );
  }

  // Si no hay jugador, mostrar placeholder (visible solo si SHOW_DEBUG está habilitado)
  return (
    <View
      style={[
        responsiveStyles
          ? responsiveStyles.responsivePlayerSlot
          : styles.playerSlotPlaceholder,
        shrink && { transform: [{ scale: 0.8 }] },
        !SHOW_DEBUG && { opacity: 0 }, // Invisible pero mantiene el espacio
      ]}
    >
      <View
        style={
          responsiveStyles
            ? responsiveStyles.responsivePlaceholderCircle
            : styles.placeholderCircle
        }
      >
        <Text
          style={[
            styles.placeholderIcon,
            { fontSize: responsiveSize ? responsiveSize.fontSize.medium : 16 },
          ]}
        >
          👤
        </Text>
      </View>
      <Text
        style={[
          styles.placeholderText,
          { fontSize: responsiveSize ? responsiveSize.fontSize.small : 9 },
        ]}
      >
        {position}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  playerSlotPlaceholder: {
    alignItems: "center",
    width: 60, // Reducido de 80 a 60
    height: 60, // Reducido de 80 a 60
  },
  placeholderCircle: {
    width: 38, // Reducido de 50 a 38
    height: 38, // Reducido de 50 a 38
    borderRadius: 19, // Ajustado al nuevo tamaño
    backgroundColor: "#2c3e50",
    borderWidth: 2,
    borderColor: "#34495e",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 3, // Reducido de 4 a 3
  },
  placeholderIcon: {
    fontSize: 16, // Reducido de 20 a 16
    opacity: 0.6,
  },
  placeholderText: {
    color: "#7f8c8d",
    fontSize: 9, // Reducido de 10 a 9
    fontWeight: "600",
    textAlign: "center",
  },
});
