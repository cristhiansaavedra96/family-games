import React, { useEffect, useState, useRef } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

// Componente de botón mejorado con gradiente y animaciones
const EnhancedButton = ({
  onPress,
  colors,
  children,
  style,
  disabled = false,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePress = () => {
    // Animación de "bounce" al presionar
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 300,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();

    // Ejecutar la función onPress después de un pequeño delay
    setTimeout(() => {
      if (onPress) onPress();
    }, 50);
  };

  return (
    <Animated.View
      style={[
        styles.buttonWrapper,
        style,
        {
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={1} // Manejamos la opacidad con nuestra animación
      >
        <LinearGradient
          colors={disabled ? ["#555", "#444"] : colors}
          style={styles.gradientButton}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {children}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function ActionBar({
  isMyTurn,
  hand,
  publicState,
  me,
  otherPlayers,
  onDraw,
  onDeclareUno,
  onChallenge,
  onAcceptWild4,
  onChatToggle,
  playersWithOneCard,
  onClaimUno,
  socket,
  roomId,
}) {
  // Estado local para jugadores que pueden ser reclamados por UNO
  const [claimableUnoPlayers, setClaimableUnoPlayers] = useState([]);

  // Escuchar eventos de UNO del backend en lugar de hacer polling
  // BACKEND DEBE IMPLEMENTAR:
  // - "unoClaimWindowOpen" -> { playerId, playerName, gracePeriodMs }
  // - "unoClaimWindowClosed" -> { playerId, reason: "declared"|"claimed"|"expired" }
  useEffect(() => {
    if (!socket) return;

    const handleUnoClaimWindowOpen = (data) => {
      console.log("[UNO] Claim window opened:", data);
      setClaimableUnoPlayers((prev) => [
        ...prev.filter((p) => p.playerId !== data.playerId), // Remover duplicados
        {
          playerId: data.playerId,
          playerName: data.playerName,
          openedAt: Date.now(),
        },
      ]);
    };

    const handleUnoClaimWindowClosed = (data) => {
      console.log("[UNO] Claim window closed:", data);
      setClaimableUnoPlayers((prev) =>
        prev.filter((p) => p.playerId !== data.playerId)
      );
    };

    // Limpiar ventanas de UNO cuando cambia el estado del juego
    const handleGameStateChange = () => {
      // Si no hay jugadores en estado UNO, limpiar la lista
      const unoData = publicState.uno || [];
      if (unoData.length === 0) {
        setClaimableUnoPlayers([]);
      }
    };

    socket.on("unoClaimWindowOpen", handleUnoClaimWindowOpen);
    socket.on("unoClaimWindowClosed", handleUnoClaimWindowClosed);
    socket.on("state", handleGameStateChange);

    return () => {
      socket.off("unoClaimWindowOpen", handleUnoClaimWindowOpen);
      socket.off("unoClaimWindowClosed", handleUnoClaimWindowClosed);
      socket.off("state", handleGameStateChange);
    };
  }, [socket, publicState.uno]);

  const unoData = publicState.uno || [];
  const myHandSize = hand.length;
  const pending = publicState.pendingDrawCount;
  const pendingType = publicState.pendingDrawType;
  const challenge = publicState.wild4Challenge;

  const canDeclareUno =
    myHandSize === 1 && unoData.find((u) => u.playerId === me && !u.declared);

  // Challenge activo para mí (soy target del +4 y aún dentro de ventana)
  const challengeActive = challenge && challenge.targetPlayer === me;

  // Puedo desafiar si hay un challenge activo y estoy en la lista de elegibles
  const canChallenge =
    challenge &&
    challenge.eligibleChallengers &&
    challenge.eligibleChallengers.includes(me);

  // Detectar jugadores que pueden ser reclamados por UNO (ahora basado en eventos)
  const playersToClaimUno = claimableUnoPlayers.filter((unoPlayer) => {
    // Verificar que el jugador sigue en la partida
    const player = otherPlayers.find((p) => p.id === unoPlayer.playerId);
    return player !== undefined;
  });

  // Log simplificado - solo cuando hay cambios
  useEffect(() => {
    if (playersToClaimUno.length > 0) {
      console.log(
        `[UNO] Jugadores reclamables:`,
        playersToClaimUno.map((p) => p.playerName)
      );
    }
  }, [playersToClaimUno.length]);

  // Caso especial: si challengeActive => reemplazamos Robar por botones Desafiar / Tomar +N
  // 'Tomar +N' ejecuta onDraw (paga las cartas acumuladas) y avanza turno.
  // Mientras dure el challenge no mostramos declarar UNO ni acusar.
  if (challengeActive) {
    const drawLabel = pending > 0 ? `Tomar +${pending}` : "Tomar +4";
    return (
      <View style={styles.actionBarContainer}>
        {/* Botón de chat a la izquierda */}
        <EnhancedButton onPress={onChatToggle} colors={["#3498db", "#2980b9"]}>
          <Ionicons name="chatbubbles" size={18} color="white" />
        </EnhancedButton>

        {/* Contenedor para los botones de acción centrales */}
        <View style={{ flexDirection: "row", gap: 12 }}>
          <EnhancedButton onPress={onChallenge} colors={["#e74c3c", "#c0392b"]}>
            <View style={styles.buttonContent}>
              <Ionicons name="flash" size={16} color="white" />
              <Text style={styles.actionText}>Desafiar</Text>
            </View>
          </EnhancedButton>
          <EnhancedButton onPress={onDraw} colors={["#9b59b6", "#8e44ad"]}>
            <View style={styles.buttonContent}>
              <Ionicons name="hand-left" size={16} color="white" />
              <Text style={styles.actionText}>{drawLabel}</Text>
            </View>
          </EnhancedButton>
        </View>

        {/* Espaciador a la derecha para balance */}
        <View style={{ width: 50 }} />
      </View>
    );
  }

  // Botón Robar visible en mi turno (si hay acumulación draw2/draw4 stacking y soy el jugador actual)
  const showDraw = isMyTurn;
  const drawLabel = pending > 0 ? `Tomar +${pending}` : "Robar";

  return (
    <View style={styles.actionBarContainer}>
      {/* Botón de chat a la izquierda */}
      <EnhancedButton onPress={onChatToggle} colors={["#3498db", "#2980b9"]}>
        <Ionicons name="chatbubbles" size={18} color="white" />
      </EnhancedButton>

      {/* Contenedor para los botones de acción centrales */}
      <View style={{ flexDirection: "row", gap: 12 }}>
        {showDraw && (
          <EnhancedButton
            onPress={onDraw}
            colors={
              pending > 0 ? ["#9b59b6", "#8e44ad"] : ["#34495e", "#2c3e50"]
            }
          >
            <View style={styles.buttonContent}>
              <Ionicons
                name={pending > 0 ? "hand-left" : "add-circle"}
                size={16}
                color="white"
              />
              <Text style={styles.actionText}>{drawLabel}</Text>
            </View>
          </EnhancedButton>
        )}
        {canDeclareUno && (
          <EnhancedButton
            onPress={onDeclareUno}
            colors={["#f39c12", "#e67e22"]}
          >
            <View style={styles.buttonContent}>
              <Ionicons name="warning" size={16} color="white" />
              <Text style={styles.actionText}>Decir UNO</Text>
            </View>
          </EnhancedButton>
        )}
        {playersToClaimUno.length > 0 && (
          <EnhancedButton
            onPress={() => {
              // Reclamar al primer jugador de la lista
              const targetUnoPlayer = playersToClaimUno[0];
              if (targetUnoPlayer && onClaimUno) {
                onClaimUno(targetUnoPlayer.playerId);
              }
            }}
            colors={["#e74c3c", "#c0392b"]}
          >
            <View style={styles.buttonContent}>
              <Ionicons name="alert-circle" size={16} color="white" />
              <Text style={styles.actionText}>Acusar</Text>
            </View>
          </EnhancedButton>
        )}
        {canChallenge && !challengeActive && (
          <EnhancedButton onPress={onChallenge} colors={["#e74c3c", "#c0392b"]}>
            <View style={styles.buttonContent}>
              <Ionicons name="flash" size={16} color="white" />
              <Text style={styles.actionText}>Desafiar +4</Text>
            </View>
          </EnhancedButton>
        )}
      </View>

      {/* Espaciador a la derecha para balance */}
      <View style={{ width: 50 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  actionBarContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 64, // Aumentada altura para acomodar botones más grandes
    paddingHorizontal: 12,
    backgroundColor: "rgba(17,17,17,0.2)",
    borderTopWidth: 1,
    borderTopColor: "#222",
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  buttonWrapper: {
    borderRadius: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  gradientButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
    textAlign: "center",
  },
  // Estilos legacy mantenidos para compatibilidad
  actionBtn: {
    backgroundColor: "#34495e",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  disabledBtn: { opacity: 0.35 },
  dangerBtn: { backgroundColor: "#c0392b" },
  successBtn: { backgroundColor: "#16a085" },
  warnBtn: { backgroundColor: "#f39c12" },
});
