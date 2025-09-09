import React, { useEffect, useState } from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

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
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: "#3498db" }]}
          onPress={onChatToggle}
        >
          <Ionicons name="chatbubbles" size={18} color="white" />
        </TouchableOpacity>

        {/* Contenedor para los botones de acción centrales */}
        <View style={{ flexDirection: "row", gap: 10 }}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.dangerBtn]}
            onPress={onChallenge}
          >
            <Text style={styles.actionText}>Desafiar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: "#8e44ad" }]}
            onPress={onDraw}
          >
            <Text style={styles.actionText}>{drawLabel}</Text>
          </TouchableOpacity>
        </View>

        {/* Espaciador a la derecha para balance */}
        <View style={{ width: 40 }} />
      </View>
    );
  }

  // Botón Robar visible en mi turno (si hay acumulación draw2/draw4 stacking y soy el jugador actual)
  const showDraw = isMyTurn;
  const drawLabel = pending > 0 ? `Tomar +${pending}` : "Robar";

  return (
    <View style={styles.actionBarContainer}>
      {/* Botón de chat a la izquierda */}
      <TouchableOpacity
        style={[styles.actionBtn, { backgroundColor: "#3498db" }]}
        onPress={onChatToggle}
      >
        <Ionicons name="chatbubbles" size={18} color="white" />
      </TouchableOpacity>

      {/* Contenedor para los botones de acción centrales */}
      <View style={{ flexDirection: "row", gap: 10 }}>
        {showDraw && (
          <TouchableOpacity
            style={[
              styles.actionBtn,
              pending > 0 && { backgroundColor: "#8e44ad" },
            ]}
            onPress={onDraw}
          >
            <Text style={styles.actionText}>{drawLabel}</Text>
          </TouchableOpacity>
        )}
        {canDeclareUno && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.warnBtn]}
            onPress={onDeclareUno}
          >
            <Text style={styles.actionText}>Decir UNO</Text>
          </TouchableOpacity>
        )}
        {playersToClaimUno.length > 0 && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.dangerBtn]}
            onPress={() => {
              // Reclamar al primer jugador de la lista
              const targetUnoPlayer = playersToClaimUno[0];
              if (targetUnoPlayer && onClaimUno) {
                onClaimUno(targetUnoPlayer.playerId);
              }
            }}
          >
            <Text style={styles.actionText}>Acusar</Text>
          </TouchableOpacity>
        )}
        {canChallenge && !challengeActive && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.dangerBtn]}
            onPress={onChallenge}
          >
            <Text style={styles.actionText}>Desafiar +4</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Espaciador a la derecha para balance */}
      <View style={{ width: 40 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  actionBarContainer: {
    flexDirection: "row",
    justifyContent: "space-between", // Cambiado de space-around a space-between
    alignItems: "center",
    height: 56, // Altura fija para evitar layout shifts
    paddingHorizontal: 12,
    backgroundColor: "rgba(17,17,17,0.2)", // Reducida opacidad a 0.2
    borderTopWidth: 1,
    borderTopColor: "#222",
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  actionBtn: {
    backgroundColor: "#34495e",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  actionText: { color: "#fff", fontWeight: "600" },
  disabledBtn: { opacity: 0.35 },
  dangerBtn: { backgroundColor: "#c0392b" },
  successBtn: { backgroundColor: "#16a085" },
  warnBtn: { backgroundColor: "#f39c12" },
});
