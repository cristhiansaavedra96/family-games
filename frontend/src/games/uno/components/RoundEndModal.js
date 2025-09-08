import React, { useState, useEffect } from "react";
import { View, Text, Image, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Modal from "../../../shared/components/ui/Modal";
import Typography from "../../../shared/components/ui/Typography";
import Button from "../../../shared/components/ui/Button";

const RoundEndModal = ({ visible, roundData, getAvatarUrl, onClose }) => {
  const [countdown, setCountdown] = useState(10);
  const insets = useSafeAreaInsets();

  console.log("[RoundEndModal] Rendered with:", { visible, roundData });

  useEffect(() => {
    if (!visible) {
      setCountdown(10);
      return;
    }

    console.log("[RoundEndModal] Starting countdown from 10");
    const timer = setInterval(() => {
      setCountdown((prev) => {
        console.log(`[RoundEndModal] Countdown: ${prev}`);
        if (prev <= 1) {
          clearInterval(timer);
          console.log("[RoundEndModal] Countdown finished, closing modal");
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      console.log("[RoundEndModal] Cleanup timer");
      clearInterval(timer);
    };
  }, [visible, onClose]);

  if (!roundData) {
    console.log("[RoundEndModal] No roundData, returning null");
    return null;
  }

  const {
    roundWinner,
    playersWithScores,
    eliminations = [],
    newlyEliminated = [],
  } = roundData;

  // Validar que playersWithScores existe y es un array
  if (!playersWithScores || !Array.isArray(playersWithScores)) {
    console.warn(
      "RoundEndModal: playersWithScores is not valid:",
      playersWithScores
    );
    console.log("RoundEndModal: Full roundData:", roundData);
    return null;
  }

  console.log("[RoundEndModal] playersWithScores is valid, rendering modal");
  console.log(
    "[RoundEndModal] Players data:",
    JSON.stringify(playersWithScores, null, 2)
  );

  // Los jugadores ya vienen ordenados por puntos totales (menor a mayor) desde el backend
  const sortedPlayers = playersWithScores;
  const winner = sortedPlayers.find((p) => p.isWinner);

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      variant="fullscreen"
      showCloseButton={false}
      closeOnBackdropPress={false}
      backgroundColor="rgba(0,0,0,0.95)"
      contentStyle={{
        backgroundColor: "#2c3e50",
        width: "100%",
        height: "100%",
        borderWidth: 0,
        borderRadius: 0,
        padding: 0,
        flex: 1,
        paddingTop: insets.top, // Respetar la barra superior
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
          borderBottomWidth: 1,
          borderBottomColor: "rgba(255,255,255,0.1)",
          backgroundColor: "rgba(241, 196, 15, 0.1)",
        }}
      >
        <Ionicons
          name="trophy"
          size={24}
          color="#f39c12"
          style={{ marginRight: 8 }}
        />
        <Typography
          variant="heading2"
          style={{
            color: "#fff",
            textAlign: "center",
            fontSize: 18,
            fontWeight: "700",
          }}
        >
          Fin de Ronda
        </Typography>
      </View>

      {/* Winner Announcement */}
      <View
        style={{
          padding: 12,
          alignItems: "center",
          backgroundColor: "rgba(241, 196, 15, 0.05)",
          borderBottomWidth: 1,
          borderBottomColor: "rgba(255,255,255,0.1)",
        }}
      >
        <Typography
          variant="heading3"
          style={{
            fontSize: 16,
            fontWeight: "600",
            color: "#f39c12",
            textAlign: "center",
            marginBottom: 2,
          }}
        >
          🎉 {winner?.name || winner?.username || "Jugador"} ganó la ronda
        </Typography>
        <Typography
          variant="body"
          style={{
            fontSize: 12,
            color: "#bdc3c7",
            textAlign: "center",
          }}
        >
          Ranking de puntuaciones (menor a mayor)
        </Typography>
      </View>

      {/* Scores Section */}
      <ScrollView
        style={{ flex: 1, padding: 12 }}
        showsVerticalScrollIndicator={false}
      >
        {sortedPlayers.map((player, index) => {
          const isEliminated =
            player.isEliminated || newlyEliminated.includes(player.id);
          const isWinner = player.isWinner;
          const avatarUrl = getAvatarUrl ? getAvatarUrl(player.username) : null;

          return (
            <View
              key={player.id}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 8,
                paddingHorizontal: 12,
                marginVertical: 2,
                backgroundColor: isWinner
                  ? "rgba(241, 196, 15, 0.15)"
                  : "rgba(255,255,255,0.05)",
                borderRadius: 8,
                borderLeftWidth: 3,
                borderLeftColor: isWinner
                  ? "#f39c12"
                  : isEliminated
                  ? "#e74c3c"
                  : "#3498db",
              }}
            >
              {/* Position */}
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: isWinner ? "#f39c12" : "#3498db",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 8,
                }}
              >
                <Typography
                  variant="body"
                  style={{
                    color: "#fff",
                    fontWeight: "700",
                    fontSize: 12,
                  }}
                >
                  {index + 1}
                </Typography>
              </View>

              {/* Avatar */}
              <View style={{ marginRight: 8 }}>
                {avatarUrl ? (
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      overflow: "hidden",
                      borderWidth: 2,
                      borderColor: isWinner
                        ? "#f39c12"
                        : isEliminated
                        ? "#e74c3c"
                        : "#fff",
                    }}
                  >
                    <Image
                      source={{ uri: avatarUrl }}
                      style={{ width: 32, height: 32 }}
                      resizeMode="cover"
                    />
                  </View>
                ) : (
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: isEliminated ? "#e74c3c" : "#555",
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 2,
                      borderColor: isWinner ? "#f39c12" : "#fff",
                    }}
                  >
                    <Typography
                      variant="body"
                      style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}
                    >
                      {(player.name || player.username || "?")[0].toUpperCase()}
                    </Typography>
                  </View>
                )}
              </View>

              {/* Player Info */}
              <View style={{ flex: 1 }}>
                <Typography
                  variant="body"
                  style={{
                    fontSize: 13,
                    fontWeight: isWinner ? "700" : "600",
                    color: isEliminated ? "#e74c3c" : "#fff",
                    marginBottom: 2,
                    textDecorationLine: isEliminated ? "line-through" : "none",
                  }}
                >
                  {player.name || player.username || "Jugador"}
                  {isEliminated && " (ELIMINADO)"}
                  {isWinner && " 👑"}
                </Typography>
                <Typography
                  variant="caption"
                  style={{
                    fontSize: 10,
                    color: "#bdc3c7",
                  }}
                >
                  Ronda: +{player.roundPoints || 0} | Total:{" "}
                  {player.totalPoints || 0}
                </Typography>
              </View>

              {/* Total Points */}
              <View
                style={{
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: 50,
                  paddingHorizontal: 6,
                }}
              >
                <Typography
                  variant="body"
                  style={{
                    fontSize: 16,
                    fontWeight: "700",
                    color: isWinner
                      ? "#f39c12"
                      : isEliminated
                      ? "#e74c3c"
                      : "#fff",
                  }}
                >
                  {player.totalPoints || 0}
                </Typography>
                <Typography
                  variant="caption"
                  style={{
                    fontSize: 10,
                    color: "#95a5a6",
                  }}
                >
                  pts
                </Typography>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Countdown Section */}
      <View
        style={{
          padding: 16,
          alignItems: "center",
          borderTopWidth: 1,
          borderTopColor: "rgba(255,255,255,0.1)",
          backgroundColor: "rgba(0,0,0,0.2)",
        }}
      >
        <Typography
          variant="body"
          style={{
            fontSize: 12,
            color: "#bdc3c7",
            marginBottom: 8,
            textAlign: "center",
          }}
        >
          Comenzando nueva ronda en
        </Typography>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: "#e67e22",
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 2,
            borderColor: "#fff",
          }}
        >
          <Typography
            variant="body"
            style={{
              fontSize: 16,
              fontWeight: "700",
              color: "#fff",
            }}
          >
            {countdown}
          </Typography>
        </View>
      </View>
    </Modal>
  );
};

export default RoundEndModal;
