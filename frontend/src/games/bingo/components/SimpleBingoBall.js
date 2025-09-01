import React, { useEffect, useRef, useState } from "react";
import { View, Text, Platform } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { getBingoColorByIndexOrNumber } from "./BingoCard";
import { useBingoUiStore } from "../stores";

let actualBall = null;
export function SimpleBingoBall({ style }) {
  const prevBall = useBingoUiStore((s) => s.prevBall);
  const currentBall = useBingoUiStore((s) => s.currentBall);

  // Estado local para controlar la animación secuencial
  const [showPrev, setShowPrev] = useState(false);
  const [showCurr, setShowCurr] = useState(true);
  const prevScale = useSharedValue(1);
  const prevOpacity = useSharedValue(1);
  const currScale = useSharedValue(1);
  const currOpacity = useSharedValue(1);
  const lastBall = useRef(null);

  useEffect(() => {
    if (
      !currentBall ||
      lastBall.current === currentBall ||
      actualBall === currentBall
    )
      return;

    // Mostrar bola anterior y ocultar la nueva
    setShowPrev(true);
    setShowCurr(false);
    prevScale.value = 1;
    prevOpacity.value = 1;
    currScale.value = 0.5;
    currOpacity.value = 0.5;

    // Animar salida de la bola anterior (más rápido)
    prevScale.value = withTiming(0.5, { duration: 350 });
    prevOpacity.value = withTiming(0.5, { duration: 350 }, (finished) => {
      if (finished) {
        // Cuando termina la animación de salida, ocultar la anterior y mostrar la nueva
        runOnJS(setShowPrev)(false);
        runOnJS(setShowCurr)(true);
        // Animar entrada de la nueva bola: pop a 1.2 y luego baja a 1
        currScale.value = withTiming(1.2, { duration: 250 }, (popDone) => {
          if (popDone) {
            currScale.value = withTiming(1, { duration: 200 });
          }
        });
        currOpacity.value = withTiming(1, { duration: 300 });
      }
    });

    lastBall.current = currentBall;
    actualBall = currentBall;
  }, [currentBall]);

  const prevStyle = useAnimatedStyle(() => ({
    opacity: prevOpacity.value,
    transform: [{ scale: prevScale.value }],
  }));
  const currStyle = useAnimatedStyle(() => ({
    opacity: currOpacity.value,
    transform: [{ scale: currScale.value }],
  }));

  const ballBase = {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 6,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
  };

  const renderBall = (ball, color, extraStyle) =>
    ball && (
      <Animated.View style={[ballBase, { backgroundColor: color }, extraStyle]}>
        <Text
          style={{
            color: "#fff",
            fontSize: 56,
            fontFamily: "Mukta_700Bold",
            lineHeight: 58,
            includeFontPadding: false,
            textAlignVertical: "center",
            transform: [{ translateY: Platform.OS === "android" ? 1 : 2 }],
            textShadowColor: "rgba(0,0,0,0.3)",
            textShadowOffset: { width: 1, height: 1 },
            textShadowRadius: 2,
          }}
        >
          {ball}
        </Text>
      </Animated.View>
    );

  return (
    <View
      style={[
        { alignItems: "center", justifyContent: "center", paddingTop: 100 },
        style,
      ]}
    >
      {showPrev &&
        renderBall(prevBall, getBingoColorByIndexOrNumber(prevBall), prevStyle)}
      {showCurr &&
        renderBall(
          currentBall,
          getBingoColorByIndexOrNumber(currentBall),
          currStyle
        )}
    </View>
  );
}
