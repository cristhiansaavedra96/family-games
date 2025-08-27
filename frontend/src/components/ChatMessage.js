import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, Animated } from 'react-native';

export default function ChatMessage({ message, onComplete }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-50)).current;

  useEffect(() => {
    if (!message) return;

    console.log('ChatMessage rendering with:', message);

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
    }, 4000);

    return () => clearTimeout(timer);
  }, [message, fadeAnim, slideAnim, onComplete]);

  if (!message) return null;

  return (
    <Animated.View
      style={{
        position: 'absolute',
  top: 100,
  left: 0,
  right: 0,
  alignItems: 'flex-end',
  paddingHorizontal: 20,
        zIndex: 9999,
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <View style={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 16,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        maxWidth: 250,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
  elevation: 8
      }}>
        {/* Avatar del usuario */}
        <Image
          source={{ uri: message.player.avatarUrl || `https://i.pravatar.cc/40?u=${message.player.id}` }}
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            marginRight: 10
          }}
        />
        
  {/* Contenido del mensaje */}
  <View style={{ flexShrink: 1 }}>
          <Text style={{
            fontSize: 10,
            fontWeight: '600',
            color: '#7f8c8d',
            marginBottom: 2,
            fontFamily: 'Montserrat_600SemiBold'
          }}>
            {message.player.name}
          </Text>
          
          {message.type === 'emoji' ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 18, marginRight: 6 }}>
                {message.content}
              </Text>
              <Text style={{
                fontSize: 12,
                color: '#2c3e50',
                fontFamily: 'Montserrat_500Medium'
              }}>
                {message.label}
              </Text>
            </View>
          ) : (
            <Text style={{
              fontSize: 13,
              color: '#2c3e50',
              fontWeight: '500',
              fontFamily: 'Montserrat_500Medium'
            }}>
              {message.content}
            </Text>
          )}
        </View>
      </View>
    </Animated.View>
  );
}
