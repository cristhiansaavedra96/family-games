import React, { useState } from "react";
import { View, TouchableOpacity } from "react-native";
import Typography from "../../../shared/components/ui/Typography";
import { SHOW_DEBUG } from "../../../core/config/debug";

const DebugPanel = ({ players, roomId, socket, visible = true }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Solo mostrar si SHOW_DEBUG está habilitado
  if (!SHOW_DEBUG || !visible) {
    return null;
  }

  const handleWinPlayer = (playerId) => {
    console.log(`[DEBUG] Attempting to make player ${playerId} win`);
    console.log(`[DEBUG] Socket exists:`, !!socket);
    console.log(`[DEBUG] RoomId:`, roomId);
    console.log(`[DEBUG] Players:`, players);

    if (socket && roomId) {
      socket.emit("debugWinPlayer", { roomId, targetPlayerId: playerId });
      console.log(
        `[DEBUG] Emitted debugWinPlayer event for player ${playerId}`
      );
    } else {
      console.error("[DEBUG] Missing socket or roomId:", {
        socket: !!socket,
        roomId,
      });
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.toggleButton}
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <Typography style={styles.toggleText}>
          🐛 DEBUG {isExpanded ? "▼" : "▶"}
        </Typography>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.panel}>
          <Typography style={styles.title}>Hacer Ganar Jugador:</Typography>
          <Typography
            style={[styles.title, { fontSize: 10, color: "#ffaa00" }]}
          >
            RoomId: {roomId || "NO ROOM"} | Socket:{" "}
            {socket ? "OK" : "NO SOCKET"}
          </Typography>
          {players && players.length > 0 ? (
            players.map((player) => (
              <TouchableOpacity
                key={player.id}
                style={styles.playerButton}
                onPress={() => handleWinPlayer(player.id)}
              >
                <Typography style={styles.playerButtonText}>
                  🏆 {player.name || player.username} ({player.handCount}{" "}
                  cartas)
                </Typography>
              </TouchableOpacity>
            ))
          ) : (
            <Typography style={[styles.title, { color: "#ffaa00" }]}>
              No hay jugadores disponibles
            </Typography>
          )}
        </View>
      )}
    </View>
  );
};

const styles = {
  container: {
    position: "absolute",
    top: 80,
    right: 10,
    zIndex: 9999,
    backgroundColor: "rgba(255, 0, 0, 0.8)",
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#ff0000",
  },
  toggleButton: {
    padding: 8,
    minWidth: 100,
  },
  toggleText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 12,
  },
  panel: {
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    padding: 10,
    borderRadius: 6,
    borderTopWidth: 1,
    borderTopColor: "#ff0000",
  },
  title: {
    color: "#ff0000",
    fontWeight: "bold",
    marginBottom: 8,
    fontSize: 12,
  },
  playerButton: {
    backgroundColor: "#ff4444",
    padding: 8,
    marginVertical: 2,
    borderRadius: 4,
  },
  playerButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 11,
  },
};

export default DebugPanel;
