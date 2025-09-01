import React, { useEffect, useState } from "react";
import { View, Text, Image, FlatList, TouchableOpacity } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, router } from "expo-router";
import socket from "../src/core/socket";

export default function Leaderboard() {
  const { gameKey } = useLocalSearchParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    socket.emit("getLeaderboard", { gameKey: gameKey || "bingo" }, (res) => {
      setLoading(false);
      if (res?.ok) setItems(res.leaderboard || []);
    });
  }, [gameKey]);

  const renderItem = ({ item, index }) => {
    // Badge de color y efecto para top 3
    let badgeColor = "#8f5cff"; // púrpura eléctrico
    let badgeShadow = "#3d246c";
    let borderBottom = "#8f5cff";
    if (index === 0) {
      badgeColor = "#d7263d";
      badgeShadow = "#7c1622";
      borderBottom = "#d7263d";
    } // rojo oscuro
    else if (index === 1) {
      badgeColor = "#00bfff";
      badgeShadow = "#005f87";
      borderBottom = "#00bfff";
    } // azul eléctrico
    else if (index === 2) {
      badgeColor = "#e0e0e0";
      badgeShadow = "#888";
      borderBottom = "#e0e0e0";
    } // gris claro

    // Degradado simulado con dos colores
    const cardBg = [
      "linear-gradient(90deg, #232526 0%, #414345 100%)", // fallback para web
      { backgroundColor: "#232526" },
    ];

    return (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 12,
          paddingHorizontal: 14,
          marginBottom: 14,
          backgroundColor: "#122436ff",
          borderRadius: 14,
          borderWidth: 1.2,
          borderColor: "#232526",
          shadowColor: badgeShadow,
          shadowOpacity: 0.13,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
          elevation: 3,
          position: "relative",
          overflow: "hidden",
          borderBottomWidth: 3,
          borderBottomColor: borderBottom,
          minHeight: 80,
          maxHeight: 110,
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
            <Text
              style={{
                fontFamily: "Montserrat_700Bold",
                color: "#fff",
                fontSize: 16,
                textShadowColor: "#000",
                textShadowOffset: { width: 1, height: 1 },
                textShadowRadius: 2,
              }}
            >
              {index + 1}
            </Text>
            {index === 0 && (
              <MaterialCommunityIcons
                name="lightning-bolt"
                size={16}
                color="#fff"
                style={{
                  position: "absolute",
                  top: -8,
                  right: -8,
                  textShadowColor: "#ff1744",
                  textShadowRadius: 6,
                }}
              />
            )}
          </View>
        </View>
        {item.avatarUrl ? (
          <Image
            source={{ uri: item.avatarUrl }}
            style={{
              width: 65,
              height: 65,
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
            <Text
              style={{
                color: "#fff",
                fontFamily: "Montserrat_700Bold",
                fontSize: 24,
              }}
            >
              {item?.name?.[0]?.toUpperCase() || "?"}
            </Text>
          </View>
        )}
        <View style={{ flex: 1, minHeight: 36, justifyContent: "center" }}>
          <Text
            style={{
              fontFamily: "Montserrat_700Bold",
              color: "#fff",
              fontSize: 16,
              marginBottom: 2,
              textShadowColor: "#000",
              textShadowRadius: 2,
            }}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {item.name || "—"}
          </Text>
          <Text
            style={{
              fontFamily: "Montserrat_400Regular",
              color: "#ff1744",
              fontSize: 13,
              marginBottom: 1,
            }}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            Puntos:{" "}
            <Text
              style={{ fontFamily: "Montserrat_700Bold", color: "#ffd700" }}
            >
              {item.points}
            </Text>
          </Text>
          <Text
            style={{
              fontFamily: "Montserrat_400Regular",
              color: "#e0e0e0",
              fontSize: 12,
            }}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            Partidas:{" "}
            <Text style={{ color: "#fff", fontFamily: "Montserrat_700Bold" }}>
              {item.totalGames ?? 0}
            </Text>{" "}
            | Ganadas:{" "}
            <Text
              style={{ color: "#a259f7", fontFamily: "Montserrat_700Bold" }}
            >
              {item.wins ?? 0}
            </Text>
          </Text>
        </View>
      </View>
    );
  };

  return (
    <>
      <StatusBar style="light" />
      <View style={{ flex: 1, backgroundColor: "#e6ecf5" }}>
        <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>
          <View style={{ flex: 1 }}>
            {/* Header visual grande y consistente */}
            <View
              style={{
                backgroundColor: "#2c3e50",
                paddingTop: 80,
                paddingBottom: 40,
                paddingHorizontal: 20,
                borderBottomLeftRadius: 30,
                borderBottomRightRadius: 30,
                marginTop: -40,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <TouchableOpacity
                onPress={() => router.back()}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: "rgba(255,255,255,0.2)",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.3)",
                }}
              >
                <Ionicons name="arrow-back" size={20} color="white" />
              </TouchableOpacity>
              <Text
                style={{
                  color: "#fff",
                  fontFamily: "Montserrat_700Bold",
                  fontSize: 22,
                  flex: 1,
                  textAlign: "center",
                }}
              >
                Ranking {gameKey || "bingo"}
              </Text>
              <View style={{ width: 40, height: 40, marginLeft: 12 }} />
            </View>
            <View style={{ flex: 1, backgroundColor: "#e6ecf5" }}>
              {loading ? (
                <Text
                  style={{
                    color: "#7f8c8d",
                    fontFamily: "Montserrat_400Regular",
                    padding: 16,
                  }}
                >
                  Cargando...
                </Text>
              ) : (
                <FlatList
                  data={items}
                  keyExtractor={(it, i) => `${it.id || it.username || i}-${i}`}
                  renderItem={renderItem}
                  contentContainerStyle={{
                    paddingBottom: 16,
                    paddingTop: 24,
                    paddingHorizontal: 16,
                  }}
                />
              )}
            </View>
          </View>
        </SafeAreaView>
      </View>
    </>
  );
}
