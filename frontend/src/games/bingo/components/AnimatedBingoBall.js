import React from 'react';
import { View, Text, Platform } from 'react-native';
import Animated from 'react-native-reanimated';

function AnimatedBingoBallBase({ 
  ballAnimatedStyle, 
  lastBall, 
  style = {} 
}) {
  return (
    <View style={[{ alignItems:'center' }, style]}>
      <Animated.View style={[
        {
          width: 100, 
          height: 100, 
          borderRadius: 50, 
          backgroundColor: '#e74c3c', 
          borderWidth: 6, 
          borderColor: '#fff', 
          alignItems: 'center', 
          justifyContent: 'center', 
          shadowColor: '#e74c3c', 
          shadowOpacity: 0.3, 
          shadowRadius: 12, 
          shadowOffset: { width: 0, height: 4 }, 
          elevation: 8
        },
        ballAnimatedStyle
      ]}>
        <Text style={{ 
          color: '#fff', 
          fontSize: 56, 
          // Usar la fuente Mukta para los números de bolilla
          fontFamily: 'Mukta_700Bold',
          // Centrado vertical más preciso con Mukta
          lineHeight: 58,
          includeFontPadding: false, // Android
          textAlignVertical: 'center', // Android
          transform: [{ translateY: Platform.OS === 'android' ? 1 : 2 }],
          textShadowColor: 'rgba(0,0,0,0.3)',
          textShadowOffset: { width: 1, height: 1 },
          textShadowRadius: 2
        }}>
          {lastBall || '?'}
        </Text>
      </Animated.View>
    </View>
  );
}

// Evita re-render si no cambia lastBall ni el estilo animado
export const AnimatedBingoBall = React.memo(
  AnimatedBingoBallBase,
  (prev, next) => {
    return (
      prev.lastBall === next.lastBall &&
      prev.ballAnimatedStyle === next.ballAnimatedStyle
    );
  }
);
