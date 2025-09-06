import React from "react";
import { View, ScrollView, Dimensions, Image, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Modal from "../../../shared/components/ui/Modal";
import Typography from "../../../shared/components/ui/Typography";

const { width: screenWidth } = Dimensions.get("window");

// Modal de lista de jugadores (mismo estilo que NumbersModal)
const PlayersModal = ({
  visible,
  onClose,
  players = [],
  hostId,
  me,
  getAvatarUrl,
  title = "Jugadores",
}) => {
  const modalWidth = screenWidth * 0.95;
  return (
    <Modal
      visible={visible}
      onClose={onClose}
      variant="centered"
      title={`${title} (${players.length})`}
      showCloseButton
      closeOnBackdropPress
      backgroundColor="rgba(0,0,0,0.4)"
      contentStyle={{ width: modalWidth }}
    >
      <ScrollView
        style={{ width: "100%" }}
        contentContainerStyle={{ paddingBottom: 8 }}
        showsVerticalScrollIndicator={false}
      >
        {players.map((p) => {
          const isHost = p.id === hostId;
          const isMe = p.id === me;
          const avatarUri = p.avatarId && getAvatarUrl?.(p.username);
          return (
            <View
              key={p.id}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#f8f9fa",
                borderRadius: 16,
                paddingVertical: 10,
                paddingHorizontal: 12,
                marginBottom: 8,
                borderWidth: 1,
                borderColor: "#e3e6e8",
              }}
            >
              {avatarUri ? (
                <Image
                  source={{ uri: avatarUri }}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    marginRight: 12,
                    borderWidth: 2,
                    borderColor: isHost ? "#e74c3c" : "#3498db",
                  }}
                />
              ) : (
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: "#dfe6e9",
                    marginRight: 12,
                    justifyContent: "center",
                    alignItems: "center",
                    borderWidth: 2,
                    borderColor: isHost ? "#e74c3c" : "#3498db",
                  }}
                >
                  <Text style={{ fontSize: 18 }}>👤</Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Typography
                  variant="body"
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: "#2c3e50",
                    marginBottom: 4,
                  }}
                  numberOfLines={1}
                >
                  {p.name || p.username || "Jugador"}
                </Typography>
                <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                  {isHost && (
                    <View
                      style={{
                        flexDirection: "row",
                        backgroundColor: "#e74c3c",
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 8,
                        marginRight: 6,
                        marginTop: 2,
                        alignItems: "center",
                      }}
                    >
                      <Ionicons
                        name="flame"
                        size={10}
                        color="#fff"
                        style={{ marginRight: 4 }}
                      />
                      <Text
                        style={{
                          fontSize: 10,
                          color: "#fff",
                          fontWeight: "700",
                        }}
                      >
                        ANFITRIÓN
                      </Text>
                    </View>
                  )}
                  {isMe && (
                    <View
                      style={{
                        backgroundColor: "#27ae60",
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 8,
                        marginTop: 2,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 10,
                          color: "#fff",
                          fontWeight: "700",
                        }}
                      >
                        TÚ
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          );
        })}
        {players.length === 0 && (
          <View style={{ alignItems: "center", paddingVertical: 30 }}>
            <Ionicons name="people" size={40} color="#bdc3c7" />
            <Text style={{ marginTop: 8, color: "#7f8c8d" }}>
              Sin jugadores
            </Text>
          </View>
        )}
      </ScrollView>
    </Modal>
  );
};

export default PlayersModal;
