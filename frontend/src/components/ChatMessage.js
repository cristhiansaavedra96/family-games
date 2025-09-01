import React, { useState, useEffect, useRef } from "react";
import { View, Text, Image, Animated } from "react-native";
import { useAvatarSync } from "../hooks/useAvatarSync";

export default function ChatMessage({ message, onComplete }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-50)).current;
  const { getAvatarUrl, syncAvatar } = useAvatarSync();

  useEffect(() => {
    if (!message) return;
    // Sincronizar avatar si tenemos avatarId válido pero no está en caché
    if (message.player?.avatarId && message.player?.username) {
      // No intentar sincronizar avatarIds temporales (local_*)
      if (!message.player.avatarId.startsWith("local_")) {
        const currentAvatarUrl = getAvatarUrl(message.player.username);
        if (!currentAvatarUrl) {
          syncAvatar(message.player.username, message.player.avatarId);
        }
      }
    }

    // Reset de las animaciones
    fadeAnim.setValue(0);
    slideAnim.setValue(-50);

    // Animación de entrada
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-ocultar después de 4 segundos
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -50,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onComplete?.();
      });
    }, 6000);

    return () => clearTimeout(timer);
  }, [message, fadeAnim, slideAnim, onComplete]);

  if (!message) return null;

  return (
    <Animated.View
      style={{
        position: "absolute",
        top: 100,
        left: 0,
        right: 0,
        alignItems: "flex-end",
        paddingHorizontal: 20,
        zIndex: 9999,
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <View
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          borderRadius: 16,
          padding: 12,
          flexDirection: "row",
          alignItems: "center",
          maxWidth: 250,
          shadowColor: "#000",
          shadowOpacity: 0.15,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
          elevation: 8,
        }}
      >
        {/* Avatar del usuario */}
        {getAvatarUrl(message.player?.username) ? (
          <Image
            source={{ uri: getAvatarUrl(message.player.username) }}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              marginRight: 10,
            }}
          />
        ) : (
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              marginRight: 10,
              backgroundColor: "#f0f0f0",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 16, color: "#666" }}>👤</Text>
          </View>
        )}

        {/* Contenido del mensaje */}
        <View style={{ flexShrink: 1 }}>
          <Text
            style={{
              fontSize: 10,
              fontWeight: "600",
              color: "#7f8c8d",
              marginBottom: 2,
              fontFamily: "Montserrat_600SemiBold",
            }}
          >
            {message.player.name}
          </Text>

          {message.type === "emoji" ? (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={{ fontSize: 18, marginRight: 6 }}>
                {message.content}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: "#2c3e50",
                  fontFamily: "Montserrat_500Medium",
                }}
              >
                {message.label}
              </Text>
            </View>
          ) : (
            <Text
              style={{
                fontSize: 13,
                color: "#2c3e50",
                fontWeight: "500",
                fontFamily: "Montserrat_500Medium",
              }}
            >
              {message.content}
            </Text>
          )}
        </View>
      </View>
    </Animated.View>
  );
}
