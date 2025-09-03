// 🏆 MARCADOR DEL TRUCO
// Muestra los puntajes de los equipos y la información del partido

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

const ScoreBoard = ({
  scores = [0, 0],
  teams = [],
  players = [],
  myPlayerId = null,
  currentPlayer = 0,
  hand = 1,
  round = 1,
  targetScore = 30,
  onShowDetails,
  style = {},
}) => {
  const getTeamPlayers = (teamIndex) => {
    const team = teams[teamIndex];
    if (!team) return [];

    return team.players.map((playerId) => {
      const player = players.find((p) => p.id === playerId);
      return player
        ? player.name || `Jugador ${playerId + 1}`
        : `Jugador ${playerId + 1}`;
    });
  };

  const getMyTeamIndex = () => {
    if (!myPlayerId || !teams.length) return -1;

    return teams.findIndex((team) => team.players.includes(myPlayerId));
  };

  const getCurrentPlayerName = () => {
    const player = players.find((p) => p.id === currentPlayer);
    return player
      ? player.name || `Jugador ${currentPlayer + 1}`
      : `Jugador ${currentPlayer + 1}`;
  };

  const isCurrentPlayerInMyTeam = () => {
    const myTeamIndex = getMyTeamIndex();
    if (myTeamIndex === -1) return false;

    return teams[myTeamIndex].players.includes(currentPlayer);
  };

  const myTeamIndex = getMyTeamIndex();

  return (
    <View style={[styles.container, style]}>
      {/* Encabezado con información del juego */}
      <View style={styles.header}>
        <Text style={styles.gameInfo}>
          Mano {hand} - Ronda {round}
        </Text>
        <TouchableOpacity onPress={onShowDetails} style={styles.detailsButton}>
          <MaterialIcons name="info" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Marcador principal */}
      <View style={styles.scoreContainer}>
        {teams.map((team, index) => {
          const isMyTeam = index === myTeamIndex;
          const teamPlayers = getTeamPlayers(index);
          const score = scores[index] || 0;
          const isWinning = score > (scores[1 - index] || 0);

          return (
            <View
              key={team.id || index}
              style={[
                styles.teamScore,
                isMyTeam && styles.myTeamScore,
                isWinning && styles.winningTeam,
              ]}
            >
              {/* Nombre del equipo */}
              <Text style={[styles.teamName, isMyTeam && styles.myTeamName]}>
                {isMyTeam ? "👤 Tu Equipo" : "🎯 Oponente"}
              </Text>

              {/* Jugadores del equipo */}
              <View style={styles.playersContainer}>
                {teamPlayers.map((playerName, playerIndex) => (
                  <Text
                    key={`${team.id}-player-${playerIndex}`}
                    style={[styles.playerName, isMyTeam && styles.myTeamPlayer]}
                  >
                    {playerName}
                  </Text>
                ))}
              </View>

              {/* Puntuación */}
              <View style={styles.scoreWrapper}>
                <Text
                  style={[
                    styles.score,
                    isMyTeam && styles.myTeamScore,
                    isWinning && styles.winningScore,
                  ]}
                >
                  {score}
                </Text>
                <Text style={styles.scoreTarget}>/ {targetScore}</Text>
              </View>

              {/* Indicador de equipo ganador */}
              {isWinning && score > 0 && (
                <MaterialIcons
                  name="trending-up"
                  size={16}
                  color="#27ae60"
                  style={styles.winningIcon}
                />
              )}
            </View>
          );
        })}
      </View>

      {/* Información del turno actual */}
      <View style={styles.turnInfo}>
        <Text style={styles.turnLabel}>Turno:</Text>
        <Text
          style={[
            styles.currentPlayerName,
            isCurrentPlayerInMyTeam() && styles.myTurn,
          ]}
        >
          {getCurrentPlayerName()}
          {currentPlayer === myPlayerId && " (tú)"}
        </Text>

        {isCurrentPlayerInMyTeam() && (
          <MaterialIcons
            name="my-location"
            size={16}
            color="#4a90e2"
            style={styles.turnIcon}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ffffff",
    padding: 8,
    borderRadius: 8,
    marginVertical: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },

  gameInfo: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#333",
  },

  detailsButton: {
    padding: 4,
  },

  scoreContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  teamScore: {
    flex: 1,
    alignItems: "center",
    padding: 8,
    backgroundColor: "#f8f9fa",
    borderRadius: 6,
    marginHorizontal: 2,
    borderWidth: 1,
    borderColor: "#dee2e6",
  },

  myTeamScore: {
    backgroundColor: "#e3f2fd",
    borderColor: "#4a90e2",
  },

  winningTeam: {
    borderColor: "#27ae60",
    borderWidth: 2,
  },

  teamName: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#495057",
    marginBottom: 2,
  },

  myTeamName: {
    color: "#4a90e2",
  },

  playersContainer: {
    alignItems: "center",
    marginBottom: 4,
  },

  playerName: {
    fontSize: 10,
    color: "#6c757d",
    textAlign: "center",
  },

  myTeamPlayer: {
    color: "#4a90e2",
    fontWeight: "500",
  },

  scoreWrapper: {
    flexDirection: "row",
    alignItems: "baseline",
  },

  score: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },

  winningScore: {
    color: "#27ae60",
  },

  scoreTarget: {
    fontSize: 10,
    color: "#6c757d",
    marginLeft: 2,
  },

  winningIcon: {
    position: "absolute",
    top: 8,
    right: 8,
  },

  turnInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
  },

  turnLabel: {
    fontSize: 12,
    color: "#6c757d",
    marginRight: 8,
  },

  currentPlayerName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },

  myTurn: {
    color: "#4a90e2",
  },

  turnIcon: {
    marginLeft: 8,
  },
});

export default ScoreBoard;
