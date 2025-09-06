import React, { useEffect, useRef } from "react";
import { View, Text, Image, Animated } from "react-native";
import { useAvatarSync } from "../../hooks";

export default function ChatToastItem({ message, onComplete }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-10)).current;
  const onCompleteRef = useRef(onComplete);
  const { getAvatarUrl, syncAvatar } = useAvatarSync();

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!message) return;

    if (message.player?.avatarId && message.player?.username) {
      if (!message.player.avatarId.startsWith("local_")) {
        const currentAvatarUrl = getAvatarUrl(message.player.username);
        if (!currentAvatarUrl) {
          syncAvatar(message.player.username, message.player.avatarId);
        }
      }
    }

    fadeAnim.setValue(0);
    slideAnim.setValue(-10);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();

    const displayMs = message.type === "system-disconnect" ? 3500 : 5000;
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -10,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => onCompleteRef.current?.());
    }, displayMs);

    return () => clearTimeout(timer);
  }, [message && message.id]);

  if (!message) return null;

  const isSystemDisconnect = message.type === "system-disconnect";
  const reason = message?.meta?.reason; // left | kick | timeout
  const avatarUrl = getAvatarUrl(message.player?.username);
  const showAvatar = !!avatarUrl; // ahora también para system-disconnect

  // Paleta por tipo de motivo
  const reasonStyles = (() => {
    if (!isSystemDisconnect) {
      return {
        containerBg: "#ffffff",
        accentColor: "#3498db",
        textColor: "#2c3e50",
        badgeBg: "#3498db",
      };
    }
    switch (reason) {
      case "left":
        return {
          containerBg: "#fff8e6",
          accentColor: "#d35400",
          textColor: "#d35400",
          badgeBg: "#f39c12",
        };
      case "kick":
        return {
          containerBg: "#ffeef0",
          accentColor: "#c0392b",
          textColor: "#c0392b",
          badgeBg: "#e74c3c",
        };
      case "timeout":
        return {
          containerBg: "#eef6ff",
          accentColor: "#2c3e50",
          textColor: "#2c3e50",
          badgeBg: "#3498db",
        };
      default:
        return {
          containerBg: "#f0f4f5",
          accentColor: "#34495e",
          textColor: "#34495e",
          badgeBg: "#95a5a6",
        };
    }
  })();

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
        marginTop: 8,
        maxWidth: 260,
      }}
    >
      <View
        style={{
          backgroundColor: reasonStyles.containerBg,
          borderRadius: 16,
          paddingVertical: 9,
          paddingHorizontal: 12,
          flexDirection: "row",
          alignItems: "center",
          shadowColor: "#000",
          shadowOpacity: 0.15,
          shadowRadius: 7,
          shadowOffset: { width: 0, height: 4 },
          elevation: 7,
          borderWidth: 1,
          borderColor: isSystemDisconnect
            ? reasonStyles.accentColor + "40"
            : reasonStyles.accentColor + "33",
        }}
      >
        {showAvatar ? (
          <Image
            source={{ uri: avatarUrl }}
            style={{ width: 32, height: 32, borderRadius: 16, marginRight: 8 }}
          />
        ) : (
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              marginRight: 8,
              backgroundColor: "#e0e0e0",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 16, color: "#666" }}>👤</Text>
          </View>
        )}
        <View style={{ flexShrink: 1 }}>
          {isSystemDisconnect ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 2,
              }}
            >
              <View
                style={{
                  backgroundColor: reasonStyles.badgeBg,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 8,
                  marginRight: 6,
                }}
              >
                <Text
                  style={{
                    fontSize: 9,
                    fontWeight: "700",
                    color: "#fff",
                    fontFamily: "Montserrat_700Bold",
                    textTransform: "uppercase",
                  }}
                >
                  {reason === "kick"
                    ? "EXPULSADO"
                    : reason === "left"
                    ? "SALIDA"
                    : reason === "timeout"
                    ? "CONEXIÓN"
                    : "EVENTO"}
                </Text>
              </View>
              {!!message.player?.name && (
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "700",
                    color: reasonStyles.accentColor,
                    fontFamily: "Montserrat_600SemiBold",
                  }}
                  numberOfLines={1}
                >
                  {message.player.name}
                </Text>
              )}
            </View>
          ) : !!message.player?.name ? (
            <Text
              style={{
                fontSize: 11,
                fontWeight: "700",
                color: reasonStyles.accentColor,
                fontFamily: "Montserrat_600SemiBold",
                marginBottom: 2,
              }}
              numberOfLines={1}
            >
              {message.player.name}
            </Text>
          ) : null}
          {message.type === "emoji" ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                flexShrink: 1,
              }}
            >
              <Text style={{ fontSize: 16, marginRight: 6 }}>
                {message.content}
              </Text>
              {!!message.label && (
                <Text
                  style={{
                    fontSize: 12,
                    color: "#2c3e50",
                    fontFamily: "Montserrat_500Medium",
                  }}
                  numberOfLines={2}
                >
                  {message.label}
                </Text>
              )}
            </View>
          ) : (
            <Text
              style={{
                fontSize: 12.5,
                color: isSystemDisconnect ? reasonStyles.textColor : "#2c3e50",
                fontFamily: isSystemDisconnect
                  ? "Montserrat_600SemiBold"
                  : "Montserrat_500Medium",
              }}
              numberOfLines={3}
            >
              {message.content}
            </Text>
          )}
        </View>
      </View>
    </Animated.View>
  );
}
