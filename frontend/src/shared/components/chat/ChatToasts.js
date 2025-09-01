import React, { useEffect } from "react";
import { View } from "react-native";
import ChatToastItem from "./ChatToastItem";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAvatarSync } from "../../hooks";

export default function ChatToasts({ messages, onItemComplete }) {
  const insets = useSafeAreaInsets();
  const { syncAvatar } = useAvatarSync();

  // Sincronizar avatares de los mensajes de chat
  useEffect(() => {
    if (messages && Array.isArray(messages)) {
      messages.forEach((message) => {
        if (message.player?.username && message.player?.avatarId) {
          syncAvatar(message.player.username, message.player.avatarId);
        }
      });
    }
  }, [messages, syncAvatar]);

  if (!messages || messages.length === 0) return null;

  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: insets.top,
        alignItems: "flex-end",
        paddingHorizontal: 16,
        zIndex: 10000,
      }}
    >
      {messages.map((m) => (
        <ChatToastItem
          key={m.id}
          message={m}
          onComplete={() => onItemComplete?.(m.id)}
        />
      ))}
    </View>
  );
}
