import React, { useState, useEffect } from "react";
import { View, Image, Animated, Text } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Modal from "../../../shared/components/ui/Modal";
import Typography from "../../../shared/components/ui/Typography";
import Button from "../../../shared/components/ui/Button";

const ChallengeResultModal = ({
  visible,
  challengeResult,
  getAvatarUrl,
  onClose,
  currentColor, // Color actual de la mesa
}) => {
  const [phase, setPhase] = useState(1); // 1: mensaje inicial, 2: puntos animados, 3: resultado
  const [emojiScale] = useState(new Animated.Value(0));
  const [dotsAnimation] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible && challengeResult) {
      setPhase(1);

      // Después de 2 segundos, mostrar los puntos animados
      const timer1 = setTimeout(() => {
        setPhase(2);
        // Animar puntos por 2 segundos más
        Animated.loop(
          Animated.sequence([
            Animated.timing(dotsAnimation, {
              toValue: 1,
              duration: 500,
              useNativeDriver: false,
            }),
            Animated.timing(dotsAnimation, {
              toValue: 0,
              duration: 500,
              useNativeDriver: false,
            }),
          ]),
          { iterations: 2 }
        ).start();
      }, 2000);

      // Después de 4 segundos total, mostrar el resultado
      const timer2 = setTimeout(() => {
        setPhase(3);
        // Animar el emoji
        Animated.spring(emojiScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }).start();

        // Auto-cerrar después de 3 segundos en fase 3
        setTimeout(() => {
          onClose();
        }, 3000);
      }, 4000);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [visible, challengeResult, emojiScale, dotsAnimation]);

  useEffect(() => {
    if (!visible) {
      setPhase(1);
      emojiScale.setValue(0);
      dotsAnimation.setValue(0);
    }
  }, [visible, emojiScale, dotsAnimation]);

  if (!challengeResult) {
    return null;
  }

  const {
    challenger,
    target,
    wasValid,
    penalty,
    challengerName,
    targetName,
    challengerUsername,
    targetUsername,
  } = challengeResult;

  // Función para obtener avatar por ID de jugador
  const getPlayerAvatar = (playerId) => {
    if (playerId === challenger && challengerUsername) {
      return getAvatarUrl(challengerUsername);
    }
    if (playerId === target && targetUsername) {
      return getAvatarUrl(targetUsername);
    }
    return null;
  };

  // Lógica del resultado:
  // - El protagonista del resultado final siempre es el TARGET (quien fue desafiado)
  // - Si wasValid = true: el +4 era válido → target gana, challenger pierde
  // - Si wasValid = false: el +4 era inválido → challenger gana, target pierde
  const targetWins = wasValid; // Target gana si el +4 era válido
  const primaryColor = targetWins ? "#2ecc71" : "#e74c3c"; // Verde si target gana, rojo si pierde
  const emoji = targetWins ? "😉" : "😅"; // Guiño si gana, sonrisa nerviosa si pierde

  // El protagonista siempre es el target (quien fue desafiado)
  const protagonistName = targetName;
  const protagonistId = target;

  // Determinar quién roba cartas
  const loserName = targetWins ? challengerName : targetName;

  // Texto del resultado dirigido al target
  const resultText = wasValid
    ? "No podías jugar ninguna otra carta"
    : "Sí, podías jugar otra carta";

  // Función para mapear colores UNO a colores hexadecimales
  const getUnoColorHex = (color) => {
    const colorMap = {
      red: "#e74c3c",
      blue: "#3498db",
      green: "#27ae60",
      yellow: "#f1c40f",
      wild: "#9b59b6", // Púrpura para cartas wild
    };
    return colorMap[color?.toLowerCase()] || "#2c3e50"; // Gris por defecto
  };

  // Color de fondo del modal basado en el color actual de la mesa
  const modalBackgroundColor = currentColor
    ? getUnoColorHex(currentColor)
    : "#2c3e50";
  const modalBackgroundWithOpacity = `${modalBackgroundColor}F0`; // Agregar 94% opacidad

  const AnimatedDots = () => {
    const opacity1 = dotsAnimation.interpolate({
      inputRange: [0, 0.33, 0.66, 1],
      outputRange: [0.3, 1, 0.3, 0.3],
    });
    const opacity2 = dotsAnimation.interpolate({
      inputRange: [0, 0.33, 0.66, 1],
      outputRange: [0.3, 0.3, 1, 0.3],
    });
    const opacity3 = dotsAnimation.interpolate({
      inputRange: [0, 0.33, 0.66, 1],
      outputRange: [0.3, 0.3, 0.3, 1],
    });

    return (
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Animated.Text
          style={{ color: "#fff", fontSize: 40, opacity: opacity1 }}
        >
          •
        </Animated.Text>
        <Animated.Text
          style={{ color: "#fff", fontSize: 40, opacity: opacity2 }}
        >
          •
        </Animated.Text>
        <Animated.Text
          style={{ color: "#fff", fontSize: 40, opacity: opacity3 }}
        >
          •
        </Animated.Text>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      variant="centered"
      showCloseButton={false}
      closeOnBackdropPress={false}
      backgroundColor="rgba(0,0,0,0.95)"
      contentStyle={{
        backgroundColor: modalBackgroundWithOpacity,
        width: "95%",
        maxWidth: 420,
        borderWidth: 3,
        borderColor: phase === 3 ? primaryColor : modalBackgroundColor,
        alignItems: "center",
        paddingVertical: 24,
        paddingHorizontal: 20,
      }}
    >
      {/* CONTENIDO FIJO DE LA FASE 1 - SIEMPRE VISIBLE */}
      {/* Mensaje del desafío */}
      <Typography
        variant="heading3"
        style={{
          color: "#fff",
          textAlign: "center",
          marginBottom: 20,
        }}
      >
        🎯 DESAFÍO
      </Typography>

      <Typography
        variant="body"
        style={{
          color: "#ecf0f1",
          textAlign: "center",
          fontSize: 16,
          marginBottom: 12,
        }}
      >
        <Text style={{ color: "#e74c3c", fontWeight: "bold" }}>
          {challengerName}
        </Text>
        <Text style={{ color: "#ecf0f1" }}> desafía a </Text>
        <Text style={{ color: "#3498db", fontWeight: "bold" }}>
          {targetName}
        </Text>
      </Typography>

      {/* Avatar del desafiante */}
      <View style={{ alignItems: "center", marginBottom: 16 }}>
        {getPlayerAvatar(challenger) ? (
          <View
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              overflow: "hidden",
              borderWidth: 2,
              borderColor: "#e74c3c",
              marginBottom: 8,
            }}
          >
            <Image
              source={{ uri: getPlayerAvatar(challenger) }}
              style={{ width: 100, height: 100 }}
              resizeMode="cover"
            />
          </View>
        ) : (
          <View
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: "#e74c3c",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 2,
              borderColor: "#fff",
              marginBottom: 8,
            }}
          >
            <Typography variant="body" style={{ color: "#fff", fontSize: 28 }}>
              {challengerName?.[0]?.toUpperCase() || "?"}
            </Typography>
          </View>
        )}
        <Typography
          variant="body"
          style={{ color: "#e74c3c", fontWeight: "bold", fontSize: 14 }}
        >
          {challengerName}
        </Typography>
      </View>

      <Typography
        variant="body"
        style={{
          color: "#fff",
          textAlign: "center",
          fontSize: 14,
          marginBottom: 16,
        }}
      >
        "Te desafío, ¿podías jugar otra carta?"
      </Typography>

      {/* Avatar del desafiado */}
      <View style={{ alignItems: "center", marginBottom: 20 }}>
        {getPlayerAvatar(target) ? (
          <View
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              overflow: "hidden",
              borderWidth: 3,
              borderColor: "#3498db",
              marginBottom: 8,
            }}
          >
            <Image
              source={{ uri: getPlayerAvatar(target) }}
              style={{ width: 100, height: 100 }}
              resizeMode="cover"
            />
          </View>
        ) : (
          <View
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: "#3498db",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 3,
              borderColor: "#fff",
              marginBottom: 8,
            }}
          >
            <Typography
              variant="heading2"
              style={{ color: "#fff", fontSize: 28 }}
            >
              {targetName?.[0]?.toUpperCase() || "?"}
            </Typography>
          </View>
        )}
        <Typography
          variant="body"
          style={{ color: "#3498db", fontWeight: "bold", fontSize: 16 }}
        >
          {targetName}
        </Typography>
      </View>

      {/* CONTENIDO DINÁMICO BASADO EN LA FASE */}
      {phase === 2 && (
        // Fase 2: Agregar puntos animados debajo del contenido fijo
        <View style={{ alignItems: "center", marginBottom: 20 }}>
          <Typography
            variant="body"
            style={{
              color: "#f39c12",
              textAlign: "center",
              fontSize: 14,
              marginBottom: 10,
            }}
          >
            Evaluando...
          </Typography>
          <AnimatedDots />
        </View>
      )}

      {phase === 3 && (
        // Fase 3: Mostrar resultado debajo del contenido fijo
        <View style={{ alignItems: "center" }}>
          {/* Mensaje del resultado con emoji */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 8,
              justifyContent: "center",
            }}
          >
            <Animated.Text
              style={{
                fontSize: 24,
                marginRight: 8,
                transform: [{ scale: emojiScale }],
              }}
            >
              {emoji}
            </Animated.Text>
            <Typography
              variant="body"
              style={{
                color: "#fff",
                textAlign: "center",
                fontSize: 16,
              }}
            >
              {resultText}
            </Typography>
          </View>

          <Typography
            variant="body"
            style={{
              color: "#ecf0f1",
              textAlign: "center",
              fontSize: 14,
              marginBottom: 20,
            }}
          >
            <Typography style={{ color: "#e74c3c", fontWeight: "bold" }}>
              {loserName}
            </Typography>
            {` robó ${penalty} cartas`}
          </Typography>
        </View>
      )}
    </Modal>
  );
};

export default ChallengeResultModal;
