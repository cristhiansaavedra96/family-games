import React, { useState } from "react";
import { View, ScrollView, TouchableOpacity, Image } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Modal from "../../../shared/components/ui/Modal";
import Typography from "../../../shared/components/ui/Typography";
import Button from "../../../shared/components/ui/Button";
import { ChatPanel } from "../../../shared/components";

const UnoGameSummaryModal = ({
  visible,
  players,
  winner,
  finalGameData,
  playersReady,
  me,
  onClose,
  onPlayAgain,
  onSendMessage,
  getAvatarUrl, // Añadir getAvatarUrl como prop
}) => {
  const [chatVisible, setChatVisible] = useState(false);

  // Usar finalGameData.playersWithScores si está disponible, sino usar players
  const playersSource = finalGameData?.playersWithScores || players;

  const playersWithPoints =
    playersSource
      ?.map((player) => {
        return {
          ...player,
          // En UNO, los puntos ya vienen calculados desde el backend
          points: player.totalPoints || player.points || 0,
          isWinner: player.id === winner,
          avatarUrl:
            player.avatarId && getAvatarUrl
              ? getAvatarUrl(player.username)
              : null,
        };
      })
      .sort((a, b) => {
        if (a.isWinner && !b.isWinner) return -1;
        if (!a.isWinner && b.isWinner) return 1;
        return a.points - b.points; // En UNO menor puntuación es mejor
      }) || [];

  const winnerPlayer = playersWithPoints.find((p) => p.isWinner);

  const renderPlayerItem = (player, index) => {
    const isReady = playersReady[player.id];
    const isWinnerCard = player.isWinner;
    let badgeColor = "#8f5cff";
    let badgeShadow = "#3d246c";
    let borderBottom = "#8f5cff";

    if (index === 0) {
      badgeColor = "#d7263d";
      badgeShadow = "#7c1622";
      borderBottom = "#d7263d";
    } else if (index === 1) {
      badgeColor = "#00bfff";
      badgeShadow = "#005f87";
      borderBottom = "#00bfff";
    } else if (index === 2) {
      badgeColor = "#e0e0e0";
      badgeShadow = "#888";
      borderBottom = "#e0e0e0";
    }

    return (
      <View
        key={player.id}
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 12,
          paddingHorizontal: 14,
          marginBottom: 12,
          backgroundColor: "#122436ff",
          borderRadius: 14,
          borderWidth: 1.2,
          borderColor: "#232526",
          shadowColor: badgeShadow,
          shadowOpacity: 0.13,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
          elevation: 3,
          borderBottomWidth: 3,
          borderBottomColor: borderBottom,
          minHeight: 70,
        }}
      >
        <View style={{ width: 40, alignItems: "center", marginRight: 12 }}>
          <View
            style={{
              backgroundColor: badgeColor,
              borderRadius: 14,
              width: 32,
              height: 32,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 2,
              shadowColor: badgeShadow,
              shadowOpacity: 0.7,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
              elevation: 6,
            }}
          >
            <Typography
              variant="body"
              style={{
                color: "#fff",
                fontWeight: "700",
                textShadowColor: "#000",
                textShadowOffset: { width: 1, height: 1 },
                textShadowRadius: 2,
              }}
            >
              {index + 1}
            </Typography>
            {isWinnerCard && (
              <MaterialCommunityIcons
                name="crown"
                size={16}
                color="#ffd700"
                style={{ position: "absolute", top: -8, right: -8 }}
              />
            )}
          </View>
        </View>

        {player.avatarUrl ? (
          <Image
            source={{ uri: player.avatarUrl }}
            style={{
              width: 50,
              height: 50,
              borderRadius: 25,
              marginRight: 14,
              borderWidth: 2,
              borderColor: "#e0e0e0",
              backgroundColor: "#181818",
            }}
          />
        ) : (
          <View
            style={{
              width: 50,
              height: 50,
              borderRadius: 25,
              marginRight: 14,
              backgroundColor: "#8f5cff",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 2,
              borderColor: "#e0e0e0",
            }}
          >
            <Typography
              variant="heading3"
              style={{ color: "#fff", fontWeight: "700" }}
            >
              {player?.name?.[0]?.toUpperCase() ||
                player?.username?.[0]?.toUpperCase() ||
                "?"}
            </Typography>
          </View>
        )}

        <View style={{ flex: 1, minHeight: 36, justifyContent: "center" }}>
          <Typography
            variant="body"
            style={{
              color: "#fff",
              fontWeight: "700",
              marginBottom: 2,
              textShadowColor: "#000",
              textShadowRadius: 2,
            }}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {player.name || player.username}
          </Typography>
          <Typography
            variant="caption"
            style={{ color: "#ff1744", marginBottom: 1 }}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            Puntos Finales:{" "}
            <Typography
              variant="caption"
              style={{
                fontWeight: "700",
                color:
                  player.points <= 100
                    ? "#4caf50"
                    : player.points <= 300
                    ? "#ff9800"
                    : "#f44336",
              }}
            >
              {player.points}
            </Typography>
            {isWinnerCard && (
              <Typography
                variant="caption"
                style={{ color: "#ffd700", fontWeight: "700" }}
              >
                {" "}
                | ¡GANADOR!
              </Typography>
            )}
          </Typography>
        </View>

        {isReady && (
          <View
            style={{
              backgroundColor: "#27ae60",
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 8,
              marginLeft: 8,
            }}
          >
            <Typography
              variant="caption"
              style={{ color: "white", fontWeight: "600" }}
            >
              Listo
            </Typography>
          </View>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      variant="fullscreen"
      showCloseButton={false}
      closeOnBackdropPress={false}
      backgroundColor="rgba(0,0,0,0.9)"
      contentStyle={{ backgroundColor: "#e6ecf5", flex: 1 }}
    >
      <View
        style={{
          backgroundColor: "#d7263d",
          paddingTop: 30,
          paddingBottom: 30,
          paddingHorizontal: 20,
          borderBottomLeftRadius: 20,
          borderBottomRightRadius: 20,
          alignItems: "center",
        }}
      >
        {winnerPlayer ? (
          <View style={{ alignItems: "center" }}>
            <MaterialCommunityIcons
              name="crown"
              size={40}
              color="#ffd700"
              style={{ marginBottom: 10 }}
            />
            <Typography
              variant="heading2"
              style={{ color: "#fff", textAlign: "center", marginBottom: 5 }}
            >
              🎉 ¡GANADOR! 🎉
            </Typography>
            <Typography
              variant="heading3"
              style={{ color: "#ffd700", textAlign: "center", marginBottom: 5 }}
            >
              {winnerPlayer.name || winnerPlayer.username}
            </Typography>
          </View>
        ) : (
          <View style={{ alignItems: "center" }}>
            <Typography
              variant="heading3"
              style={{ color: "#fff", textAlign: "center" }}
            >
              🎯 Resumen del Juego
            </Typography>
            <Typography
              variant="body"
              style={{ color: "#e0e0e0", textAlign: "center", marginTop: 5 }}
            >
              Sin ganador
            </Typography>
          </View>
        )}
      </View>

      <View
        style={{
          backgroundColor: "#e6ecf5",
          paddingHorizontal: 16,
          paddingTop: 20,
          flex: 1,
        }}
      >
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {playersWithPoints.map((player, index) =>
            renderPlayerItem(player, index)
          )}
        </ScrollView>
      </View>

      <View
        style={{
          backgroundColor: "#e6ecf5",
          flexDirection: "row",
          gap: 16,
          paddingHorizontal: 20,
          paddingVertical: 20,
          paddingBottom: 24,
        }}
      >
        <Button
          title="Salir"
          variant="danger"
          size="medium"
          onPress={onClose}
          style={{ flex: 1 }}
          leftIcon={<Ionicons name="exit-outline" size={18} color="#fff" />}
        />
        <Button
          title={playersReady[me] ? "Esperando..." : "Volver a Jugar"}
          variant={playersReady[me] ? "secondary" : "success"}
          size="medium"
          onPress={onPlayAgain}
          disabled={playersReady[me]}
          style={{ flex: 1 }}
          leftIcon={
            <Ionicons
              name={playersReady[me] ? "hourglass-outline" : "refresh"}
              size={18}
              color="#fff"
            />
          }
        />
      </View>

      <TouchableOpacity
        onPress={() => setChatVisible(true)}
        style={{
          position: "absolute",
          right: 20,
          bottom: 32 + 64,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: "#3498db",
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#000",
          shadowOpacity: 0.2,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
          elevation: 6,
        }}
        activeOpacity={0.85}
      >
        <Ionicons name="chatbubbles" size={24} color="#fff" />
      </TouchableOpacity>

      <ChatPanel
        isVisible={chatVisible}
        onClose={() => setChatVisible(false)}
        onSendMessage={(msg) => {
          onSendMessage && onSendMessage(msg);
          setChatVisible(false);
        }}
      />
    </Modal>
  );
};

export default UnoGameSummaryModal;
