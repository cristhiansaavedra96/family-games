// Versión paso a paso para identificar el problema de recursión
import React, { useEffect, useState, useRef, useMemo } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import socket from "../../../core/socket";
import { useBingoUiStore } from "../stores";
import { useAvatarSync } from "../../../shared/hooks";
import { useMyAvatar } from "../../../shared/hooks";
import { useBingoSound } from "../hooks/useBingoSound";

export default function GameStepByStep() {
  console.log("🐛 GameStepByStep renderizando...");

  const params = useLocalSearchParams();
  const [state, setState] = useState({
    roomId: null,
    players: [],
    drawn: [],
    lastBall: null,
  });

  const [me, setMe] = useState(null);

  // PASO 3: Agregar Zustand stores
  const currentBallUi = useBingoUiStore((s) => s.currentBall);
  const prevBallUi = useBingoUiStore((s) => s.prevBall);
  const setBall = useBingoUiStore((s) => s.setBall);
  const clearBalls = useBingoUiStore((s) => s.clearBalls);

  // PASO 4: Agregar hooks de avatar
  const { syncPlayers, getAvatarUrl, syncAvatar, setLocalAvatarUrl } =
    useAvatarSync();
  const { myAvatar, myUsername, myName } = useMyAvatar();

  // PASO 5: Agregar hook de sonido (SOSPECHOSO)
  const {
    startBackground,
    stopBackground,
    musicMuted,
    setMusicMuted,
    effectsMuted,
    setEffectsMuted,
    playEffect,
    assetsReady,
  } = useBingoSound();

  // PASO 1: Solo el useEffect básico del socket
  useEffect(() => {
    console.log("🐛 PASO 1: useEffect de socket básico");

    socket.on("state", (s) => {
      console.log("🐛 Estado recibido:", s);
      setState(s);

      // PASO 4: Sincronizar avatares cuando cambia el estado
      if (s.players && Array.isArray(s.players)) {
        console.log(
          "🐛 Sincronizando avatares para",
          s.players.length,
          "jugadores"
        );
        syncPlayers(s.players);
      }
    });

    socket.on("ball", (n) => {
      console.log("🐛 Bola recibida:", n);
      setState((prevState) => ({
        ...prevState,
        lastBall: n,
        drawn: [...(prevState.drawn || []), n],
      }));

      // PASO 3: Actualizar Zustand store
      setBall(n);
    });

    // Si ya está conectado, usa socket.id actual
    setMe(socket.id);

    // Solicita el estado actual de la sala
    socket.emit("getState", { roomId: params.roomId });

    socket.on("joined", ({ id }) => {
      console.log("🐛 Joined con ID:", id);
      setMe(id);
    });

    return () => {
      console.log("🐛 Limpiando listeners de socket");
      socket.off("state");
      socket.off("ball");
      socket.off("joined");
    };
  }, []); // Array de dependencias vacío

  // PASO 6: useEffect para música de fondo (SOSPECHOSO)
  useEffect(() => {
    console.log("🐛 PASO 6: useEffect música de fondo - iniciar");
    if (!musicMuted && assetsReady) {
      startBackground();
    }
    return () => {
      console.log("🐛 PASO 6: useEffect música de fondo - limpiar");
      stopBackground();
    };
  }, [assetsReady]); // Solo dependemos de assetsReady

  // PASO 7: useEffect para cambios de mute música (SOSPECHOSO)
  useEffect(() => {
    console.log("🐛 PASO 7: useEffect cambio mute música");
    if (!assetsReady) return;

    if (musicMuted) {
      stopBackground();
    } else {
      startBackground();
    }
  }, [musicMuted, assetsReady]); // Removemos las funciones como dependencias

  // PASO 2: useMemo para myPlayer
  const myPlayer = useMemo(() => {
    console.log("🐛 PASO 2: Calculando myPlayer");
    const player = state.players.find((p) => p.id === me);
    if (player) {
      // Si tenemos datos del hook useMyAvatar, usarlos como backup
      return {
        ...player,
        name: player.name || myName || null,
        username: player.username || myUsername || null,
      };
    }
    // Si no encontramos el jugador en el estado, crear uno temporal con datos del hook
    return {
      id: me,
      name: myName || null,
      username: myUsername || null,
      avatarId: null,
      cards: [],
    };
  }, [state.players, me, myName, myUsername]);

  console.log("🐛 Estado actual:", {
    roomId: state.roomId,
    playersCount: state.players.length,
    me,
    myPlayerCards: myPlayer.cards.length,
    currentBallUi,
    prevBallUi,
    myAvatar: myAvatar ? "sí" : "no",
    myUsername,
    myName,
    assetsReady,
    musicMuted,
    effectsMuted,
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#2c3e50" }}>
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
      >
        <Text style={{ color: "white", fontSize: 24, marginBottom: 20 }}>
          🐛 Step by Step Debug
        </Text>
        <Text
          style={{
            color: "white",
            fontSize: 16,
            textAlign: "center",
            marginBottom: 10,
          }}
        >
          Room ID: {params.roomId || "null"}
        </Text>
        <Text
          style={{
            color: "white",
            fontSize: 16,
            textAlign: "center",
            marginBottom: 10,
          }}
        >
          Estado Room ID: {state.roomId || "null"}
        </Text>
        <Text
          style={{
            color: "white",
            fontSize: 16,
            textAlign: "center",
            marginBottom: 10,
          }}
        >
          My ID: {me || "null"}
        </Text>
        <Text
          style={{
            color: "white",
            fontSize: 16,
            textAlign: "center",
            marginBottom: 10,
          }}
        >
          Jugadores: {state.players.length}
        </Text>
        <Text
          style={{
            color: "white",
            fontSize: 16,
            textAlign: "center",
            marginBottom: 10,
          }}
        >
          Mis cartas: {myPlayer.cards.length}
        </Text>
        <Text
          style={{
            color: "white",
            fontSize: 16,
            textAlign: "center",
            marginBottom: 10,
          }}
        >
          Última bola: {state.lastBall || "ninguna"}
        </Text>
        <Text
          style={{
            color: "white",
            fontSize: 16,
            textAlign: "center",
            marginBottom: 10,
          }}
        >
          Bolas cantadas: {state.drawn.length}
        </Text>
        <Text
          style={{
            color: "white",
            fontSize: 16,
            textAlign: "center",
            marginBottom: 10,
          }}
        >
          Current Ball UI: {currentBallUi}
        </Text>
        <Text
          style={{
            color: "white",
            fontSize: 16,
            textAlign: "center",
            marginBottom: 40,
          }}
        >
          Prev Ball UI: {prevBallUi}
        </Text>

        <TouchableOpacity
          onPress={() => {
            router.replace("/gameSelect");
          }}
          style={{
            backgroundColor: "#e74c3c",
            padding: 15,
            borderRadius: 10,
            marginBottom: 10,
          }}
        >
          <Text style={{ color: "white", fontSize: 18, fontWeight: "bold" }}>
            Volver a Game Select
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            console.log("🐛 Estado completo:", state);
            console.log("🐛 Socket ID:", socket.id);
            console.log("🐛 Me:", me);
          }}
          style={{
            backgroundColor: "#3498db",
            padding: 10,
            borderRadius: 10,
          }}
        >
          <Text style={{ color: "white", fontSize: 16, fontWeight: "bold" }}>
            Log Estado en Consola
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
