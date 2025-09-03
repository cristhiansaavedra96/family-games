// 🎮 PANTALLA PRINCIPAL DEL TRUCO
// Pantalla del juego de Truco Uruguayo

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  BackHandler,
  Alert,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChatPanel, ChatButton, ChatToasts } from "../../../shared/components";
import {
  TrucoCard,
  PlayerHand,
  GameTable,
  ScoreBoard,
  CollapsibleActionButton,
} from "../components";
import { useTrucoGame } from "../hooks";
import { useTrucoUiStore } from "../stores";

export default function TrucoGameScreen() {
  const insets = useSafeAreaInsets();
  const { roomId } = useLocalSearchParams();

  // Stores and hooks
  const uiStore = useTrucoUiStore();
  const trucoGame = useTrucoGame(roomId);

  // Local state
  const [showChat, setShowChat] = useState(false);

  // Handle back button
  useEffect(() => {
    const backAction = () => {
      Alert.alert(
        "Salir del juego",
        "¿Estás seguro de que quieres salir del juego?",
        [
          {
            text: "Cancelar",
            onPress: () => null,
            style: "cancel",
          },
          {
            text: "Salir",
            onPress: () => {
              trucoGame.leaveGame();
              router.back();
            },
          },
        ]
      );
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, []);

  // Handle card selection
  const handleCardPress = (card) => {
    if (!trucoGame.canPlay) {
      Alert.alert("Aviso", "No es tu turno o no puedes jugar una carta ahora");
      return;
    }

    if (
      uiStore.selectedCard?.value === card.value &&
      uiStore.selectedCard?.suit === card.suit
    ) {
      // If the same card is selected, play it
      trucoGame.playCard(card);
    } else {
      // Select the card
      uiStore.setSelectedCard(card);
    }
  };

  // Handle game actions
  const handleAction = (action) => {
    console.log("🎯 Acción solicitada:", action);
    trucoGame.performAction(action);
  };

  // Render different states
  if (!trucoGame.isConnected) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Conectando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (trucoGame.gameState === "waiting") {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.waitingContainer}>
          <Text style={styles.waitingTitle}>Esperando jugadores...</Text>
          <Text style={styles.waitingText}>
            Jugadores: {trucoGame.players.length}/2
          </Text>
          <Text style={styles.helpText}>El Truco se juega con 2 jugadores</Text>
          {trucoGame.players.map((player, index) => (
            <Text key={player.id || index} style={styles.playerText}>
              {player.name || `Jugador ${index + 1}`}
            </Text>
          ))}
        </View>
      </SafeAreaView>
    );
  }

  if (trucoGame.gameState === "finished") {
    const winnerTeam = trucoGame.scores[0] >= 30 ? 0 : 1;
    const isWinner = trucoGame.myTeam?.id === winnerTeam;

    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.gameOverContainer}>
          <Text style={styles.gameOverTitle}>
            {isWinner ? "🏆 ¡Ganaste!" : "😔 Perdiste"}
          </Text>
          <Text style={styles.finalScore}>
            Puntuación final: {trucoGame.scores[0]} - {trucoGame.scores[1]}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Marcador compacto */}
        <ScoreBoard
          scores={trucoGame.scores}
          teams={trucoGame.teams}
          players={trucoGame.players}
          myPlayerId={trucoGame.myPlayerId}
          currentPlayer={trucoGame.currentPlayer}
          hand={trucoGame.hand}
          round={trucoGame.round}
          style={styles.scoreBoard}
        />

        {/* Mesa de juego */}
        <GameTable
          playedCards={trucoGame.playedCards}
          muestra={trucoGame.muestra}
          players={trucoGame.players}
          currentRound={trucoGame.round}
          style={styles.gameTable}
        />

        {/* Mi mano */}
        <PlayerHand
          cards={trucoGame.myHand}
          onCardPress={handleCardPress}
          selectedCard={uiStore.selectedCard}
          playableCards={trucoGame.canPlay ? trucoGame.myHand : []}
          title="Tu mano"
          style={styles.playerHand}
        />

        {/* Información adicional */}
        <View style={styles.gameInfo}>
          <Text style={styles.infoText}>
            {trucoGame.isMyTurn
              ? "🎯 Tu turno"
              : `Turno de ${
                  trucoGame.players.find(
                    (p) => p.id === trucoGame.currentPlayer
                  )?.name || "Otro jugador"
                }`}
          </Text>

          {trucoGame.envidoState.myEnvido > 0 && (
            <Text style={styles.infoText}>
              💎 Tu envido: {trucoGame.envidoState.myEnvido}
            </Text>
          )}

          {trucoGame.florState.hasFlor && (
            <Text style={styles.infoText}>🌸 ¡Tienes FLOR!</Text>
          )}
        </View>

        {/* Espacio adicional para el botón flotante */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Botón de acciones colapsible */}
      <CollapsibleActionButton
        availableActions={trucoGame.availableActions}
        onAction={handleAction}
        trucoState={trucoGame.trucoState}
        envidoState={trucoGame.envidoState}
        florState={trucoGame.florState}
        canPlayCard={trucoGame.canPlay}
      />

      {/* Chat */}
      <ChatButton onPress={() => setShowChat(true)} style={styles.chatButton} />

      {showChat && (
        <ChatPanel
          roomId={roomId}
          onClose={() => setShowChat(false)}
          style={styles.chatPanel}
        />
      )}

      <ChatToasts />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a5d1a", // Verde oscuro como mesa de juego
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    padding: 12,
    paddingBottom: 100, // Espacio para los botones flotantes
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  loadingText: {
    fontSize: 18,
    color: "#ffffff",
    textAlign: "center",
  },

  waitingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  waitingTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 20,
  },

  waitingText: {
    fontSize: 16,
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 8,
  },

  helpText: {
    fontSize: 14,
    color: "#cccccc",
    textAlign: "center",
    marginBottom: 20,
    fontStyle: "italic",
  },

  playerText: {
    fontSize: 14,
    color: "#cccccc",
    textAlign: "center",
    marginVertical: 2,
  },

  gameOverContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  gameOverTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 20,
  },

  finalScore: {
    fontSize: 18,
    color: "#ffffff",
    textAlign: "center",
  },

  scoreBoard: {
    marginBottom: 8,
  },

  gameTable: {
    marginBottom: 12,
    minHeight: 280,
  },

  playerHand: {
    marginBottom: 12,
  },

  gameInfo: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },

  infoText: {
    fontSize: 14,
    color: "#333",
    textAlign: "center",
    marginVertical: 2,
  },

  bottomSpacer: {
    height: 80,
  },

  chatButton: {
    position: "absolute",
    bottom: 90,
    right: 20,
  },

  chatPanel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    top: "30%",
  },
});
