import React, { useEffect, useRef } from 'react';
import { View, Text, Image, Animated } from 'react-native';

export default function ChatToastItem({ message, onComplete }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-10)).current;
  const onCompleteRef = useRef(onComplete);

  // Mantener la última referencia de onComplete sin reiniciar animaciones
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!message) return;

    // Entrada
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

    // Salida automática
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
      ]).start(() => {
        onCompleteRef.current?.();
      });
    }, 3000);

    return () => clearTimeout(timer);
  }, [message && message.id]);

  if (!message) return null;

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
          backgroundColor: 'rgba(255,255,255,0.96)',
          borderRadius: 14,
          paddingVertical: 8,
          paddingHorizontal: 10,
          flexDirection: 'row',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOpacity: 0.12,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 3 },
          elevation: 6,
        }}
      >
        <Image
          source={{ uri: message.player?.avatarUrl || `https://i.pravatar.cc/40?u=${message.player?.id}` }}
          style={{ width: 28, height: 28, borderRadius: 14, marginRight: 8 }}
        />
        <View style={{ flexShrink: 1 }}>
          <Text
            style={{
              fontSize: 10,
              fontWeight: '600',
              color: '#7f8c8d',
              marginBottom: 2,
              fontFamily: 'Montserrat_600SemiBold',
            }}
            numberOfLines={1}
          >
            {message.player?.name}
          </Text>
          {message.type === 'emoji' ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1 }}>
              <Text style={{ fontSize: 16, marginRight: 6 }}>{message.content}</Text>
              {!!message.label && (
                <Text
                  style={{ fontSize: 12, color: '#2c3e50', fontFamily: 'Montserrat_500Medium' }}
                  numberOfLines={2}
                >
                  {message.label}
                </Text>
              )}
            </View>
          ) : (
            <Text
              style={{ fontSize: 12.5, color: '#2c3e50', fontFamily: 'Montserrat_500Medium' }}
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
