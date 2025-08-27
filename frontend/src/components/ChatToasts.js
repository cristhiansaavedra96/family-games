import React from 'react';
import { View } from 'react-native';
import ChatToastItem from './ChatToastItem';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ChatToasts({ messages, onItemComplete }) {
  const insets = useSafeAreaInsets();
  if (!messages || messages.length === 0) return null;

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: insets.top,
        alignItems: 'flex-end',
        paddingHorizontal: 16,
        zIndex: 10000,
      }}
    >
      {messages.map((m) => (
        <ChatToastItem key={m.id} message={m} onComplete={() => onItemComplete?.(m.id)} />
      ))}
    </View>
  );
}
