import React, { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  interpolate,
  Extrapolate,
} from "react-native-reanimated";

/**
 * Componente de efectos especiales para cartas UNO
 * Muestra partículas o efectos especiales cuando se juegan cartas específicas
 */
export default function CardEffects({
  visible,
  cardType,
  color = "#FFD700",
  onComplete,
}) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0);
  const rotation = useSharedValue(0);

  // Diferentes efectos según el tipo de carta
  useEffect(() => {
    if (visible) {
      // Reset valores
      opacity.value = 0;
      scale.value = 0;
      rotation.value = 0;

      if (cardType === "wild" || cardType === "wild_draw4") {
        // Efecto rainbow/burst para cartas wild
        opacity.value = withTiming(1, { duration: 200 });
        scale.value = withSequence(
          withTiming(1.5, { duration: 400 }),
          withTiming(0, { duration: 300 })
        );
        rotation.value = withTiming(360, { duration: 700 });
      } else if (
        cardType === "draw2" ||
        cardType === "skip" ||
        cardType === "reverse"
      ) {
        // Efecto pulse para cartas especiales
        opacity.value = withTiming(1, { duration: 150 });
        scale.value = withSequence(
          withTiming(1.2, { duration: 200 }),
          withTiming(0, { duration: 250 })
        );
      } else {
        // Efecto simple para cartas numéricas
        opacity.value = withTiming(1, { duration: 100 });
        scale.value = withSequence(
          withTiming(1, { duration: 150 }),
          withTiming(0, { duration: 200 })
        );
      }

      // Auto-hide después de la animación
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 800);
    } else {
      opacity.value = withTiming(0, { duration: 100 });
      scale.value = withTiming(0, { duration: 100 });
    }
  }, [visible, cardType]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: scale.value }, { rotateZ: `${rotation.value}deg` }],
    };
  });

  if (!visible) return null;

  const getEffectColors = () => {
    if (cardType === "wild" || cardType === "wild_draw4") {
      return ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7"];
    }
    return [color];
  };

  const colors = getEffectColors();

  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <Animated.View style={[animatedStyle]}>
        {/* Círculos de efecto */}
        {colors.map((effectColor, index) => (
          <View
            key={index}
            style={{
              position: "absolute",
              width: 60 + index * 20,
              height: 60 + index * 20,
              borderRadius: (60 + index * 20) / 2,
              backgroundColor: effectColor,
              opacity: 0.3 - index * 0.05,
            }}
          />
        ))}

        {/* Estrella central para cartas especiales */}
        {(cardType === "wild" || cardType === "wild_draw4") && (
          <View
            style={{
              position: "absolute",
              width: 40,
              height: 40,
              backgroundColor: "#FFD700",
              opacity: 0.8,
              transform: [{ rotate: "45deg" }],
            }}
          />
        )}
      </Animated.View>
    </View>
  );
}
