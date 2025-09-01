import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ChatButton({ onPress, style = {} }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        position: 'absolute',
        bottom: 20,
        left: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#3498db',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 8,
        zIndex: 100,
        ...style
      }}
      activeOpacity={0.8}
    >
      <Ionicons name="chatbubbles" size={24} color="white" />
    </TouchableOpacity>
  );
}
