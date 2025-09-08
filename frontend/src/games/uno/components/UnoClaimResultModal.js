import React, { useState, useEffect } from "react";
import { View, Image, Animated, Text } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Modal from "../../../shared/components/ui/Modal";
import Typography from "../../../shared/components/ui/Typography";
import Button from "../../../shared/components/ui/Button";

const UnoClaimResultModal = ({
  visible,
  unoClaimResult,
  getAvatarUrl,
  onClose,
  currentColor, // Color actual de la mesa
}) => {
  const [phase, setPhase] = useState(1); // 1: mensaje inicial, 2: resultado (sin evaluando)
  const [emojiScale] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible && unoClaimResult) {
      setPhase(1);

      // Después de 2 segundos, mostrar el resultado directamente
      const timer = setTimeout(() => {
        setPhase(2);
        // Animar el emoji
        Animated.spring(emojiScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }).start();

        // Auto-cerrar después de 3 segundos en fase 2 (5 segundos total)
        setTimeout(() => {
          onClose();
        }, 3000);
      }, 2000);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [visible, unoClaimResult, emojiScale]);

  useEffect(() => {
    if (!visible) {
      setPhase(1);
      emojiScale.setValue(0);
    }
  }, [visible, emojiScale]);

  if (!unoClaimResult) {
    return null;
  }

  const {
    claimer,
    target,
    wasValid,
    penalty,
    claimerName,
    targetName,
    claimerUsername,
    targetUsername,
    // Formato actual del GameScreen
    byPlayerId,
    byPlayerName,
    targetPlayerId,
    targetPlayerName,
    success,
  } = unoClaimResult;

  // Adaptar el formato actual a las props esperadas
  const finalClaimer = claimer || byPlayerId;
  const finalTarget = target || targetPlayerId;
  const finalClaimerName = claimerName || byPlayerName;
  const finalTargetName = targetName || targetPlayerName;
  const finalWasValid = wasValid !== undefined ? wasValid : success; // Si success=true, significa que la acusación era válida
  const finalPenalty = penalty || 2;

  // Función para obtener avatar por ID de jugador
  const getPlayerAvatar = (playerId) => {
    // El acusador usa claimerUsername, el objetivo usa targetUsername
    if (playerId === finalClaimer && claimerUsername) {
      return getAvatarUrl(claimerUsername);
    }
    if (playerId === finalTarget && targetUsername) {
      return getAvatarUrl(targetUsername);
    }
    return null;
  };

  // Lógica del resultado:
  // - finalWasValid = true: la acusación era válida → target no dijo UNO → target pierde
  // - finalWasValid = false: la acusación era inválida → target sí dijo UNO → claimer pierde
  const claimerWins = finalWasValid; // Acusador gana si la acusación era válida
  const primaryColor = claimerWins ? "#2ecc71" : "#e74c3c"; // Verde si acusador gana, rojo si pierde
  const emoji = claimerWins ? "🎯" : "😅"; // Objetivo si gana la acusación, sonrisa nerviosa si se equivoca

  // Determinar quién roba cartas
  const loserName = claimerWins ? finalTargetName : finalClaimerName;

  // Texto del resultado
  const resultText = finalWasValid
    ? "¡No había dicho UNO!"
    : "Sí había dicho UNO";

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

  // Color de fondo del modal - siempre oscuro para UNO claims
  const modalBackgroundColor = "#2c3e50"; // Gris oscuro fijo
  const modalBackgroundWithOpacity = `${modalBackgroundColor}F0`; // Agregar 94% opacidad

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
        borderColor: phase === 2 ? primaryColor : modalBackgroundColor,
        alignItems: "center",
        paddingVertical: 24,
        paddingHorizontal: 20,
      }}
    >
      {/* CONTENIDO FIJO DE LA FASE 1 - SIEMPRE VISIBLE */}
      {/* Mensaje de la acusación */}
      <Typography
        variant="heading3"
        style={{
          color: "#fff",
          textAlign: "center",
          marginBottom: 20,
        }}
      >
        🚨 ACUSACIÓN UNO
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
          {finalClaimerName}
        </Text>
        <Text style={{ color: "#ecf0f1" }}> acusa a </Text>
        <Text style={{ color: "#3498db", fontWeight: "bold" }}>
          {finalTargetName}
        </Text>
      </Typography>

      {/* Avatar del acusador */}
      <View style={{ alignItems: "center", marginBottom: 16 }}>
        {getPlayerAvatar(finalClaimer) ? (
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
              source={{ uri: getPlayerAvatar(finalClaimer) }}
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
              {finalClaimerName?.[0]?.toUpperCase() || "?"}
            </Typography>
          </View>
        )}
        <Typography
          variant="body"
          style={{ color: "#e74c3c", fontWeight: "bold", fontSize: 14 }}
        >
          {finalClaimerName}
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
        "¡No dijiste UNO!"
      </Typography>

      {/* Avatar del acusado */}
      <View style={{ alignItems: "center", marginBottom: 20 }}>
        {getPlayerAvatar(finalTarget) ? (
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
              source={{ uri: getPlayerAvatar(finalTarget) }}
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
              {finalTargetName?.[0]?.toUpperCase() || "?"}
            </Typography>
          </View>
        )}
        <Typography
          variant="body"
          style={{ color: "#3498db", fontWeight: "bold", fontSize: 16 }}
        >
          {finalTargetName}
        </Typography>
      </View>

      {/* CONTENIDO DINÁMICO BASADO EN LA FASE */}
      {phase === 2 && (
        // Fase 2: Mostrar resultado directamente
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
            <Text style={{ color: "#e74c3c", fontWeight: "bold" }}>
              {loserName}
            </Text>
            <Text
              style={{ color: "#ecf0f1" }}
            >{` robó ${finalPenalty} cartas`}</Text>
          </Typography>
        </View>
      )}
    </Modal>
  );
};

export default UnoClaimResultModal;
